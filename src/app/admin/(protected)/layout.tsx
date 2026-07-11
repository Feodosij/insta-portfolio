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
        <span className="text-lg font-semibold">Адмінка Florisia</span>
        <LogoutButton />
      </header>
      {children}
    </div>
  );
}
