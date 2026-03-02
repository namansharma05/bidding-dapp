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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-black border border-white text-white p-4 md:p-8 lg:p-6 w-full max-w-4xl rounded-xl shadow-2xl max-h-[95vh] overflow-y-auto transition-all">
            <div className="flex items-center justify-between pb-3 lg:pb-2 mb-4 lg:mb-2">
              <h2 className="text-xl md:text-2xl lg:text-lg font-bold">
                Open New Auction
              </h2>
              <button
                className="hover:text-black hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center font-bold transition-colors cursor-pointer"
                onClick={onClose}
              >
                ✕
              </button>
            </div>

            {txError && (
              <div className="mb-4 lg:mb-3 flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 px-3 py-3 lg:py-2 text-sm lg:text-xs text-red-800 animate-in fade-in slide-in-from-top-2">
                <span className="text-lg lg:text-base">⚠️</span>
                {txError === "insufficient_sol" ? (
                  <span className="leading-tight">
                    <strong>Insufficient SOL:</strong> Your wallet needs more
                    SOL to create an auction. Top up at the{" "}
                    <a
                      href="https://faucet.solana.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold underline hover:text-red-600 transition-colors"
                    >
                      Solana Devnet Faucet
                    </a>{" "}
                    and try again.
                  </span>
                ) : (
                  <span className="leading-tight">
                    <strong>Transaction Failed:</strong> {txError}
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-6 px-4 md:px-8 lg:px-12">
              {/* Image Section */}
              <div className="flex flex-col gap-4 items-center">
                <div className="w-full aspect-square md:h-80 md:w-80 lg:h-64 lg:w-64 relative group mx-auto">
                  {imageUrl ? (
                    <img
                      className="h-full w-full rounded-lg object-cover shadow-inner border border-white"
                      src={imageUrl}
                      alt="Auction entry"
                    />
                  ) : (
                    <div className="h-full w-full bg-black border-2 border-dashed border-white rounded-lg flex flex-col items-center justify-center text-white gap-2">
                      <svg
                        className="w-10 h-10 lg:w-8 lg:h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="font-medium text-sm lg:text-xs">
                        No Image uploaded
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Section */}
              <div className="flex text-white flex-col gap-3 lg:gap-2">
                <div className="flex flex-col gap-1">
                  <label
                    className="text-sm lg:text-sm font-semibold"
                    htmlFor="name"
                  >
                    Item Name
                  </label>
                  <input
                    className="bg-black border border-white rounded-md p-2 lg:p-1.5 text-sm lg:text-sm focus:ring-2 outline-none"
                    type="text"
                    id="name"
                    placeholder="e.g. Rare Artifact"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label
                    className="text-sm lg:text-sm font-semibold"
                    htmlFor="description"
                  >
                    Description
                  </label>
                  <textarea
                    className="bg-black border border-white rounded-md p-2 lg:p-1.5 text-sm lg:text-sm focus:ring-2 outline-none resize-none"
                    id="description"
                    placeholder="Describe item..."
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-2">
                  <div className="flex flex-col gap-1">
                    <label
                      className="text-sm lg:text-sm font-semibold"
                      htmlFor="openingBid"
                    >
                      Opening Bid (SOL)
                    </label>
                    <input
                      className="bg-black border border-white rounded-md p-2 lg:p-1.5 text-sm lg:text-sm outline-none focus:ring-2 outline-none"
                      type="number"
                      id="openingBid"
                      step="0.1"
                      placeholder="0.01"
                      value={openingBid}
                      onChange={(e) => setOpeningBid(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label
                      className="text-sm lg:text-sm font-semibold"
                      htmlFor="duration"
                    >
                      Duration (Sec)
                    </label>
                    <input
                      className="bg-black border border-white rounded-md p-2 lg:p-1.5 text-sm lg:text-sm outline-none focus:ring-2 outline-none"
                      type="number"
                      id="duration"
                      placeholder="3600"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label
                    className="text-sm lg:text-sm font-semibold"
                    htmlFor="minimumIncrement"
                  >
                    Min. Increment (SOL)
                  </label>
                  <input
                    className="bg-black border border-white rounded-md p-2 lg:p-1.5 text-sm lg:text-sm outline-none focus:ring-2 outline-none"
                    type="number"
                    id="minimumIncrement"
                    step="0.05"
                    placeholder="0.01"
                    value={minimumIncrement}
                    onChange={(e) => setMinimumIncrement(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Actions Section */}
            <div className="mx-20 mt-8 lg:mt-6 pt-6 lg:pt-4 flex flex-col md:flex-row items-center justify-between gap-4 lg:gap-6 px-4 md:px-8">
              <UploadButton
                onUploadComplete={(url) => setImageUrl(url)}
                className="w-full ml-2 md:w-56 h-12 lg:h-10 bg-[#512da8] cursor-pointer hover:bg-gray-700 text-white text-sm lg:text-xs font-bold rounded-lg transition-all active:scale-[0.98] border border-white"
              />
              <button
                onClick={handleSubmit}
                className="w-full md:w-56 h-12 lg:h-10 bg-[#512da8] cursor-pointer hover:bg-blue-700 text-white text-sm lg:text-xs font-bold rounded-lg transition-all active:scale-[0.98] border border-white"
              >
                Start Auction
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
