import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { SiteContentKey } from "@/lib/supabase/types";

const KNOWN_KEYS: SiteContentKey[] = [
  "hero_name",
  "hero_photo_url",
  "services_text",
  "instagram_url",
  "telegram_url",
];

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const items = body?.items;

  const isValid =
    Array.isArray(items) &&
    items.every(
      (item) =>
        typeof item?.key === "string" &&
        KNOWN_KEYS.includes(item.key) &&
        typeof item?.value === "string",
    );

  if (!isValid) {
    return NextResponse.json(
      { error: `items must be an array of { key, value }, key one of ${KNOWN_KEYS.join(", ")}` },
      { status: 400 },
    );
  }

  // Empty values are treated as "clear this field" rather than stored as
  // an empty string — otherwise `content.hero_name ?? FALLBACK` on the
  // public site would stop falling back once the row exists.
  const toUpsert = items.filter((item) => item.value.trim() !== "");
  const toDelete = items
    .filter((item) => item.value.trim() === "")
    .map((item) => item.key);

  if (toUpsert.length > 0) {
    const { error } = await supabase
      .from("site_content")
      .upsert(toUpsert, { onConflict: "key" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (toDelete.length > 0) {
    const { error } = await supabase
      .from("site_content")
      .delete()
      .in("key", toDelete);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
