"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import dynamic from "next/dynamic";
import { FC, useEffect, useState } from "react";
import IDL_JSON from "../idl/bidding.json";
import Profile from "./Profile";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton,
    ),
  { ssr: false },
);

interface NavbarProps {
  profileClicked: boolean;
  setProfileClicked: (value: boolean) => void;
}

export const Navbar: FC<NavbarProps> = ({
  profileClicked,
  setProfileClicked,
}) => {
  const { connected } = useWallet();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <nav className="flex items-center justify-between px-6 py-4 bg-gray-800 text-white shadow-md">
        <div
          onClick={() => setProfileClicked(false)}
          className="text-2xl font-bold cursor-pointer hover:opacity-90 transition-opacity"
        >
          Solana Bidding dApp
        </div>
        <div className="flex items-center gap-4">
          {mounted && connected && (
            <div
              onClick={() => setProfileClicked(true)}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-teal-400 flex items-center justify-center text-white font-bold cursor-pointer hover:opacity-90 transition-opacity"
              title="Profile"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          )}
          <WalletMultiButton />
        </div>
      </nav>
    </>
  );
};
