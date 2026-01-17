"use client";

import { useWallet } from "@solana/wallet-adapter-react";

export default function Home() {
  const { publicKey, connected } = useWallet();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-8">Welcome to Bidding dApp</h1>
      {!connected ? (
        <p className="text-gray-400">Connect your wallet to get started.</p>
      ) : (
        <p className="text-gray-400">Connected to {publicKey?.toBase58().slice(0, 4) + "..." + publicKey?.toBase58().slice(-4)}</p>
      )}
    </div>
  );
}