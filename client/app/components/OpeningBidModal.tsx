"use client";
import { FC, useEffect, useRef, useState } from "react";
import { UploadButton } from "./UploadButton";
import { supabase } from "../utils/supabaseClient";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import IDL_JSON from "../idl/bidding.json";
import { Bidding } from "../idl/bidding";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

interface OpeningBidModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OpeningBidModal: FC<OpeningBidModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [imageUrl, setImageUrl] = useState("");
  const { publicKey } = useWallet();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [openingBid, setOpeningBid] = useState("");
  const [duration, setDuration] = useState("");
  const [minimumIncrement, setMinimumIncrement] = useState("");
  const [txError, setTxError] = useState<string | null>(null);

  const wallet = useAnchorWallet();

  useEffect(() => {
    if (isOpen) {
      setName("");
      setDescription("");
      setImageUrl("");
      setOpeningBid("");
      setDuration("");
      setMinimumIncrement("");
      setTxError(null);
    }
  }, [isOpen]);

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

  const handleSubmit = async () => {
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

      const itemCounterAccountData = await program.account.itemCounter.fetch(
        itemCounterAccountPda,
      );

      const [itemAccountPda, itemAccountBump] =
        anchor.web3.PublicKey.findProgramAddressSync(
          [
            Buffer.from("item"),
            new anchor.BN(itemCounterAccountData.itemCount).toArrayLike(
              Buffer,
              "le",
              2,
            ),
          ],
          program.programId,
        );

      const [escrowAccountPda, escrowAccountBump] =
        anchor.web3.PublicKey.findProgramAddressSync(
          [
            Buffer.from("escrow"),
            publicKey.toBuffer(),
            new anchor.BN(itemCounterAccountData.itemCount).toArrayLike(
              Buffer,
              "le",
              2,
            ),
          ],
          program.programId,
        );

      const signature = await program.methods
        .initializeItem(
          name,
          description,
          imageUrl,
          new anchor.BN(parseFloat(openingBid) * LAMPORTS_PER_SOL),
          new anchor.BN(parseFloat(minimumIncrement) * LAMPORTS_PER_SOL),
        )
        .accounts({
          authority: publicKey,
          itemCounterAccount: itemCounterAccountPda,
          itemAccount: itemAccountPda,
          escrowAccount: escrowAccountPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        } as any)
        .rpc();

      if (signature) {
        const { error: supabaseError } = await supabase
          .from("auctions")
          .insert({
            name,
            description,
            image_url: imageUrl,
            opening_bid: parseFloat(openingBid),
            duration: parseInt(duration),
            minimum_increment: parseFloat(minimumIncrement),
            creator_wallet: publicKey.toBase58(),
            item_id: parseFloat(itemCounterAccountData.itemCount as any),
          });

        if (supabaseError) {
          console.error(
            "Error inserting data to Supabase:",
            JSON.stringify(supabaseError, null, 2),
          );
          setTxError(
            `Auction created on chain, but failed to record in database: ${supabaseError.message}`,
          );
          return;
        }
      }

      alert("Auction created successfully");
      onClose();
    } catch (err: any) {
      console.error("Error creating auction: ", err);
      const msg = err.message || String(err);
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
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white p-6 w-4xl rounded-lg">
            <div className="flex text-black items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Open Bid</h2>
              <button
                className="text-lg rounded-full font-bold cursor-pointer"
                onClick={onClose}
              >
                X
              </button>
            </div>

            {txError && (
              <div className="mb-4 flex items-start gap-2 rounded-md bg-red-50 border border-red-300 px-4 py-3 text-sm text-red-800">
                <span>❌</span>
                {txError === "insufficient_sol" ? (
                  <span>
                    Your wallet has insufficient SOL to create an auction.
                    Please top up your wallet at the{" "}
                    <a
                      href="https://faucet.solana.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold underline hover:text-red-900"
                    >
                      Solana Devnet Faucet
                    </a>{" "}
                    and try again.
                  </span>
                ) : (
                  <span>Transaction failed: {txError}</span>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-between pr-4">
                <div>
                  {imageUrl ? (
                    <img
                      className="h-100 w-100 rounded-sm object-cover"
                      src={imageUrl}
                      alt="Image from Pinata"
                    />
                  ) : (
                    <div className="h-100 w-100 bg-gray-100 rounded-sm flex items-center justify-center text-gray-400">
                      No Image Selected
                    </div>
                  )}
                </div>
                <UploadButton onUploadComplete={(url) => setImageUrl(url)} />
              </div>
              <div className="flex text-black flex-col gap-4 w-full">
                <div className="flex items-center gap-2">
                  <label className="mb-1 font-semibold" htmlFor="name">
                    Name
                  </label>
                  <input
                    className="border border-gray-300 rounded p-2"
                    type="text"
                    id="name"
                    placeholder="Enter Item Names"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 font-semibold" htmlFor="description">
                    Description
                  </label>
                  <textarea
                    className="border border-gray-300 rounded p-2"
                    id="description"
                    placeholder="Enter Item Description"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="mb-1 font-semibold" htmlFor="openingBid">
                    Opening Bid
                  </label>
                  <input
                    className="border border-gray-300 rounded p-2"
                    type="number"
                    id="openingBid"
                    placeholder="Enter Opening Bid"
                    value={openingBid}
                    onChange={(e) => setOpeningBid(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="mb-1 font-semibold" htmlFor="duration">
                    Duration in seconds
                  </label>
                  <input
                    className="border border-gray-300 rounded p-2"
                    type="number"
                    id="duration"
                    placeholder="Enter Duration"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label
                    className="mb-1 font-semibold"
                    htmlFor="Minimum Increment"
                  >
                    Minimum Increment
                  </label>
                  <input
                    className="border border-gray-300 rounded p-2"
                    type="number"
                    id="minimumIncrement"
                    placeholder="Enter Minimum Increment"
                    value={minimumIncrement}
                    onChange={(e) => setMinimumIncrement(e.target.value)}
                  />
                </div>
                <button
                  onClick={handleSubmit}
                  className="bg-blue-500 text-white mt-6 font-semibold px-4 py-2 rounded hover:bg-blue-600 self-center"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
