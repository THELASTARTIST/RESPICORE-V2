// app/(dashboard)/dashboard/page.tsx
// Main dashboard page — React Server Component.
// Fetches session + initial metric data on the server,
// then passes it to the DashboardClient island.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";
import type { HealthMetric, MedicationLog, Profile } from "@/lib/types/health";

export type TriageReport = {
  id: string;
  user_id: string;
  predicted_class: "normal" | "anomalous" | "wheeze" | "copd";
  confidence: number;
  probabilities: { normal: number; anomalous: number; wheeze: number; copd: number };
  inference_ms: number | null;
  cough_count: number | null;
  hoarseness_index: number | null;
  breathing_duration_secs: number | null;
  created_at: string;
};

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

  // Fetch triage reports
  const { data: reports } = await supabase
    .from("triage_reports")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<TriageReport[]>();

  const triageReports: TriageReport[] = reports ?? [];

  // Fetch medication logs
  const { data: medsData } = await supabase
    .from("medications_log")
    .select("*")
    .eq("user_id", user.id)
    .gte("taken_at", thirtyDaysAgo.toISOString())
    .order("taken_at", { ascending: false })
    .limit(50)
    .returns<MedicationLog[]>();

  const initialMeds: MedicationLog[] = medsData ?? [];

  return (
    <DashboardClient
      user={{ id: user.id, email: user.email ?? "" }}
      profile={profile ?? null}
      initialMetrics={initialMetrics}
      latestMetric={latestMetric}
      triageReports={triageReports}
      initialMeds={initialMeds}
    />
  );
}
