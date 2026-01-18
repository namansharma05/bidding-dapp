import { useRef, useState } from "react";

export const UploadButton = ({
  onUploadComplete,
}: {
  onUploadComplete: (url: string) => void;
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex justify-center text-black mt-4">
      <input
        disabled={isUploading}
        ref={fileInputRef}
        onChange={async (e) => {
          const file = e.target.files?.[0] as File;
          if (!file) return;
          setIsUploading(true);

          const data = new FormData();
          data.set("file", file);

          // client / browser ----> router handler ----> pinata server

          const uploadRequest = await fetch("/api/files", {
            method: "POST",
            body: data,
          });
          const signedUrl = await uploadRequest.json();
          onUploadComplete(signedUrl);
          setIsUploading(false);
        }}
        className="absolute right-[9999px]"
        type="file"
      />
      <button
        disabled={isUploading}
        className="bg-blue-500 px-4 py-2 text-white rounded-sm self-center font-semibold"
        onClick={() => {
          fileInputRef.current?.click();
        }}
      >
        {isUploading ? "Uploading..." : "Upload Image"}
      </button>
    </div>
  );
};
