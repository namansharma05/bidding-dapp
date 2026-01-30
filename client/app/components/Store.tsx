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

  const wallet = useAnchorWallet();

  const settleAuctions = async () => {
    if (!wallet) return null;
    if (!publicKey) {
      alert("Please connect your wallet");
      return;
    }

    const network = "http://127.0.0.1:8899";
    const connection = new Connection(network, "processed");

    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      anchor.AnchorProvider.defaultOptions(),
    );

    if (!provider) throw "Provider is null";

    const program = new anchor.Program(IDL_JSON as Bidding, provider);
    const timeNow = new Date().getTime();

    auctions.forEach(async (auction) => {
      if (
        new Date(auction.created_at).getTime() + auction.duration * 1000 <
          timeNow &&
        auction.settled === false
      ) {
        const [itemAccountPda] = anchor.web3.PublicKey.findProgramAddressSync(
          [
            Buffer.from("item"),
            new anchor.BN(auction.item_id).toArrayLike(Buffer, "le", 2),
          ],
          program.programId,
        );
        const [escrowAccountPda] = anchor.web3.PublicKey.findProgramAddressSync(
          [
            Buffer.from("escrow"),
            new PublicKey(auction.creator_wallet).toBuffer(),
            new anchor.BN(auction.item_id).toArrayLike(Buffer, "le", 2),
          ],
          program.programId,
        );
        try {
          const sign = await program.methods
            .transferItemToWinner(
              new anchor.BN(auction.item_id),
              new PublicKey(auction.highest_bidder),
            )
            .accounts({
              authority: publicKey,
              itemAccount: itemAccountPda,
              auctionCreator: new PublicKey(auction.creator_wallet), // creator of the auction to whom the highest bid amount will be transferred
              escrowAccount: escrowAccountPda,
              systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();
          if (sign) {
            const { error } = await supabase.from("users").insert({
              name: auction.name,
              description: auction.description,
              image_url: auction.image_url,
              item_price: auction.highest_bid,
              user_wallet: auction.highest_bidder,
            });
            if (error) {
              console.error("Error inserting user data:", error);
            } else {
              const { data, error: err } = await supabase
                .from("auctions")
                .delete()
                .eq("id", auction.id);
              if (err) {
                console.error("Error deleting auction", err);
              } else {
                alert("Auctions settled successfully");
                setRefreshTrigger((prev) => prev + 1);
              }
            }
          } else {
            console.error(
              "Not able to settle auction due to no signature received",
            );
          }
        } catch (error) {
          console.error("Error settling auctions", error);
        }
      }
    });
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
                  onClick={() => settleAuctions()}
                  className="h-10 w-40 bg-[#512da8] text-white text-lg font-bold flex items-center justify-center rounded-sm cursor-pointer hover:bg-[#6c44b9]"
                >
                  Settle Auctions
                </div>
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
