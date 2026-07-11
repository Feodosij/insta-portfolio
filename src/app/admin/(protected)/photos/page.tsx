"use client";

import { useEffect, useState } from "react";

import PhotoList from "@/components/admin/PhotoList";
import PhotoUploadForm from "@/components/admin/PhotoUploadForm";

type AdminPhoto = { id: string; cloudinary_url: string };

export default function AdminPhotosPage() {
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/photos")
      .then((response) => response.json())
      .then((data: AdminPhoto[]) => setPhotos(data))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Фото</h1>
      <PhotoUploadForm
        onUploaded={(photo) => setPhotos((prev) => [...prev, photo])}
      />
      {isLoading ? (
        <p className="text-sm text-zinc-500">Завантаження…</p>
      ) : (
        <PhotoList
          photos={photos}
          onDeleted={(id) =>
            setPhotos((prev) => prev.filter((photo) => photo.id !== id))
          }
        />
      )}
    </div>
  );
}
