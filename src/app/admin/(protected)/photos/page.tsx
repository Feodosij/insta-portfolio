"use client";

import { useEffect, useState } from "react";

import PhotoList from "@/components/admin/PhotoList";
import PhotoUploadForm from "@/components/admin/PhotoUploadForm";
import { createClient } from "@/lib/supabase/client";

type Category = { id: string; name: string };
type AdminPhoto = {
  id: string;
  cloudinary_url: string;
  categoryIds: string[];
};

export default function AdminPhotosPage() {
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    Promise.all([
      fetch("/api/admin/photos").then(
        (response) => response.json() as Promise<{ id: string; cloudinary_url: string }[]>,
      ),
      supabase.from("categories").select("id, name").order("order", { ascending: true }),
      supabase.from("photo_categories").select("photo_id, category_id"),
    ]).then(([adminPhotos, categoriesResult, photoCategoriesResult]) => {
      const categoryIdsByPhoto = new Map<string, string[]>();
      for (const row of photoCategoriesResult.data ?? []) {
        const list = categoryIdsByPhoto.get(row.photo_id) ?? [];
        list.push(row.category_id);
        categoryIdsByPhoto.set(row.photo_id, list);
      }

      setCategories(categoriesResult.data ?? []);
      setPhotos(
        adminPhotos.map((photo) => ({
          ...photo,
          categoryIds: categoryIdsByPhoto.get(photo.id) ?? [],
        })),
      );
      setIsLoading(false);
    });
  }, []);

  function handleReordered(photoIds: string[]) {
    setPhotos((prev) => {
      const byId = new Map(prev.map((photo) => [photo.id, photo]));
      return photoIds.map((id) => byId.get(id)).filter((photo) => !!photo);
    });

    fetch("/api/admin/photos/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: photoIds }),
    }).catch(() => {
      // Best-effort persistence — the dragged order already shows locally;
      // a failed save just means it reverts on the next full reload.
    });
  }

  function handleCategoriesChanged(photoId: string, categoryIds: string[]) {
    setPhotos((prev) =>
      prev.map((photo) =>
        photo.id === photoId ? { ...photo, categoryIds } : photo,
      ),
    );

    fetch(`/api/admin/photos/${photoId}/categories`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category_ids: categoryIds }),
    }).catch(() => {
      // Same best-effort tradeoff as reorder above.
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Фото</h1>
      <PhotoUploadForm
        onUploaded={(photo) =>
          setPhotos((prev) => [
            ...prev,
            {
              id: photo.id,
              cloudinary_url: photo.cloudinary_url,
              categoryIds: [],
            },
          ])
        }
      />
      {isLoading ? (
        <p className="text-sm text-zinc-500">Завантаження…</p>
      ) : (
        <PhotoList
          photos={photos}
          categories={categories}
          onDeleted={(id) =>
            setPhotos((prev) => prev.filter((photo) => photo.id !== id))
          }
          onReordered={handleReordered}
          onCategoriesChanged={handleCategoriesChanged}
        />
      )}
    </div>
  );
}
