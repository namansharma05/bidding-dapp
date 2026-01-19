"use client";
import { FC, useRef, useState } from "react";
import { UploadButton } from "./UploadButton";
import { supabase } from "../utils/supabaseClient";
import { useWallet } from "@solana/wallet-adapter-react";

interface OpeningBidModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OpeningBidModal: FC<OpeningBidModalProps> = ({
  isOpen,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const { publicKey } = useWallet();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [openingBid, setOpeningBid] = useState("");
  const [duration, setDuration] = useState("");
  const [minimumIncrement, setMinimumIncrement] = useState("");

  const handleSubmit = async () => {
    if (!publicKey) {
      alert("Please connect your wallet");
      return;
    }
    const { error } = await supabase.from("auctions").insert({
      name,
      description,
      image_url: imageUrl,
      opening_bid: parseFloat(openingBid),
      duration: parseInt(duration),
      minimum_increment: parseFloat(minimumIncrement),
      creator_wallet: publicKey.toBase58(),
    });

    if (error) {
      console.error(
        "Error inserting data full:",
        JSON.stringify(error, null, 2),
      );
      alert(
        `Error creating auction: ${error.message || JSON.stringify(error)}`,
      );
    } else {
      alert("Auction created successfully");
      onClose();
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
