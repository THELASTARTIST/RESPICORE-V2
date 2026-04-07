// app/api/export/csv/route.ts
// GET /api/export/csv — returns CSV export of health metrics, triage reports, medications, and analyses

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeSleepDisruption } from "@/lib/sleep_analysis";
import { computeRescueInhalerStats } from "@/lib/inhaler_tracker";

function escapeCsv(val: string | number | null | undefined): string {
  if (val == null) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const [{ data: metrics }, { data: reports }, { data: medications }] =
    await Promise.all([
      supabase
        .from("health_metrics")
        .select("*")
        .eq("user_id", user.id)
        .gte("recorded_at", oneYearAgo.toISOString())
        .order("recorded_at", { ascending: false }),
      supabase
        .from("triage_reports")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", oneYearAgo.toISOString())
        .order("created_at", { ascending: false }),
      supabase
        .from("medications_log")
        .select("*")
        .eq("user_id", user.id)
        .gte("taken_at", oneYearAgo.toISOString())
        .order("taken_at", { ascending: false }),
    ]);

  let csv = "";

  // ── Metrics section ──
  csv += "=== Health Metrics ===\n";
  csv += "Recorded At,SpO2,Heart Rate,Resp Rate,Peak Flow,FEV1,Symptom Score,Exercise Done,Exercise Duration (min),Notes\n";
  if (metrics && metrics.length > 0) {
    for (const m of metrics) {
      csv += [
        m.recorded_at,
        m.spo2 ?? "",
        m.heart_rate ?? "",
        m.respiratory_rate ?? "",
        m.peak_flow ?? "",
        m.fev1 ?? "",
        m.symptom_score ?? "",
        m.breathing_exercise_done ? "Yes" : "No",
        m.exercise_duration_mins ?? "",
        m.notes ?? "",
      ]
        .map(escapeCsv)
        .join(",");
      csv += "\n";
    }
  } else {
    csv += "No data\n";
  }

  csv += "\n";

  // ── Triage Reports with Voice Biomarkers ──
  csv += "=== Triage Reports ===\n";
  csv += "Date,Predicted Class,Confidence,Normal %,Anomalous %,Wheeze %,COPD %,Cough Count,Hoarseness Index,Breathing Duration (s),Latency (ms)\n";
  if (reports && reports.length > 0) {
    for (const r of reports) {
      csv += [
        r.created_at,
        r.predicted_class,
        (r.confidence * 100).toFixed(1) + "%",
        ((r.probabilities?.normal ?? 0) * 100).toFixed(1) + "%",
        ((r.probabilities?.anomalous ?? 0) * 100).toFixed(1) + "%",
        ((r.probabilities?.wheeze ?? 0) * 100).toFixed(1) + "%",
        ((r.probabilities?.copd ?? 0) * 100).toFixed(1) + "%",
        r.cough_count ?? "",
        r.hoarseness_index ?? "",
        r.breathing_duration_secs ?? "",
        r.inference_ms ?? "",
      ]
        .map(escapeCsv)
        .join(",");
      csv += "\n";
    }
  } else {
    csv += "No data\n";
  }

  csv += "\n";

  // ── Medications with Puff Tracking ──
  csv += "=== Medications ===\n";
  csv += "Date,Type,Medication Name,Dosage,Puff Count,Notes\n";
  if (medications && medications.length > 0) {
    for (const med of medications) {
      csv += [
        med.taken_at,
        med.medication_type.replace("_", " "),
        med.medication_name ?? "",
        med.dosage ?? "",
        med.puff_count ?? "",
        med.notes ?? "",
      ]
        .map(escapeCsv)
        .join(",");
      csv += "\n";
    }
  } else {
    csv += "No data\n";
  }

  csv += "\n";

  // ── Sleep Disruption Analysis ──
  if (metrics && medications) {
    const sleepData = computeSleepDisruption(metrics, medications, 4);
    csv += "=== Sleep Disruption Index (Weekly) ===\n";
    csv += "Week Start,Week End,Rescue Inhaler Nights,Avg Morning SpO2 (All),Avg Morning SpO2 (After Meds),SpO2 Delta %,Summary\n";
    for (const r of sleepData) {
      csv += [
        r.week_start,
        r.week_end,
        r.n_rescue_inhaler_nights,
        r.avg_morning_spo2_all || "",
        r.avg_morning_spo2_after_meds || "",
        r.spo2_delta_pct !== 0 ? r.spo2_delta_pct.toFixed(1) + "%" : "",
        r.summary,
      ]
        .map(escapeCsv)
        .join(",");
      csv += "\n";
    }

    csv += "\n";
  }

  // ── Rescue Inhaler Stats ──
  if (medications) {
    const inhalerStats = computeRescueInhalerStats(medications);
    csv += "=== Rescue Inhaler Efficiency ===\n";
    csv += `Total Puffs (This Week),${inhalerStats?.total_puffs_week}\n`;
    csv += `Total Puffs (Last Week),${inhalerStats?.total_puffs_last_week}\n`;
    csv += `Days with Usage,${inhalerStats?.days_with_usage_week}/7\n`;
    csv += `Trend,${inhalerStats?.trend}\n`;
    csv += `GINA Flag,${inhalerStats?.gina_flag ? "YES - UNCONTROLLED" : "No - Controlled"}\n`;

    csv += "\nDaily Breakdown (Last 7 Days)\n";
    csv += "Date,Puffs\n";
    if (inhalerStats?.daily_breakdown) {
      for (const d of inhalerStats.daily_breakdown) {
        csv += `${d.date},${d.puffs}\n`;
      }
    }
  }

  const filename = `respicore_export_${user.id.slice(0, 8)}_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
