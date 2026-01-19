"use client";
import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { OpeningBidModal } from "./components/OpeningBidModal";
import { supabase } from "./utils/supabaseClient";

interface Auction {
  id: string;
  name: string;
  description: string;
  image_url: string;
  opening_bid: number;
  created_at: string;
  duration: number;
  minimum_increment: number;
  creator_wallet: string;
}

const Countdown = ({
  createdAt,
  duration,
}: {
  createdAt: string;
  duration: number;
}) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const endTime = new Date(createdAt).getTime() + duration * 1000;
      const distance = endTime - now;

      if (distance < 0) {
        setTimeLeft("Ended");
        clearInterval(interval);
        return;
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
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt, duration]);

  return <span className="font-mono text-yellow-400">{timeLeft}</span>;
};

export default function Home() {
  const { publicKey, connected } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [auctions, setAuctions] = useState<Auction[]>([]);

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
  }, [isModalOpen]);

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
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Active Auctions</h2>
              <div
                onClick={() => setIsModalOpen(true)}
                className="h-10 w-30 bg-[#512da8] text-white text-lg font-bold flex items-center justify-center rounded-sm cursor-pointer hover:bg-[#6c44b9]"
              >
                + OpenBid
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {auctions.map((auction) => (
                <div
                  key={auction.id}
                  className="bg-gray-800 rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow border border-gray-700 flex flex-col"
                >
                  {auction.image_url ? (
                    <img
                      src={auction.image_url}
                      alt={auction.name}
                      className="w-full h-48 object-cover rounded-md mb-4"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-700 rounded-md mb-4 flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                  <h3 className="text-xl font-bold mb-1">{auction.name}</h3>
                  <div className="text-xs text-gray-500 mb-2">
                    Created by:{" "}
                    <span
                      className="text-gray-300"
                      title={auction.creator_wallet}
                    >
                      {auction.creator_wallet.slice(0, 4)}...
                      {auction.creator_wallet.slice(-4)}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-grow">
                    {auction.description}
                  </p>

                  <div className="border-t border-gray-700 pt-3 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Time Left:</span>
                      <Countdown
                        createdAt={auction.created_at}
                        duration={auction.duration}
                      />
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Min. Increment:</span>
                      <span className="text-gray-200">
                        {auction.minimum_increment} SOL
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-semibold mt-2">
                      <span className="text-green-400 text-lg">
                        {auction.opening_bid} SOL
                      </span>
                      <button className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 text-white transition-colors text-xs font-bold uppercase tracking-wider">
                        Place Bid
                      </button>
                    </div>
                  </div>
                </div>
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
        </>
      )}
    </div>
  );
}
