"use client";
import { Navbar } from "./components/Navbar";
import Profile from "./components/Profile";
import Store from "./components/Store";
import { useEffect, useState } from "react";
import { supabase } from "./utils/supabaseClient";
import { useWallet } from "@solana/wallet-adapter-react";

interface UserItems {
  id: string;
  name: string;
  description: string;
  image_url: string;
  item_price: number;
  user_wallet: string;
}

export default function Home() {
  const [userItems, setUserItems] = useState<UserItems[]>([]);
  const [profileClicked, setProfileClicked] = useState(false);

  const wallet = useWallet();
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_wallet", wallet.publicKey!);

      if (error) {
        console.error("Error fetching users:", error);
      } else {
        setUserItems(data || []);
      }
    };
    fetchUsers();
  }, [profileClicked, wallet.publicKey]);
  return (
    <div>
      <Navbar
        profileClicked={profileClicked}
        setProfileClicked={setProfileClicked}
      />
      {profileClicked ? <Profile userItems={userItems} /> : <Store />}
    </div>
  );
}
