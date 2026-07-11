import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { createClient } from "@/lib/supabase/server";
import type { SiteContentKey } from "@/lib/supabase/types";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const TITLE_FALLBACK = "Florisia — флорист";
const DESCRIPTION_FALLBACK =
  "Флористичне портфоліо: букети та весільний декор.";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();

  const [{ data: siteContent }, { data: firstPhoto }] = await Promise.all([
    supabase.from("site_content").select("*"),
    supabase
      .from("photos")
      .select("cloudinary_url")
      .order("order", { ascending: true })
      .limit(1),
  ]);

  const content = Object.fromEntries(
    (siteContent ?? []).map((row) => [row.key, row.value]),
  ) as Partial<Record<SiteContentKey, string>>;

  const title = content.hero_name ? `${content.hero_name} — флорист` : TITLE_FALLBACK;
  const description = content.services_text ?? DESCRIPTION_FALLBACK;
  // If the admin hasn't uploaded a hero photo yet via the content editor
  // (Session 13), fall back to the first real gallery photo.
  const ogImage = content.hero_photo_url ?? firstPhoto?.[0]?.cloudinary_url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uk"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
