import { useRef, useState } from "react";

export const UploadButton = ({
  onUploadComplete,
  className,
}: {
  onUploadComplete: (url: string) => void;
  className?: string;
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="relative">
      <input
        disabled={isUploading}
        ref={fileInputRef}
        onChange={async (e) => {
          const file = e.target.files?.[0] as File;
          if (!file) return;
          setIsUploading(true);

          const data = new FormData();
          data.set("file", file);

          const uploadRequest = await fetch("/api/files", {
            method: "POST",
            body: data,
          });
          const signedUrl = await uploadRequest.json();
          onUploadComplete(signedUrl);
          setIsUploading(false);
        }}
        className="hidden"
        type="file"
      />
      <button
        disabled={isUploading}
        className={className}
        onClick={() => {
          fileInputRef.current?.click();
        }}
      >
        {isUploading ? "Uploading..." : "Upload Image"}
      </button>
    </div>
  );
};
