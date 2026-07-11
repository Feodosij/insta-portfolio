"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import EmptyState from "./EmptyState";
import GalleryTabs from "./GalleryTabs";
import PhotoCard from "./PhotoCard";
import PhotoViewer from "./PhotoViewer";

type Category = { id: string; name: string };
type GalleryPhoto = { id: string; url: string };

type PhotosResponse = {
  items: GalleryPhoto[];
  nextCursor: string | null;
};

type GalleryProps = {
  categories: Category[];
  hasAnyPhotos: boolean;
};

const PAGE_LIMIT = 24;

export default function Gallery({ categories, hasAnyPhotos }: GalleryProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(
    null,
  );

  if (!hasAnyPhotos) {
    return <EmptyState message="Фото ще немає — портфоліо скоро з'явиться тут." />;
  }

  return (
    <div className="flex flex-col gap-8">
      <GalleryTabs
        categories={categories}
        activeId={activeCategoryId}
        onChange={setActiveCategoryId}
      />
      {/* Remounting on category change gives each tab a clean pagination
          state instead of resetting it by hand inside an effect. */}
      <GalleryGrid key={activeCategoryId ?? "all"} categoryId={activeCategoryId} />
    </div>
  );
}

function GalleryGrid({ categoryId }: { categoryId: string | null }) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchPage = useCallback(
    async (cursor: string | null) => {
      const params = new URLSearchParams();
      if (categoryId) params.set("category", categoryId);
      if (cursor) params.set("cursor", cursor);
      params.set("limit", String(PAGE_LIMIT));

      const response = await fetch(`/api/photos?${params.toString()}`);
      return (await response.json()) as PhotosResponse;
    },
    [categoryId],
  );

  // Loads the first page for this tab.
  useEffect(() => {
    let cancelled = false;

    fetchPage(null).then((data) => {
      if (cancelled) return;
      setPhotos(data.items);
      setNextCursor(data.nextCursor);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [fetchPage]);

  // Loads the next page once the sentinel scrolls into view.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !nextCursor || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsLoading(true);
          fetchPage(nextCursor).then((data) => {
            setPhotos((prev) => [...prev, ...data.items]);
            setNextCursor(data.nextCursor);
            setIsLoading(false);
          });
        }
      },
      { rootMargin: "400px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [nextCursor, isLoading, fetchPage]);

  return (
    <>
      {photos.length === 0 && !isLoading ? (
        <EmptyState message="У цьому табі поки немає фото." />
      ) : (
        <div className="columns-2 gap-3 sm:columns-3">
          {photos.map((photo, index) => (
            <PhotoCard
              key={photo.id}
              url={photo.url}
              onClick={() => setViewerIndex(index)}
            />
          ))}
        </div>
      )}
      <div ref={sentinelRef} className="h-1" />

      {viewerIndex !== null && (
        <PhotoViewer
          photos={photos}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </>
  );
}
