import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: photos, error } = await supabase
    .from("photos")
    .select("id, cloudinary_url")
    .order("order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(photos);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const cloudinaryUrl = body?.cloudinary_url;
  const cloudinaryPublicId = body?.cloudinary_public_id;

  if (
    typeof cloudinaryUrl !== "string" ||
    typeof cloudinaryPublicId !== "string"
  ) {
    return NextResponse.json(
      { error: "cloudinary_url and cloudinary_public_id are required" },
      { status: 400 },
    );
  }

  const { data: last } = await supabase
    .from("photos")
    .select("order")
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (last?.order ?? -1) + 1;

  const { data: photo, error } = await supabase
    .from("photos")
    .insert({
      cloudinary_url: cloudinaryUrl,
      cloudinary_public_id: cloudinaryPublicId,
      order: nextOrder,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(photo, { status: 201 });
}
