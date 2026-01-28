import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
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

  const wallet = useAnchorWallet();

  const getProvider = async () => {
    if (!wallet) return null;

    const network = "http://127.0.0.1:8899";
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
    const tx = await provider.connection.requestAirdrop(
      publicKey,
      10 * LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(tx);

    const program = new anchor.Program(IDL_JSON as Bidding, provider);

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
    try {
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
        alert("Error updating auction");
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
        alert(
          `Error updating auction: ${error.message || JSON.stringify(error)}`,
        );
      } else {
        onBidPlaced();
        setShowCompleteActiveAuction();
      }
    } catch (error) {
      console.error("Error while bidding: ", error);
    }
  };
  return (
    <>
      {showCompleteActiveAuction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
          <div className="w-4xl bg-gray-800 text-black p-10 rounded-lg">
            <div className="flex text-black justify-end mb-4">
              <button
                className="text-lg text-white rounded-full font-bold cursor-pointer"
                onClick={setShowCompleteActiveAuction}
              >
                X
              </button>
            </div>
            <div className="flex flex-row justify-evenly items-center">
              <div className="w-full object-cover rounded-md overflow-hidden mb-4">
                <img
                  className="w-[90%] rounded-md"
                  src={auction.image_url}
                  alt={auction.name}
                />
              </div>
              <div className="w-[100%]">
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <div className="text-gray-400 text-lg pr-2">
                      Highest Bid:
                    </div>
                    <div className="text-green-400 text-lg">
                      {auction.highest_bid + " SOL" || "No Bids"}
                    </div>
                  </div>
                  <div className="text-2xl justify-end">
                    <Countdown
                      createdAt={auction.created_at}
                      duration={auction.duration}
                      onEnd={() => setIsEnded(true)}
                    />
                  </div>
                </div>
                <div className="text-lg text-gray-400">
                  Listed by:
                  <span
                    className="text-gray-300 pl-2"
                    title={auction.creator_wallet}
                  >
                    {auction.creator_wallet.slice(0, 6)}......
                    {auction.creator_wallet.slice(-6)}
                  </span>
                </div>
                <div className="text-lg text-gray-400">
                  Highest bid by:
                  <span
                    className="text-gray-300 pl-2"
                    title={auction.highest_bidder}
                  >
                    {auction.highest_bidder.slice(0, 6)}......
                    {auction.highest_bidder.slice(-6)}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="text-lg text-gray-400 pr-2">Item Name:</div>
                  <div className="text-lg text-gray-300">{auction.name}</div>
                </div>
                <div className="flex items-center">
                  <div className="text-gray-400 text-lg pr-2">
                    Opening Price:
                  </div>
                  <div className="text-green-500 text-lg">
                    {auction.opening_bid} SOL
                  </div>
                </div>
                <div className="flex items-center text-lg">
                  <div className="text-gray-400 pr-2">Min. Increment:</div>
                  <div className="text-gray-200">
                    {auction.minimum_increment} SOL
                  </div>
                </div>
                <div className="">
                  <div className="text-gray-400 text-lg">Item Description:</div>
                  <div className="text-gray-300 text-lg">
                    {auction.description}
                  </div>
                </div>
                <button
                  disabled={isEnded}
                  onClick={handleBidding}
                  className={`flex justify-end rounded-sm p-2 border-1 transition-colors ${
                    isEnded
                      ? "text-gray-600 border-gray-700 cursor-not-allowed bg-gray-800/50"
                      : "text-gray-300 border-gray-300 hover:bg-gray-700 active:bg-gray-600"
                  }`}
                >
                  {isEnded ? "Auction Ended" : "Bid"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
