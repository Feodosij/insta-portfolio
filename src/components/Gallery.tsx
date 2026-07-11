"use client";

import { useMemo, useState } from "react";

import GalleryTabs from "./GalleryTabs";
import PhotoCard from "./PhotoCard";

type Category = { id: string; name: string };
type GalleryPhoto = { id: string; url: string; categoryIds: string[] };

type GalleryProps = {
  categories: Category[];
  photos: GalleryPhoto[];
};

export default function Gallery({ categories, photos }: GalleryProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(
    null,
  );

  const visiblePhotos = useMemo(() => {
    if (activeCategoryId === null) return photos;
    return photos.filter((photo) =>
      photo.categoryIds.includes(activeCategoryId),
    );
  }, [photos, activeCategoryId]);

  return (
    <div className="flex flex-col gap-8">
      <GalleryTabs
        categories={categories}
        activeId={activeCategoryId}
        onChange={setActiveCategoryId}
      />
      <div className="columns-2 gap-3 sm:columns-3">
        {visiblePhotos.map((photo) => (
          <PhotoCard key={photo.id} url={photo.url} />
        ))}
      </div>
    </div>
  );
}
