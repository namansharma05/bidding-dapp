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
  onEnd,
}: {
  createdAt: string;
  duration: number;
  onEnd?: () => void;
}) => {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const endTime = new Date(createdAt).getTime() + duration * 1000;
      const distance = endTime - now;

      if (distance < 0) {
        setTimeLeft("Ended");
        onEnd?.();
        return true;
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
      return false;
    };

    // Initial check
    if (calculateTimeLeft()) return;

    const interval = setInterval(() => {
      if (calculateTimeLeft()) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt, duration, onEnd]);

  return <div className="text-yellow-400">{timeLeft}</div>;
};

export const CompleteAuctionModal: FC<CompleteAuctionModalProps> = ({
  auction,
  showCompleteActiveAuction,
  setShowCompleteActiveAuction,
}) => {
  const [isEnded, setIsEnded] = useState(() => {
    const now = new Date().getTime();
    const endTime =
      new Date(auction.created_at).getTime() + auction.duration * 1000;
    return endTime - now < 0;
  });
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
              <div className="pl-20">
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <div className="text-gray-400 text-lg pr-2">
                      Highest Bid:
                    </div>
                    <div className="text-green-400 text-lg">
                      {auction.highest_bid || "No Bids"}
                    </div>
                  </div>
                  <div className="text-2xl justify-end">
                    <Countdown
                      createdAt={auction.created_at}
                      duration={auction.duration}
                      onEnd={() => setIsEnded(true)}
                    />
                  </div>
                </div>
                <div className="text-lg text-gray-400">
                  Listed by:
                  <span
                    className="text-gray-300 pl-2"
                    title={auction.creator_wallet}
                  >
                    {auction.creator_wallet.slice(0, 6)}......
                    {auction.creator_wallet.slice(-6)}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="text-lg text-gray-400 pr-2">Item Name:</div>
                  <div className="text-lg text-gray-300">{auction.name}</div>
                </div>
                <div className="flex items-center">
                  <div className="text-gray-400 text-lg pr-2">
                    Opening Price:
                  </div>
                  <div className="text-green-500 text-lg">
                    {auction.opening_bid} SOL
                  </div>
                </div>
                <div className="flex items-center text-lg">
                  <div className="text-gray-400 pr-2">Min. Increment:</div>
                  <div className="text-gray-200">
                    {auction.minimum_increment} SOL
                  </div>
                </div>
                <div className="">
                  <div className="text-gray-400 text-lg">Item Description:</div>
                  <div className="text-gray-300 text-lg">
                    {auction.description}
                  </div>
                </div>
                <button
                  disabled={isEnded}
                  className={`flex justify-end rounded-sm p-2 border-1 transition-colors ${
                    isEnded
                      ? "text-gray-600 border-gray-700 cursor-not-allowed bg-gray-800/50"
                      : "text-gray-300 border-gray-300 hover:bg-gray-700 active:bg-gray-600"
                  }`}
                >
                  {isEnded ? "Auction Ended" : "Bid"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
