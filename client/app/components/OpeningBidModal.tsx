"use client";
import { FC, useRef, useState } from "react";
import { UploadButton } from "./UploadButton";

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
                  />
                </div>
                <button className="bg-blue-500 text-white mt-6 font-semibold px-4 py-2 rounded hover:bg-blue-600 self-center">
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
