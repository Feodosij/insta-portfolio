import { NextResponse } from "next/server";

import { decodeCursor, encodeCursor, paginate } from "@/lib/pagination";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 60;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const categoryId = url.searchParams.get("category");
  const cursor = decodeCursor(url.searchParams.get("cursor"));
  const limit = parseLimit(url.searchParams.get("limit"));

  const supabase = await createClient();

  let photoIds: string[] | null = null;
  if (categoryId) {
    const { data: links, error } = await supabase
      .from("photo_categories")
      .select("photo_id")
      .eq("category_id", categoryId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    photoIds = (links ?? []).map((link) => link.photo_id);
    if (photoIds.length === 0) {
      return NextResponse.json({ items: [], nextCursor: null });
    }
  }

  let query = supabase.from("photos").select("id, cloudinary_url, order");
  if (photoIds) {
    query = query.in("id", photoIds);
  }

  const { data: photos, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { items, nextCursor } = paginate(photos ?? [], { cursor, limit });

  return NextResponse.json({
    items: items.map((photo) => ({ id: photo.id, url: photo.cloudinary_url })),
    nextCursor: nextCursor ? encodeCursor(nextCursor) : null,
  });
}

function parseLimit(raw: string | null): number {
  const parsed = raw ? Number(raw) : DEFAULT_LIMIT;
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}
