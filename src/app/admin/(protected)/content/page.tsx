"use client";

import { useEffect, useState } from "react";

import SiteContentForm from "@/components/admin/SiteContentForm";
import { createClient } from "@/lib/supabase/client";
import type { SiteContentKey } from "@/lib/supabase/types";

export default function AdminContentPage() {
  const [content, setContent] = useState<Partial<Record<SiteContentKey, string>>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("site_content")
      .select("*")
      .then(({ data }) => {
        setContent(
          Object.fromEntries((data ?? []).map((row) => [row.key, row.value])),
        );
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Текст сайту</h1>
      {isLoading ? (
        <p className="text-sm text-zinc-500">Завантаження…</p>
      ) : (
        <SiteContentForm initialContent={content} />
      )}
    </div>
  );
}
