import { FC } from "react";

interface UserItem {
  id: string;
  name: string;
  description: string;
  image_url: string;
  item_price: number;
  user_wallet: string;
}

const ItemCard: FC<{ userItem: UserItem }> = ({ userItem }) => {
  return (
    <div
      key={userItem.id}
      className="bg-black rounded-lg p-4 shadow-lg border border-white flex flex-col"
    >
      {userItem.image_url ? (
        <img
          src={userItem.image_url}
          alt={userItem.name}
          className="w-full h-60 object-contain rounded-md mb-4"
        />
      ) : (
        <div className="w-full h-48 bg-gray-700 rounded-md mb-4 flex items-center justify-center text-gray-400">
          No Image
        </div>
      )}
      <h3 className="text-xl font-bold mb-1 text-white">{userItem.name}</h3>

      <p className="text-white text-sm mb-4 line-clamp-2 flex-grow">
        {userItem.description}
      </p>
      <div className="flex justify-between items-center text-sm">
        <span className="text-white text-xs">Item Price:</span>
        <span className="text-green-400 text-lg">
          {userItem.item_price} SOL
        </span>
      </div>
    </div>
  );
};

export default ItemCard;
