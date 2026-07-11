"use client";

import { useState } from "react";

type AdminPhoto = { id: string; cloudinary_url: string };

type ConfirmDeleteModalProps = {
  photo: AdminPhoto;
  onCancel: () => void;
  onConfirmed: () => void;
};

export default function ConfirmDeleteModal({
  photo,
  onCancel,
  onConfirmed,
}: ConfirmDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setIsDeleting(true);
    setError(null);

    const response = await fetch(`/api/admin/photos/${photo.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setError("Не вдалося видалити фото");
      setIsDeleting(false);
      return;
    }

    onConfirmed();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <div
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white p-6 dark:bg-zinc-900"
        onClick={(event) => event.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- admin preview, same reasoning as PhotoCard: no stored width/height for next/image */}
        <img
          src={photo.cloudinary_url}
          alt=""
          className="h-40 w-full rounded-lg object-cover"
        />
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Точно видалити це фото? Дію не можна скасувати.
        </p>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-full px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Скасувати
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {isDeleting ? "Видалення..." : "Видалити"}
          </button>
        </div>
      </div>
    </div>
  );
}
