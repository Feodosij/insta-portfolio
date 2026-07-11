"use client";

import { useEffect, useState } from "react";

import TabsManager from "@/components/admin/TabsManager";
import { createClient } from "@/lib/supabase/client";

type Category = { id: string; name: string };

export default function AdminTabsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("categories")
      .select("id, name")
      .order("order", { ascending: true })
      .then(({ data }) => {
        setCategories(data ?? []);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Таби</h1>
      {isLoading ? (
        <p className="text-sm text-zinc-500">Завантаження…</p>
      ) : (
        <TabsManager categories={categories} onCategoriesChange={setCategories} />
      )}
    </div>
  );
}
