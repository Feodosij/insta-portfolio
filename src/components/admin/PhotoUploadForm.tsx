"use client";

import { useState, type ChangeEvent } from "react";

type AdminPhoto = { id: string; cloudinary_url: string };

type PhotoUploadFormProps = {
  onUploaded: (photo: AdminPhoto) => void;
};

export default function PhotoUploadForm({ onUploaded }: PhotoUploadFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const signatureResponse = await fetch("/api/admin/cloudinary-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!signatureResponse.ok) {
        throw new Error("Не вдалося отримати підпис завантаження");
      }
      const { signature, timestamp, folder, apiKey, cloudName } =
        await signatureResponse.json();

      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("api_key", apiKey);
      uploadData.append("timestamp", String(timestamp));
      uploadData.append("signature", signature);
      uploadData.append("folder", folder);

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: uploadData },
      );
      if (!cloudinaryResponse.ok) {
        throw new Error("Не вдалося завантажити фото в Cloudinary");
      }
      const cloudinaryResult = await cloudinaryResponse.json();

      const photoResponse = await fetch("/api/admin/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cloudinary_url: cloudinaryResult.secure_url,
          cloudinary_public_id: cloudinaryResult.public_id,
        }),
      });
      if (!photoResponse.ok) {
        throw new Error("Не вдалося зберегти фото");
      }
      const photo = await photoResponse.json();

      onUploaded(photo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Сталася помилка");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200">
        {isUploading ? "Завантаження..." : "Додати фото"}
        <input
          type="file"
          accept="image/*"
          capture
          disabled={isUploading}
          onChange={handleFileChange}
          className="hidden"
        />
      </label>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
