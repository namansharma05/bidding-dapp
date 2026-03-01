import { useEffect, useState } from "react";
import { OpeningBidModal } from "./OpeningBidModal";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import { supabase } from "../utils/supabaseClient";
import * as anchor from "@coral-xyz/anchor";
import IDL_JSON from "../idl/bidding.json";
import { Bidding } from "../idl/bidding";
import { AuctionCard } from "./AuctionCard";

interface Auction {
  id: string;
  name: string;
  description: string;
  image_url: string;
  opening_bid: number;
  created_at: string;
  duration: number;
  minimum_increment: number;
  highest_bid: number;
  creator_wallet: string;
  item_id: number;
  highest_bidder: string;
  settled: boolean;
}

const Store = () => {
  const { publicKey, connected } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [auctions, setAuctions] = useState<Auction[]>([]);

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [settleError, setSettleError] = useState<string | null>(null);

  const wallet = useAnchorWallet();

  const settleAuctions = async () => {
    if (!wallet || !publicKey) {
      alert("Please connect your wallet");
      return;
    }

    const network = "https://api.devnet.solana.com";
    const connection = new Connection(network, "processed");

    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      anchor.AnchorProvider.defaultOptions(),
    );

    const program = new anchor.Program<Bidding>(
      IDL_JSON as unknown as Bidding,
      provider,
    );
    const timeNow = new Date().getTime();
    let settledCount = 0;

    setSettleError(null);

    // Use for...of to settle auctions sequentially
    for (const auction of auctions) {
      const auctionEndTime =
        new Date(auction.created_at).getTime() + auction.duration * 1000;

      if (auctionEndTime < timeNow && !auction.settled) {
        console.log(`Checking auction status: ${auction.name} (${auction.id})`);

        // Case: Auction ended with no bids (highest bidder is System Program)
        if (auction.highest_bidder === "11111111111111111111111111111111") {
          console.log(
            `Auction ${auction.name} ended with no bids. Cleaning up.`,
          );
          const { error: deleteError } = await supabase
            .from("auctions")
            .delete()
            .eq("id", auction.id);

          if (deleteError) {
            console.error(
              `Error deleting unbid auction ${auction.name}:`,
              deleteError,
            );
            setSettleError(`Failed to clean up unbid auction: ${auction.name}`);
          } else {
            settledCount++;
          }
          continue; // Skip further settlement logic for this auction
        }

        try {
          const [itemAccountPda] = anchor.web3.PublicKey.findProgramAddressSync(
            [
              Buffer.from("item"),
              new anchor.BN(auction.item_id).toArrayLike(Buffer, "le", 2),
            ],
            program.programId,
          );

          const [escrowAccountPda] =
            anchor.web3.PublicKey.findProgramAddressSync(
              [
                Buffer.from("escrow"),
                new PublicKey(auction.creator_wallet).toBuffer(),
                new anchor.BN(auction.item_id).toArrayLike(Buffer, "le", 2),
              ],
              program.programId,
            );

          const sign = await program.methods
            .transferItemToWinner(
              new anchor.BN(auction.item_id),
              new PublicKey(auction.highest_bidder),
            )
            .accounts({
              authority: publicKey,
              itemAccount: itemAccountPda,
              auctionCreator: new PublicKey(auction.creator_wallet),
              escrowAccount: escrowAccountPda,
              systemProgram: anchor.web3.SystemProgram.programId,
            } as any)
            .rpc();

          if (sign) {
            // Update Supabase
            const { error: insertError } = await supabase.from("users").insert({
              name: auction.name,
              description: auction.description,
              image_url: auction.image_url,
              item_price: auction.highest_bid,
              user_wallet: auction.highest_bidder,
            });

            if (insertError) {
              console.error(
                `Error inserting user record for ${auction.name}:`,
                insertError,
              );
            }

            const { error: deleteError } = await supabase
              .from("auctions")
              .delete()
              .eq("id", auction.id);

            if (deleteError) {
              console.error(
                `Error deleting settled auction ${auction.name}:`,
                deleteError,
              );
            } else {
              settledCount++;
            }
          }
        } catch (error: any) {
          console.error(`Failed to settle auction ${auction.name}:`, error);
          const msg = error.message || String(error);

          if (msg.includes("AccountNotInitialized")) {
            // If the account doesn't exist on-chain, it's a ghost record. Delete it from Supabase.
            console.warn(
              `Auction ${auction.name} not found on-chain. Cleaning up Supabase.`,
            );
            await supabase.from("auctions").delete().eq("id", auction.id);
            setSettleError(`Cleaned up 'ghost' auction: ${auction.name}`);
          } else if (
            msg.includes("no record of a prior credit") ||
            msg.includes("Attempt to debit")
          ) {
            setSettleError("insufficient_sol");
            break; // Stop loop if we ran out of SOL
          } else {
            setSettleError(`Error with ${auction.name}: ${msg}`);
          }
        }
      }
    }

    if (settledCount > 0) {
      alert(`${settledCount} auctions settled successfully`);
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  useEffect(() => {
    const fetchAuctions = async () => {
      const { data, error } = await supabase
        .from("auctions")
        .select("*")
        .gt("duration", 0)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching auctions:", error);
      } else {
        setAuctions(data || []);
      }
    };
    fetchAuctions();
  }, [isModalOpen, refreshTrigger]);
  return (
    <div className="flex flex-col items-center min-h-screen py-10 bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-8">
        Welcome to Solana Bidding dApp
      </h1>
      {!connected ? (
        <p className="text-gray-400">Connect your wallet to get started.</p>
      ) : (
        <>
          <div className="w-full max-w-6xl px-4">
            <div>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">Active Auctions</h2>
                <div
                  onClick={() => {
                    setSettleError(null);
                    settleAuctions();
                  }}
                  className="h-10 w-40 bg-[#512da8] text-white text-lg font-bold flex items-center justify-center rounded-sm cursor-pointer hover:bg-[#6c44b9]"
                >
                  Settle Auctions
                </div>
                {settleError && (
                  <div className="flex items-start gap-2 rounded-md bg-red-900/40 border border-red-500 px-3 py-2 text-sm text-red-300 max-w-sm">
                    <span>❌</span>
                    {settleError === "insufficient_sol" ? (
                      <span>
                        Insufficient SOL to settle. Get devnet SOL from the{" "}
                        <a
                          href="https://faucet.solana.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold underline hover:text-red-100"
                        >
                          Solana Faucet
                        </a>
                        .
                      </span>
                    ) : (
                      <span>Error: {settleError}</span>
                    )}
                  </div>
                )}
                <div
                  onClick={() => setIsModalOpen(true)}
                  className="h-10 w-30 bg-[#512da8] text-white text-lg font-bold flex items-center justify-center rounded-sm cursor-pointer hover:bg-[#6c44b9]"
                >
                  + OpenBid
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {auctions.map((auction) => (
                  <AuctionCard
                    key={auction.id}
                    auction={auction}
                    onBidPlaced={() => setRefreshTrigger((prev) => prev + 1)}
                  />
                ))}
                {auctions.length === 0 && (
                  <p className="col-span-full text-center text-gray-500">
                    No active auctions found.
                  </p>
                )}
              </div>
            </div>
            <OpeningBidModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Store;
