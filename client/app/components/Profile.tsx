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
      <div className="flex flex-col items-center w-full h-screen py-10 bg-black text-white">
        <div className="text-2xl md:4xl lg:4xl font-bold mb-10 transition-all duration-300 ease-in-out">
          Items Owned
        </div>
        <div className="flex flex-col lg:flex-row items-center mx-5 gap-5 transition-all duration-300 ease-in-out">
          {userItems.map((userItem) => (
            <ItemCard key={userItem.id} userItem={userItem} />
          ))}
          {userItems.length === 0 && (
            <p className="col-span-full text-center text-white">
              No Items Owned.
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default Profile;
