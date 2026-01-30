"use client";
import { Navbar } from "./components/Navbar";
import Profile from "./components/Profile";
import Store from "./components/Store";
import { useState } from "react";

export default function Home() {
  const [profileClicked, setProfileClicked] = useState(false);
  return (
    <>
      <Navbar
        profileClicked={profileClicked}
        setProfileClicked={setProfileClicked}
      />
      {profileClicked && (
        <div className="flex justify-center items-center">
          <Profile />
        </div>
      )}
      {!profileClicked && <Store />}
    </>
  );
}
