import { FC, useEffect, useState } from "react";
import { CompleteAuctionModal } from "./CompleteAuctionModal";

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

export const AuctionCard: FC<Auction> = (auction) => {
  const [showCompleteActiveAuction, setShowCompleteActiveAuction] =
    useState(false);
  return (
    <>
      <div
        onClick={() => setShowCompleteActiveAuction(true)}
        key={auction.id}
        className="bg-gray-800 rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow border border-gray-700 flex flex-col"
      >
        {auction.image_url ? (
          <img
            src={auction.image_url}
            alt={auction.name}
            className="w-full h-60 object-cover rounded-md mb-4"
          />
        ) : (
          <div className="w-full h-48 bg-gray-700 rounded-md mb-4 flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
        <h3 className="text-xl font-bold mb-1">{auction.name}</h3>
        <div className="text-xs text-gray-500 mb-2">
          Listed by:{" "}
          <span className="text-gray-300" title={auction.creator_wallet}>
            {auction.creator_wallet.slice(0, 6)}......
            {auction.creator_wallet.slice(-6)}
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
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400 text-xs">Opening Price:</span>
            <span className="text-green-400 text-lg">
              {auction.opening_bid} SOL
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400 text-xs">Highest Bid:</span>
            <span className="text-green-400 text-lg">
              {auction.highest_bid || "No Bids"}
            </span>
          </div>
        </div>
      </div>
      <CompleteAuctionModal
        auction={auction}
        showCompleteActiveAuction={showCompleteActiveAuction}
        setShowCompleteActiveAuction={() => setShowCompleteActiveAuction(false)}
      />
    </>
  );
};
