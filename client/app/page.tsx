"use client";
import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { OpeningBidModal } from "./components/OpeningBidModal";
import { supabase } from "./utils/supabaseClient";
import { AuctionCard } from "./components/AuctionCard";

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
}
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
                <AuctionCard key={auction.id} {...auction} />
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
