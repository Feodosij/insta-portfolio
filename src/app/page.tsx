import Gallery from "@/components/Gallery";
import Hero from "@/components/Hero";
import ServicesSection from "@/components/ServicesSection";
import { createClient } from "@/lib/supabase/server";
import type { SiteContentKey } from "@/lib/supabase/types";

const HERO_NAME_FALLBACK = "Florisia";
const SERVICES_TEXT_FALLBACK =
  "Пишіть мені в Instagram або Telegram, щоб замовити букет чи обговорити весільний декор.";

export default async function Home() {
  const supabase = await createClient();

  const [{ data: categories }, { data: siteContent }, { count: photosCount }] =
    await Promise.all([
      supabase.from("categories").select("*").order("order", { ascending: true }),
      supabase.from("site_content").select("*"),
      supabase.from("photos").select("*", { count: "exact", head: true }),
    ]);

  const content = Object.fromEntries(
    (siteContent ?? []).map((row) => [row.key, row.value]),
  ) as Partial<Record<SiteContentKey, string>>;

  return (
    <div className="flex flex-1 flex-col">
      <Hero
        name={content.hero_name ?? HERO_NAME_FALLBACK}
        photoUrl={content.hero_photo_url ?? null}
      />
      <section id="gallery" className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
        <Gallery categories={categories ?? []} hasAnyPhotos={(photosCount ?? 0) > 0} />
      </section>
      <ServicesSection
        text={content.services_text ?? SERVICES_TEXT_FALLBACK}
        instagramUrl={content.instagram_url ?? null}
        telegramUrl={content.telegram_url ?? null}
      />
    </div>
  );
}
