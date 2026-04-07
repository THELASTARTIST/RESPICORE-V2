// app/api/weekly-report/route.ts
// GET /api/weekly-report — generates a comprehensive clinical report
// combining all analyses: sleep, inhaler, biomarkers, baseline.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeSleepDisruption } from "@/lib/sleep_analysis";
import { computeRescueInhalerStats } from "@/lib/inhaler_tracker";
import { computePersonalBaseline } from "@/lib/baseline";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const [{ data: metrics }, { data: reports }, { data: medications }] = await Promise.all([
    supabase.from("health_metrics").select("*").eq("user_id", user.id)
      .gte("recorded_at", fourWeeksAgo.toISOString()).order("recorded_at", { ascending: false }),
    supabase.from("triage_reports").select("*").eq("user_id", user.id)
      .gte("created_at", fourWeeksAgo.toISOString()).order("created_at", { ascending: false }),
    supabase.from("medications_log").select("*").eq("user_id", user.id)
      .gte("taken_at", fourWeeksAgo.toISOString()).order("taken_at", { ascending: false }),
  ]);

  if (!metrics?.length && !medications?.length) {
    return NextResponse.json({ error: "Insufficient data for report" }, { status: 400 });
  }

  const allMetrics = metrics ?? [];
  const allReports = reports ?? [];
  const allMedications = medications ?? [];

  // Analysis
  const sleepData = computeSleepDisruption(allMetrics, allMedications, 4);
  const inhalerStats = computeRescueInhalerStats(allMedications);
  const baseline = computePersonalBaseline(allMetrics);

  // Voice biomarker summaries
  const validCoughReports = allReports.filter(r => r.cough_count != null);
  const validHoarsenessReports = allReports.filter(r => r.hoarseness_index != null);
  const validBreathingReports = allReports.filter(r => r.breathing_duration_secs != null);

  // Triage class distribution
  const triageDistribution = {
    normal: allReports.filter(r => r.predicted_class === "normal").length,
    anomalous: allReports.filter(r => r.predicted_class === "anomalous").length,
    wheeze: allReports.filter(r => r.predicted_class === "wheeze").length,
    copd: allReports.filter(r => r.predicted_class === "copd").length,
  };

  // Medication summary
  const medSummary = {
    total_entries: allMedications.length,
    rescue_inhaler_count: allMedications.filter(m => m.medication_type === "inhaler_rescue").length,
    maintenance_count: allMedications.filter(m => m.medication_type === "inhaler_maintenance").length,
    other_count: allMedications.filter(m => !["inhaler_rescue", "inhaler_maintenance"].includes(m.medication_type)).length,
    avg_puffs_per_use: allMedications.filter(m => m.medication_type === "inhaler_rescue" && m.puff_count != null).length > 0
      ? Math.round(allMedications.filter(m => m.medication_type === "inhaler_rescue" && m.puff_count != null)
          .reduce((s, m) => s + (m.puff_count ?? 0), 0) / allMedications.filter(m => m.medication_type === "inhaler_rescue" && m.puff_count != null).length * 10) / 10
      : null,
  };

  // SpO2 stats from all readings
  const spo2Readings = allMetrics.map(m => m.spo2).filter((v): v is number => v != null);
  const spo2Stats = spo2Readings.length > 0
    ? {
        min: Math.min(...spo2Readings),
        max: Math.max(...spo2Readings),
        avg: Math.round((spo2Readings.reduce((s, v) => s + v, 0) / spo2Readings.length) * 10) / 10,
      }
    : null;

  // Heart rate stats
  const hrReadings = allMetrics.map(m => m.heart_rate).filter((v): v is number => v != null);
  const hrStats = hrReadings.length > 0
    ? {
        min: Math.min(...hrReadings),
        max: Math.max(...hrReadings),
        avg: Math.round((hrReadings.reduce((s, v) => s + v, 0) / hrReadings.length) * 10) / 10,
      }
    : null;

  const report = {
    generated_at: new Date().toISOString(),
    period: { start: fourWeeksAgo.toISOString(), end: new Date().toISOString() },
    total_readings: allMetrics.length,
    spo2_stats: spo2Stats,
    hr_stats: hrStats,
    voice_biomarkers: {
      total_recordings: allReports.length,
      avg_cough_count: validCoughReports.length > 0
        ? Math.round((validCoughReports.reduce((s, r) => s + (r.cough_count ?? 0), 0) / validCoughReports.length) * 10) / 10
        : null,
      avg_hoarseness_index: validHoarsenessReports.length > 0
        ? Math.round((validHoarsenessReports.reduce((s, r) => s + (r.hoarseness_index ?? 0), 0) / validHoarsenessReports.length) * 100) / 100
        : null,
      avg_breathing_duration: validBreathingReports.length > 0
        ? Math.round((validBreathingReports.reduce((s, r) => s + (r.breathing_duration_secs ?? 0), 0) / validBreathingReports.length) * 10) / 10
        : null,
    },
    medication_summary: medSummary,
    triage_distribution: triageDistribution,
    sleep_disruption: {
      latest_week: sleepData[sleepData.length - 1] ?? null,
      weekly_trend: sleepData,
    },
    inhaler_efficiency: inhalerStats,
    baseline,
  };

  return NextResponse.json({ data: report, error: null });
}
