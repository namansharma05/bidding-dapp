"use client";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { OpeningBidModal } from "./components/OpeningBidModal";

export default function Home() {
  const { publicKey, connected } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-8">
        Welcome to Solana Bidding dApp
      </h1>
      {!connected ? (
        <p className="text-gray-400">Connect your wallet to get started.</p>
      ) : (
        <>
          <div
            onClick={() => setIsModalOpen(true)}
            className="h-10 w-30 bg-[#512da8] text-white text-lg font-bold flex items-center justify-center rounded-sm cursor-pointer hover:bg-[#6c44b9]"
          >
            + OpenBid
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
