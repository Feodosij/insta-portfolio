import Link from "next/link";
import { redirect } from "next/navigation";

import LogoutButton from "@/components/admin/LogoutButton";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-lg font-semibold">Адмінка Florisia</span>
          <nav className="flex gap-4 text-sm text-zinc-600 dark:text-zinc-300">
            <Link href="/admin/photos" className="hover:text-zinc-900 dark:hover:text-zinc-50">
              Фото
            </Link>
            <Link href="/admin/tabs" className="hover:text-zinc-900 dark:hover:text-zinc-50">
              Таби
            </Link>
            <Link href="/admin/content" className="hover:text-zinc-900 dark:hover:text-zinc-50">
              Текст
            </Link>
          </nav>
        </div>
        <LogoutButton />
      </header>
      {children}
    </div>
  );
}
