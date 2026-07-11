import { NextResponse } from "next/server";

import { reorder } from "@/lib/reorder";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const ids = body?.ids;

  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
    return NextResponse.json(
      { error: "ids must be an array of strings" },
      { status: 400 },
    );
  }

  const { data: categories, error: fetchError } = await supabase
    .from("categories")
    .select("id, order");

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const reordered = reorder(categories ?? [], ids);

  const results = await Promise.all(
    reordered.map((category) =>
      supabase
        .from("categories")
        .update({ order: category.order })
        .eq("id", category.id),
    ),
  );

  const failed = results.find((result) => result.error);
  if (failed?.error) {
    return NextResponse.json({ error: failed.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
