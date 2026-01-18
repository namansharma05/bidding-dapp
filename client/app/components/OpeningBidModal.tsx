"use client";
import { FC, useRef, useState } from "react";

export const OpeningBidModal: FC = () => {
    const [showModal, setShowModal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement|null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
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
                            {imageUrl && <img src={imageUrl} alt="Image from Pinata" />}
                            <div className="flex justify-center text-black">
                                <input disabled={isUploading} ref={fileInputRef} onChange={async(e) => {
                                    const file = e.target.files?.[0] as File;
                                    setIsUploading(true);
                                    
                                    const data = new FormData();
                                    data.set("file", file);

                                    // client / browser ----> router handler ----> pinata server

                                    const uploadRequest = await fetch("/api/files", {
                                        method: "POST",
                                        body: data,
                                    });
                                    const signedUrl = await uploadRequest.json();
                                    setImageUrl(signedUrl);
                                    setIsUploading(false);
                                }} className="absolute right-[9999px]" type="file"/>
                                <button disabled={isUploading} className="bg-blue-500 px-4 py-2 text-white rounded-sm self-center font-semibold" onClick={() => {
                                    fileInputRef.current?.click();
                                }}>{isUploading? "Uploading..." : "Upload Image"}</button>
                            </div>
                            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Submit</button>
                        </div>
                    </div>
                )
            }
        </>
    );
}