"use client";

import { useEffect, useRef, useState } from "react";

type ViewerPhoto = { id: string; url: string };

type PhotoViewerProps = {
  photos: ViewerPhoto[];
  initialIndex: number;
  onClose: () => void;
};

const SWIPE_THRESHOLD_PX = 50;

export default function PhotoViewer({
  photos,
  initialIndex,
  onClose,
}: PhotoViewerProps) {
  const [index, setIndex] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);

  const goToPrevious = () => setIndex((current) => Math.max(current - 1, 0));
  const goToNext = () =>
    setIndex((current) => Math.min(current + 1, photos.length - 1));

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") {
        setIndex((current) => Math.max(current - 1, 0));
      }
      if (event.key === "ArrowRight") {
        setIndex((current) => Math.min(current + 1, photos.length - 1));
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, photos.length]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function handleTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: React.TouchEvent) {
    const startX = touchStartX.current;
    touchStartX.current = null;
    if (startX === null) return;

    const endX = event.changedTouches[0]?.clientX ?? startX;
    const delta = endX - startX;
    if (delta > SWIPE_THRESHOLD_PX) goToPrevious();
    if (delta < -SWIPE_THRESHOLD_PX) goToNext();
  }

  const photo = photos[index];
  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- variable aspect ratio, see PhotoCard */}
      <img
        src={photo.url}
        alt=""
        className="max-h-full max-w-full object-contain"
        onClick={(event) => event.stopPropagation()}
      />

      <button
        type="button"
        onClick={onClose}
        aria-label="Закрити"
        className="absolute top-4 right-4 text-3xl text-white"
      >
        ×
      </button>

      {index > 0 && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            goToPrevious();
          }}
          aria-label="Попереднє фото"
          className="absolute top-1/2 left-4 -translate-y-1/2 text-4xl text-white"
        >
          ‹
        </button>
      )}
      {index < photos.length - 1 && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            goToNext();
          }}
          aria-label="Наступне фото"
          className="absolute top-1/2 right-4 -translate-y-1/2 text-4xl text-white"
        >
          ›
        </button>
      )}
    </div>
  );
}
