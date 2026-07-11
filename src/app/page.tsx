import Gallery from "@/components/Gallery";
import Hero from "@/components/Hero";
import { createClient } from "@/lib/supabase/server";
import type { SiteContentKey } from "@/lib/supabase/types";

const HERO_NAME_FALLBACK = "Florisia";

export default async function Home() {
  const supabase = await createClient();

  const [
    { data: categories },
    { data: photos },
    { data: photoCategories },
    { data: siteContent },
  ] = await Promise.all([
    supabase.from("categories").select("*").order("order", { ascending: true }),
    supabase.from("photos").select("*").order("order", { ascending: true }),
    supabase.from("photo_categories").select("*"),
    supabase.from("site_content").select("*"),
  ]);

  const content = Object.fromEntries(
    (siteContent ?? []).map((row) => [row.key, row.value]),
  ) as Partial<Record<SiteContentKey, string>>;

  const categoryIdsByPhoto = new Map<string, string[]>();
  for (const link of photoCategories ?? []) {
    const ids = categoryIdsByPhoto.get(link.photo_id) ?? [];
    ids.push(link.category_id);
    categoryIdsByPhoto.set(link.photo_id, ids);
  }

  const galleryPhotos = (photos ?? []).map((photo) => ({
    id: photo.id,
    url: photo.cloudinary_url,
    categoryIds: categoryIdsByPhoto.get(photo.id) ?? [],
  }));

  return (
    <div className="flex flex-1 flex-col">
      <Hero
        name={content.hero_name ?? HERO_NAME_FALLBACK}
        photoUrl={content.hero_photo_url ?? null}
      />
      <section id="gallery" className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
        <Gallery categories={categories ?? []} photos={galleryPhotos} />
      </section>
    </div>
  );
}
