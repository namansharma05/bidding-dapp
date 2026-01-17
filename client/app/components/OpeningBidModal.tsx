"use client";
import { FC, useState } from "react";

export const OpeningBidModal: FC = () => {
    const [showModal, setShowModal] = useState(false);
    return (
        <>
            <div onClick={() => setShowModal(true)} className="h-10 w-30 bg-[#512da8] text-white text-lg font-bold flex items-center justify-center rounded-sm cursor-pointer hover:bg-[#6c44b9]">
                + OpenBid
            </div>
            {
                showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-1 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg">
                            <div className="flex  text-black items-center justify-between">

                                <h2 className="text-lg font-bold mb-4">Open Bid</h2>
                                <button className="text-lg rounded-full font-bold cursor-pointer" onClick={() => setShowModal(false)}>X</button>
                            </div>
                            <input type="text" placeholder="Enter your bid" className="border border-gray-300 rounded w-full p-2 mb-4" />
                            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Submit</button>
                        </div>
                    </div>
                )
            }
        </>
    );
}