import { NextResponse } from "next/server";

import cloudinary from "@/lib/cloudinary";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const { data: photo, error: fetchError } = await supabase
    .from("photos")
    .select("cloudinary_public_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!photo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await cloudinary.uploader.destroy(photo.cloudinary_public_id);

  const { error: deleteError } = await supabase
    .from("photos")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
