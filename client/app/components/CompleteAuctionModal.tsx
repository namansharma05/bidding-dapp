import { FC, useEffect, useState } from "react";

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

interface CompleteAuctionModalProps {
  auction: Auction;
  showCompleteActiveAuction: boolean;
  setShowCompleteActiveAuction: () => void;
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

export const CompleteAuctionModal: FC<CompleteAuctionModalProps> = ({
  auction,
  showCompleteActiveAuction,
  setShowCompleteActiveAuction,
}) => {
  console.log("showCompleteActiveAuction value is ", showCompleteActiveAuction);
  return (
    <>
      {showCompleteActiveAuction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
          <div className="w-4xl bg-gray-800 text-black p-5 rounded-lg">
            <div className="flex text-black justify-end mb-4">
              <button
                className="text-lg text-white rounded-full font-bold cursor-pointer"
                onClick={setShowCompleteActiveAuction}
              >
                X
              </button>
            </div>
            <div className="flex justify-evenly items-center">
              <div>
                <img
                  src={auction.image_url}
                  alt={auction.name}
                  className="w-70 h-70 object-cover rounded-md mb-4"
                />
              </div>
              <div className="border-1 pl-20">
                <div className="flex jutify-between">
                  <div className="flex items-center">
                    <span className="text-gray-400 text-lg">Highest Bid:</span>
                    <span className="text-green-400 text-lg">
                      {auction.highest_bid || "No Bids"}
                    </span>
                  </div>
                  <div className="flex justify-end items-end text-lg">
                    <Countdown
                      createdAt={auction.created_at}
                      duration={auction.duration}
                    />
                  </div>
                </div>
                <div className="text-lg text-gray-500">
                  Listed by:{" "}
                  <span
                    className="text-gray-300"
                    title={auction.creator_wallet}
                  >
                    {auction.creator_wallet.slice(0, 6)}......
                    {auction.creator_wallet.slice(-6)}
                  </span>
                </div>
                <h3 className="text-lg font-bold">
                  Item Name : {auction.name}
                </h3>
                <div className="flex items-center">
                  <span className="text-gray-400 text-lg">Opening Price:</span>
                  <span className="text-green-400 text-lg">
                    {auction.opening_bid} SOL
                  </span>
                </div>
                <div className="items-center text-lg">
                  <span className="text-gray-400">Min. Increment:</span>
                  <span className="text-gray-200">
                    {auction.minimum_increment} SOL
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-lg">
                    Item Description:
                  </span>
                  <span className="text-gray-400 text-lg">
                    {auction.description}
                  </span>
                </div>
                <button className="BidButton border-1 rounded-sm p-2">
                  Bid
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
