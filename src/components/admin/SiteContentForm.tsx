"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";

import type { SiteContentKey } from "@/lib/supabase/types";

type SiteContentFormProps = {
  initialContent: Partial<Record<SiteContentKey, string>>;
};

export default function SiteContentForm({ initialContent }: SiteContentFormProps) {
  const [heroName, setHeroName] = useState(initialContent.hero_name ?? "");
  const [heroPhotoUrl, setHeroPhotoUrl] = useState(
    initialContent.hero_photo_url ?? "",
  );
  const [servicesText, setServicesText] = useState(
    initialContent.services_text ?? "",
  );
  const [instagramUrl, setInstagramUrl] = useState(
    initialContent.instagram_url ?? "",
  );
  const [telegramUrl, setTelegramUrl] = useState(
    initialContent.telegram_url ?? "",
  );

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsUploadingPhoto(true);
    setError(null);

    try {
      const signatureResponse = await fetch("/api/admin/cloudinary-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "site" }),
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

      setHeroPhotoUrl(cloudinaryResult.secure_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Сталася помилка");
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSavedAt(null);

    const items: { key: SiteContentKey; value: string }[] = [
      { key: "hero_name", value: heroName.trim() },
      { key: "hero_photo_url", value: heroPhotoUrl.trim() },
      { key: "services_text", value: servicesText.trim() },
      { key: "instagram_url", value: instagramUrl.trim() },
      { key: "telegram_url", value: telegramUrl.trim() },
    ];

    const response = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    if (!response.ok) {
      setError("Не вдалося зберегти зміни");
      setIsSaving(false);
      return;
    }

    setSavedAt(Date.now());
    setIsSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <label htmlFor="hero_name" className="text-sm text-zinc-600 dark:text-zinc-300">
          Ім&apos;я
        </label>
        <input
          id="hero_name"
          type="text"
          required
          value={heroName}
          onChange={(event) => setHeroName(event.target.value)}
          className="rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-zinc-600 dark:text-zinc-300">Фото на головній</span>
        {heroPhotoUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- admin preview, same reasoning as PhotoCard: no stored width/height for next/image
          <img
            src={heroPhotoUrl}
            alt=""
            className="h-40 w-full rounded-lg object-cover"
          />
        )}
        <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
          {isUploadingPhoto
            ? "Завантаження..."
            : heroPhotoUrl
              ? "Змінити фото"
              : "Завантажити фото"}
          <input
            type="file"
            accept="image/*"
            disabled={isUploadingPhoto}
            onChange={handlePhotoChange}
            className="hidden"
          />
        </label>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="services_text" className="text-sm text-zinc-600 dark:text-zinc-300">
          Текст послуг
        </label>
        <textarea
          id="services_text"
          required
          rows={4}
          value={servicesText}
          onChange={(event) => setServicesText(event.target.value)}
          className="rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="instagram_url" className="text-sm text-zinc-600 dark:text-zinc-300">
          Instagram URL
        </label>
        <input
          id="instagram_url"
          type="url"
          placeholder="https://instagram.com/..."
          value={instagramUrl}
          onChange={(event) => setInstagramUrl(event.target.value)}
          className="rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="telegram_url" className="text-sm text-zinc-600 dark:text-zinc-300">
          Telegram URL
        </label>
        <input
          id="telegram_url"
          type="url"
          placeholder="https://t.me/..."
          value={telegramUrl}
          onChange={(event) => setTelegramUrl(event.target.value)}
          className="rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {savedAt && !error && (
        <p className="text-sm text-green-600 dark:text-green-400">Збережено</p>
      )}

      <button
        type="submit"
        disabled={isSaving || isUploadingPhoto}
        className="w-fit rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {isSaving ? "Збереження..." : "Зберегти"}
      </button>
    </form>
  );
}
