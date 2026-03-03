import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import { FC, useEffect, useState } from "react";
import * as anchor from "@coral-xyz/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import IDL_JSON from "../idl/bidding.json";
import { Bidding } from "../idl/bidding";
import { supabase } from "../utils/supabaseClient";

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
}

interface CompleteAuctionModalProps {
  auction: Auction;
  showCompleteActiveAuction: boolean;
  setShowCompleteActiveAuction: () => void;
  onBidPlaced: () => void;
}

const Countdown = ({
  createdAt,
  duration,
  onEnd,
}: {
  createdAt: string;
  duration: number;
  onEnd?: () => void;
}) => {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const endTime = new Date(createdAt).getTime() + duration * 1000;
      const distance = endTime - now;

      if (distance < 0) {
        setTimeLeft("Ended");
        onEnd?.();
        return true;
      }

      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      );
      return false;
    };

    // Initial check
    if (calculateTimeLeft()) return;

    const interval = setInterval(() => {
      if (calculateTimeLeft()) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt, duration, onEnd]);

  return <div className="text-yellow-400">{timeLeft}</div>;
};

export const CompleteAuctionModal: FC<CompleteAuctionModalProps> = ({
  auction,
  showCompleteActiveAuction,
  setShowCompleteActiveAuction,
  onBidPlaced,
}) => {
  const [isEnded, setIsEnded] = useState(() => {
    const now = new Date().getTime();
    const endTime =
      new Date(auction.created_at).getTime() + auction.duration * 1000;
    return endTime - now < 0;
  });
  const { publicKey } = useWallet();
  const [txError, setTxError] = useState<string | null>(null);

  const wallet = useAnchorWallet();

  const getProvider = async () => {
    if (!wallet) return null;

    const network = "https://api.devnet.solana.com";
    const connection = new Connection(network, "processed");

    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      anchor.AnchorProvider.defaultOptions(),
    );
    return provider;
  };

  const handleBidding = async () => {
    if (!publicKey) {
      alert("Please connect your wallet");
      return;
    }

    const provider = await getProvider();
    if (!provider) throw "Provider is null";

    try {
      setTxError(null);
      const program = new anchor.Program<Bidding>(
        IDL_JSON as unknown as Bidding,
        provider,
      );

      const [itemCounterAccountPda, itemCounterAccountBump] =
        anchor.web3.PublicKey.findProgramAddressSync(
          [Buffer.from("item_counter")],
          program.programId,
        );
      const itemCounterInfo = await provider.connection.getAccountInfo(
        itemCounterAccountPda,
      );
      if (!itemCounterInfo) {
        await program.methods
          .initializeCounter()
          .accounts({
            authority: publicKey,
            itemCounterAccount: itemCounterAccountPda,
          } as any)
          .rpc();
      }

      const [itemAccountPda, itemAccountBump] =
        anchor.web3.PublicKey.findProgramAddressSync(
          [
            Buffer.from("item"),
            new anchor.BN(auction.item_id).toArrayLike(Buffer, "le", 2),
          ],
          program.programId,
        );

      const [escrowAccountPda, escrowAccountBump] =
        anchor.web3.PublicKey.findProgramAddressSync(
          [
            Buffer.from("escrow"),
            new PublicKey(auction.creator_wallet).toBuffer(),
            new anchor.BN(auction.item_id).toArrayLike(Buffer, "le", 2),
          ],
          program.programId,
        );
      const inst = await program.methods
        .bid(auction.item_id)
        .accounts({
          authority: publicKey,
          itemCounterAccount: itemCounterAccountPda,
          itemAccount: itemAccountPda,
          escrowAccount: escrowAccountPda,
          previousBidder: new PublicKey(auction.highest_bidder),
          systemProgram: anchor.web3.SystemProgram.programId,
        } as any)
        .instruction();

      const previousBidderKey = new PublicKey(auction.highest_bidder);
      // Manually mark previousBidder as writable if it's not the System Program
      if (!previousBidderKey.equals(anchor.web3.SystemProgram.programId)) {
        inst.keys.forEach((key) => {
          if (key.pubkey.equals(previousBidderKey)) {
            key.isWritable = true;
          }
        });
      }

      const tx = new anchor.web3.Transaction().add(inst);
      const signature = await provider.sendAndConfirm(tx);
      if (signature) {
      } else {
        setTxError("Error updating auction: No signature received");
        return;
      }
      const highestBid =
        auction.highest_bid == 0
          ? auction.opening_bid
          : auction.highest_bid + auction.minimum_increment;
      const { error } = await supabase
        .from("auctions")
        .update({
          highest_bid: Math.ceil((highestBid + Number.EPSILON) * 100) / 100,
          highest_bidder: publicKey?.toBase58(),
        })
        .eq("id", auction.id);

      if (error) {
        console.error(
          "Error updating data full:",
          JSON.stringify(error, null, 2),
        );
        setTxError(
          `Error updating auction record: ${error.message || JSON.stringify(error)}`,
        );
      } else {
        onBidPlaced();
        setShowCompleteActiveAuction();
      }
    } catch (error: any) {
      console.error("Error while bidding: ", error);
      const msg = error.message || String(error);
      if (
        msg.includes("no record of a prior credit") ||
        msg.includes("Attempt to debit an account")
      ) {
        setTxError("insufficient_sol");
      } else {
        setTxError(msg);
      }
    }
  };
  return (
    <>
      {showCompleteActiveAuction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-white text-white p-4 md:p-8 w-full max-w-4xl rounded-xl shadow-2xl max-h-[95vh] overflow-y-auto transition-all">
            <div className="flex justify-end mb-4">
              <button
                className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-full w-10 h-10 flex items-center justify-center font-bold transition-colors cursor-pointer text-xl"
                onClick={setShowCompleteActiveAuction}
              >
                ✕
              </button>
            </div>

            {txError && (
              <div className="mb-6 flex items-start gap-3 rounded-lg bg-red-900/20 border border-red-500/50 px-4 py-4 text-sm text-red-200 animate-in fade-in slide-in-from-top-2">
                <span className="text-lg">⚠️</span>
                {txError === "insufficient_sol" ? (
                  <span className="leading-relaxed">
                    <strong>Insufficient SOL:</strong> Your wallet needs more
                    SOL to place this bid. Top up at the{" "}
                    <a
                      href="https://faucet.solana.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold underline hover:text-red-300 transition-colors"
                    >
                      Solana Devnet Faucet
                    </a>{" "}
                    and try again.
                  </span>
                ) : (
                  <span className="leading-relaxed">
                    <strong>Transaction Failed:</strong> {txError}
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
              {/* Image Section */}
              <div className="w-full lg:w-1/2 flex justify-center">
                <div className="w-full max-w-md aspect-square relative group">
                  <img
                    className="w-full h-full rounded-xl object-cover shadow-2xl border border-gray-800"
                    src={auction.image_url}
                    alt={auction.name}
                  />
                </div>
              </div>

              {/* Info Section */}
              <div className="w-full lg:w-1/2 flex flex-col gap-6">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-2xl md:text-3xl font-bold text-white break-words">
                      {auction.name}
                    </h2>
                    <div className="text-3xl font-mono">
                      <Countdown
                        createdAt={auction.created_at}
                        duration={auction.duration}
                        onEnd={() => setIsEnded(true)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                      <div className="flex flex-col">
                        <span className="text-gray-500 uppercase tracking-wider text-xs font-bold">
                          Listed By
                        </span>
                        <span
                          className="text-gray-300 font-mono"
                          title={auction.creator_wallet}
                        >
                          {auction.creator_wallet.slice(0, 6)}...
                          {auction.creator_wallet.slice(-6)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 uppercase tracking-wider text-xs font-bold">
                          Highest Bidder
                        </span>
                        <span
                          className="text-gray-300 font-mono"
                          title={auction.highest_bidder}
                        >
                          {auction.highest_bidder.slice(0, 6)}...
                          {auction.highest_bidder.slice(-6)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs font-bold uppercase">
                          Current Bid
                        </span>
                        <span className="text-2xl font-bold text-green-400">
                          {auction.highest_bid}{" "}
                          <span className="text-sm font-normal">SOL</span>
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs font-bold uppercase">
                          Min. Increment
                        </span>
                        <span className="text-xl font-semibold text-gray-200">
                          {auction.minimum_increment}{" "}
                          <span className="text-sm font-normal text-gray-400">
                            SOL
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs font-bold uppercase mb-1">
                        Description
                      </span>
                      <p className="text-gray-300 text-base leading-relaxed break-words">
                        {auction.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 text-sm">
                      <span className="text-gray-500 font-bold uppercase text-xs">
                        Opening Price:
                      </span>
                      <span className="text-green-500 font-semibold">
                        {auction.opening_bid} SOL
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-gray-800">
                  <button
                    disabled={isEnded}
                    onClick={handleBidding}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all active:scale-[0.98] shadow-lg ${
                      isEnded
                        ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
                        : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20 hover:shadow-blue-600/20"
                    }`}
                  >
                    {isEnded ? "Auction Ended" : "Place Bid"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
