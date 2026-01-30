import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";

interface Users {
  id: string;
  name: string;
  description: string;
  image_url: string;
  item_price: number;
  user_wallet: string;
}

const Profile = () => {
  const [users, setUsers] = useState<Users[]>([]);

  const wallet = useWallet();
  if (!wallet.publicKey) return null;

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from("users").select("*");

      if (error) {
        console.error("Error fetching users:", error);
      } else {
        setUsers(data || []);
      }
    };
    fetchUsers();
  }, []);
  return (
    <>
      <div className="flex flex-col items-center w-full h-screen py-10 bg-gray-900 text-white">
        <div className="text-2xl font-bold">{wallet.publicKey.toBase58()}</div>
      </div>
    </>
  );
};

export default Profile;
