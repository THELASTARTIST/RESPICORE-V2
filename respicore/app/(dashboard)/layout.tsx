// app/(dashboard)/layout.tsx
// Layout wrapper for all dashboard routes.
// Server Component — validates session before rendering children.
// Acts as a second layer of protection beyond middleware.ts.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-900">
      {children}
    </div>
  );
}
