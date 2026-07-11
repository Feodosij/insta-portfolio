import { NextResponse } from "next/server";

import { categoryDiff } from "@/lib/categoryDiff";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
  request: Request,
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
  const body = await request.json().catch(() => null);
  const categoryIds = body?.category_ids;

  if (
    !Array.isArray(categoryIds) ||
    categoryIds.some((categoryId) => typeof categoryId !== "string")
  ) {
    return NextResponse.json(
      { error: "category_ids must be an array of strings" },
      { status: 400 },
    );
  }

  const { data: existing, error: fetchError } = await supabase
    .from("photo_categories")
    .select("category_id")
    .eq("photo_id", id);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const { toAdd, toRemove } = categoryDiff(
    (existing ?? []).map((row) => row.category_id),
    categoryIds,
  );

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from("photo_categories")
      .delete()
      .eq("photo_id", id)
      .in("category_id", toRemove);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (toAdd.length > 0) {
    const { error } = await supabase
      .from("photo_categories")
      .insert(toAdd.map((categoryId) => ({ photo_id: id, category_id: categoryId })));

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
