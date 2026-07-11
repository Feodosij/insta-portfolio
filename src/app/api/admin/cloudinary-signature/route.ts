import { NextResponse } from "next/server";

import { buildUploadSignature } from "@/lib/cloudinary";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const folder = typeof body?.folder === "string" ? body.folder : "gallery";
  const timestamp = Math.round(Date.now() / 1000);

  const paramsToSign = { timestamp, folder };
  const signature = buildUploadSignature(paramsToSign);

  return NextResponse.json({
    signature,
    timestamp,
    folder,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  });
}
