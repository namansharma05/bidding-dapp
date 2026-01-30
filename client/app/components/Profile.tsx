import { FC } from "react";
import ItemCard from "./ItemCard";

interface UserItems {
  id: string;
  name: string;
  description: string;
  image_url: string;
  item_price: number;
  user_wallet: string;
}

interface ProfileProps {
  userItems: UserItems[];
}

const Profile: FC<ProfileProps> = ({ userItems }) => {
  return (
    <>
      <div className="flex flex-col items-center w-full h-screen py-10 bg-gray-900 text-white">
        <div className="text-2xl font-bold mb-10">Items Owned</div>
        {userItems.map((userItem) => (
          <ItemCard key={userItem.id} userItem={userItem} />
        ))}
        {userItems.length === 0 && (
          <p className="col-span-full text-center text-gray-500">
            No Items Owned.
          </p>
        )}
      </div>
    </>
  );
};

export default Profile;
