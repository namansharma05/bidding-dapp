import { FC } from "react";

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
          <div className="w-4xl bg-white text-black rounded-lg">
            <div className="flex text-black items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Open Bid</h2>
              <button
                className="text-lg rounded-full font-bold cursor-pointer"
                onClick={setShowCompleteActiveAuction}
              >
                X
              </button>
            </div>
            This is the Complete Auction modal
          </div>
        </div>
      )}
    </>
  );
};
