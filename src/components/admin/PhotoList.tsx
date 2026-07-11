"use client";

import { useState } from "react";

import ConfirmDeleteModal from "./ConfirmDeleteModal";

type AdminPhoto = { id: string; cloudinary_url: string };

type PhotoListProps = {
  photos: AdminPhoto[];
  onDeleted: (id: string) => void;
};

export default function PhotoList({ photos, onDeleted }: PhotoListProps) {
  const [pendingDelete, setPendingDelete] = useState<AdminPhoto | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- admin grid, same reasoning as PhotoCard: no stored width/height for next/image */}
            <img
              src={photo.cloudinary_url}
              alt=""
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => setPendingDelete(photo)}
              className="absolute top-2 right-2 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white"
            >
              Видалити
            </button>
          </div>
        ))}
      </div>

      {pendingDelete && (
        <ConfirmDeleteModal
          photo={pendingDelete}
          onCancel={() => setPendingDelete(null)}
          onConfirmed={() => {
            onDeleted(pendingDelete.id);
            setPendingDelete(null);
          }}
        />
      )}
    </>
  );
}
