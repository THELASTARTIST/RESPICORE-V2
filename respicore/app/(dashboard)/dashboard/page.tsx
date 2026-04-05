// app/(dashboard)/dashboard/page.tsx
// Main dashboard page — React Server Component.
// Fetches session + initial metric data on the server,
// then passes it to the DashboardClient island.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";
import type { HealthMetric, Profile } from "@/lib/types/health";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  // Fetch last 30 days of metrics
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: metrics } = await supabase
    .from("health_metrics")
    .select("*")
    .eq("user_id", user.id)
    .gte("recorded_at", thirtyDaysAgo.toISOString())
    .order("recorded_at", { ascending: false })
    .limit(50)
    .returns<HealthMetric[]>();

  const initialMetrics: HealthMetric[] = metrics ?? [];
  const latestMetric = initialMetrics[0] ?? null;

  return (
    <DashboardClient
      user={{ id: user.id, email: user.email ?? "" }}
      profile={profile ?? null}
      initialMetrics={initialMetrics}
      latestMetric={latestMetric}
    />
  );
}
