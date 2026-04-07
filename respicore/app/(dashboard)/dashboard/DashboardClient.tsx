"use client";
// app/(dashboard)/dashboard/DashboardClient.tsx
// Client Component island for the dashboard.

import { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import MetricForm from "@/components/dashboard/MetricForm";
import MetricCard from "@/components/dashboard/MetricCard";
import MetricsChart from "@/components/dashboard/MetricsChart";
import TriageTrendsChart from "@/components/dashboard/TriageTrendsChart";
import AlertBanner from "@/components/dashboard/AlertBanner";
import ExportButton from "@/components/dashboard/ExportButton";
import BreathingExercise from "@/components/dashboard/BreathingExercise";
import MedicationHistory, { type MedicationLog } from "@/components/dashboard/MedicationHistory";
import MedicationForm from "@/components/dashboard/MedicationForm";
import VoiceBiomarkerSparklines from "@/components/dashboard/VoiceBiomarkerSparklines";
import SleepDisruptionCards from "@/components/dashboard/SleepDisruptionCard";
import RescueInhalerTracker from "@/components/dashboard/RescueInhalerTracker";
import PersonalBaselineCard from "@/components/dashboard/PersonalBaselineCard";
import WeeklyReportViewer from "@/components/dashboard/WeeklyReportViewer";
import { computeHealthAlerts } from "@/lib/alerts";
import { computeSleepDisruption } from "@/lib/sleep_analysis";
import { computePersonalBaseline, computeBaselineAlerts } from "@/lib/baseline";
import { computeRescueInhalerStats } from "@/lib/inhaler_tracker";
import type { HealthMetric, Profile } from "@/lib/types/health";

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

interface DashboardClientProps {
  user: { id: string; email: string };
  profile: Profile | null;
  initialMetrics: HealthMetric[];
  latestMetric: HealthMetric | null;
  triageReports: TriageReport[];
  initialMeds: MedicationLog[];
}

const LABELS: Record<string, string> = {
  normal: "Normal",
  anomalous: "Anomalous",
  wheeze: "Wheeze",
  copd: "COPD / Bronchitis",
};

const CLASS_COLORS: Record<string, string> = {
  normal: "text-green-400 border-green-500/30 bg-green-500/10",
  anomalous: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  wheeze: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
  copd: "text-red-400 border-red-500/30 bg-red-500/10",
};

function spo2Status(v: number | null | undefined) {
  if (v == null) return "neutral" as const;
  if (v >= 95) return "normal" as const;
  if (v >= 90) return "warning" as const;
  return "critical" as const;
}

function hrStatus(v: number | null | undefined) {
  if (v == null) return "neutral" as const;
  if (v >= 60 && v <= 100) return "normal" as const;
  if (v >= 50 && v <= 110) return "warning" as const;
  return "critical" as const;
}

function rrStatus(v: number | null | undefined) {
  if (v == null) return "neutral" as const;
  if (v >= 12 && v <= 20) return "normal" as const;
  if (v >= 10 && v <= 25) return "warning" as const;
  return "critical" as const;
}

function symptomStatus(v: number | null | undefined) {
  if (v == null) return "neutral" as const;
  if (v <= 3) return "normal" as const;
  if (v <= 6) return "warning" as const;
  return "critical" as const;
}

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

function getAvgSpo2(metrics: HealthMetric[]): number {
  const vals = metrics
    .map((m) => m.spo2)
    .filter((v): v is number => v !== null);
  if (!vals.length) return 0;
  return (
    Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
  );
}

export default function DashboardClient({
  user,
  profile,
  initialMetrics,
  latestMetric,
  triageReports,
  initialMeds,
}: DashboardClientProps) {
  const router = useRouter();
  const [metrics, setMetrics] = useState<HealthMetric[]>(initialMetrics);
  const [latest, setLatest] = useState<HealthMetric | null>(latestMetric);
  const [fetching, setFetching] = useState(false);
  const [compareIds, setCompareIds] = useState<(string | null)[]>([null, null]);
  const [triageData, setTriageData] = useState<TriageReport[]>(triageReports);
  const [medications, setMedications] = useState<MedicationLog[]>(initialMeds ?? []);
  const [showExercise, setShowExercise] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState<any>(null);

  // Fetch fresh data on mount for real-time update
  useEffect(() => {
    async function fetchFresh() {
      try {
        const [metricsRes, triageRes, medsRes] = await Promise.all([
          fetch("/api/health-metrics?limit=50"),
          fetch("/api/triage-reports?limit=50"),
          fetch("/api/medications?limit=50"),
        ]);
        const metricsJson = await metricsRes.json();
        const triageJson = await triageRes.json();
        const medsJson = await medsRes.json();
        if (metricsJson.data) {
          setMetrics(metricsJson.data);
          setLatest(metricsJson.data[0] ?? null);
        }
        if (triageJson.data) {
          setTriageData(triageJson.data);
        }
        if (medsJson.data) {
          setMedications(medsJson.data);
        }
      } catch (err) {
        console.error("Fresh fetch failed:", err);
      }
    }
    fetchFresh();
  }, []);

  const handleMetricAdded = useCallback(async () => {
    setFetching(true);
    try {
      const [metricsRes, triageRes] = await Promise.all([
        fetch("/api/health-metrics?limit=50"),
        fetch("/api/triage-reports?limit=50"),
      ]);
      const metricsJson = await metricsRes.json();
      const triageJson = await triageRes.json();
      if (metricsJson.data) {
        setMetrics(metricsJson.data);
        setLatest(metricsJson.data[0] ?? null);
      }
      if (triageJson.data) {
        setTriageData(triageJson.data);
        setCompareIds([null, null]);
      }
    } catch (err) {
      console.error("Refetch failed:", err);
    } finally {
      setFetching(false);
    }
  }, []);

  const handleMedicationAdded = useCallback(async () => {
    try {
      const res = await fetch("/api/medications?limit=50");
      const json = await res.json();
      if (json.data) setMedications(json.data);
    } catch (err) {
      console.error("Medication refetch failed:", err);
    }
  }, []);

  function handleExerciseComplete(totalSeconds: number) {
    setShowExercise(false);
    // Log breathing exercise as a metric entry
    fetch("/api/health-metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        breathing_exercise_done: true,
        exercise_duration_mins: Math.round(totalSeconds / 60),
      }),
    }).then(() => handleMetricAdded());
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function toggleCompare(id: string) {
    setCompareIds((prev) => {
      if (prev[0] === id) return [null, prev[1]];
      if (prev[1] === id) return [prev[0], null];
      if (prev[0] == null) return [id, prev[1]];
      if (prev[1] == null) return [prev[0], id];
      return [id, null];
    });
  }

  const comparerecords = triageData.filter(
    (r) => compareIds.includes(r.id)
  );

  function drawMiniWaveform(canvas: HTMLCanvasElement | null, data: number[], color: string) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    if (!data.length) return;

    const max = Math.max(...data.map(Math.abs), 0.001);
    const mid = h / 2;
    ctx.beginPath();
    const step = w / (data.length - 1);
    ctx.moveTo(0, mid - (data[0] / max) * mid * 0.9);
    for (let i = 1; i < data.length; i++) {
      ctx.lineTo(i * step, mid - (data[i] / max) * mid * 0.9);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  const displayName =
    profile?.full_name || user.email.split("@")[0];
  const exerciseStreak = metrics.filter(
    (m) => m.breathing_exercise_done
  ).length;

  // ═══════════════════════════════════════════════
  // NEW FEATURE: Personal Baseline Detection
  // ═══════════════════════════════════════════════
  const baseline = useMemo(() => computePersonalBaseline(metrics), [metrics]);
  const baselineAlerts = useMemo(
    () => (baseline ? computeBaselineAlerts(baseline, metrics) : []),
    [baseline, metrics]
  );
  const allAlerts = useMemo(() => {
    const health = computeHealthAlerts(metrics);
    return [...health, ...baselineAlerts];
  }, [metrics, baselineAlerts]);

  // ═══════════════════════════════════════════════
  // NEW FEATURE: Sleep Disruption Index
  // ═══════════════════════════════════════════════
  const sleepReports = useMemo(
    () => computeSleepDisruption(metrics, medications),
    [metrics, medications]
  );

  // ═══════════════════════════════════════════════
  // NEW FEATURE: Rescue Inhaler Tracker
  // ═══════════════════════════════════════════════
  const inhalerStats = useMemo(
    () => computeRescueInhalerStats(medications),
    [medications]
  );

  // Render time-based greeting only after client hydration to avoid SSR mismatch
  const [greeting, setGreeting] = useState<string | null>(null);
  useEffect(() => {
    setGreeting(getTimeGreeting());
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950/30 to-slate-900" suppressHydrationWarning>
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-slate-700/60 bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg p-1.5 transition-colors"
              title="Back to home"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="w-7 h-7 rounded-lg border border-cyan-400 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="#00c8ff"
                strokeWidth="1.8"
                className="w-4 h-4"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                <path
                  d="M8 12h1l2-4 2 8 2-5 1 1h2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="font-bold text-white text-sm">
              Respi<span className="text-cyan-400">Core</span>
            </span>
            <span className="hidden sm:inline text-xs font-mono text-slate-500 border border-slate-700 rounded px-2 py-0.5">
              Dashboard
            </span>
          </div>
          <div className="flex items-center gap-3">
            {fetching && (
              <span className="text-xs text-cyan-400 font-mono flex items-center gap-1.5">
                <span className="w-3 h-3 border border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                Syncing...
              </span>
            )}
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
              <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xs font-bold">
                {displayName[0].toUpperCase()}
              </div>
              <span className="max-w-[140px] truncate">{displayName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-white">
            Good {greeting ?? "..."},{" "}
            <span className="text-cyan-400">{displayName}</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Your respiratory health overview for the last 30 days.
          </p>
        </div>

        {/* Trend Alerts */}
        <AlertBanner alerts={allAlerts} />

        {/* Stat cards */}
        <section>
          <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">
            Latest Reading
            {latest && (
              <span className="ml-2 font-mono text-slate-600 normal-case">
                &middot;{" "}
                {new Date(latest.recorded_at).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="SpO2"
              value={latest?.spo2 ?? null}
              unit="%"
              status={spo2Status(latest?.spo2)}
              description="Blood oxygen saturation"
              icon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              }
            />
            <MetricCard
              label="Heart Rate"
              value={latest?.heart_rate ?? null}
              unit="BPM"
              status={hrStatus(latest?.heart_rate)}
              description="Resting beats per minute"
              icon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              }
            />
            <MetricCard
              label="Resp. Rate"
              value={latest?.respiratory_rate ?? null}
              unit="br/min"
              status={rrStatus(latest?.respiratory_rate)}
              description="Breaths per minute"
              icon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                  />
                </svg>
              }
            />
            <MetricCard
              label="Symptom Score"
              value={latest?.symptom_score ?? null}
              unit="/ 10"
              status={symptomStatus(latest?.symptom_score)}
              description="Self-reported severity"
              icon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            />
          </div>
        </section>

        {/* Summary strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-800/40 border border-slate-700 rounded-xl px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold font-mono">
              {metrics.length}
            </div>
            <div>
              <p className="text-xs text-slate-500">Total readings</p>
              <p className="text-sm text-white font-medium">last 30 days</p>
            </div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700 rounded-xl px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 font-bold font-mono">
              {exerciseStreak}
            </div>
            <div>
              <p className="text-xs text-slate-500">Exercise sessions</p>
              <p className="text-sm text-white font-medium">completed</p>
            </div>
          </div>
          <div
            className={`bg-slate-800/40 border border-slate-700 rounded-xl px-5 py-4 flex items-center gap-4`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-mono text-sm
              ${
                getAvgSpo2(metrics) >= 95
                  ? "bg-green-500/10 border border-green-500/20 text-green-400"
                  : getAvgSpo2(metrics) >= 90
                  ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                  : "bg-slate-700 border border-slate-600 text-slate-500"
              }`}
            >
              {getAvgSpo2(metrics) > 0 ? `${getAvgSpo2(metrics)}%` : "--"}
            </div>
            <div>
              <p className="text-xs text-slate-500">Avg SpO2</p>
              <p className="text-sm text-white font-medium">30-day average</p>
            </div>
          </div>
        </div>

        {/* Form + Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <MetricForm onSuccess={handleMetricAdded} />
          </div>
          <div className="lg:col-span-2">
            <MetricsChart metrics={metrics} />
          </div>
        </div>

        {/* Triage Report Charts */}
        {triageData.length > 0 && (
          <section>
            <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">
              Triage Trends
              <span className="ml-2 font-mono text-slate-600 normal-case">
                &middot; {triageData.length} reports
              </span>
            </h2>
            <TriageTrendsChart reports={triageData} />
          </section>
        )}

        {/* Session Comparison */}
        {triageData.length >= 2 && (
          <section>
            <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">
              Compare Sessions
              {comparerecords.length === 2 && (
                <span className="ml-2">
                  <button
                    onClick={() => setCompareIds([null, null])}
                    className="text-xs text-slate-500 hover:text-white underline transition-colors"
                  >
                    Clear selection
                  </button>
                </span>
              )}
              {comparerecords.length < 2 && (
                <span className="ml-2 font-mono text-slate-600 normal-case">
                  click two rows to compare
                </span>
              )}
            </h2>

            {comparerecords.length === 2 ? (
              <SessionComparison
                recordA={comparerecords[0]}
                recordB={comparerecords[1]}
              />
            ) : (
              <p className="text-xs text-slate-500 italic">
                Select two triage reports from the table below to compare them side by side.
              </p>
            )}
          </section>
        )}

        {/* Voice Biomarker Sparklines */}
        {triageData.length > 0 && (
          <VoiceBiomarkerSparklines reports={triageData} />
        )}

        {/* Personal Baseline */}
        <PersonalBaselineCard baseline={baseline} />

        {/* Triage Reports */}
        <section>
          <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">
            Voice Triage Reports
            {triageData.length > 0 && (
              <span className="ml-2 font-mono text-slate-600 normal-case">
                &middot; {triageData.length} total
              </span>
            )}
          </h2>

          {triageData.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-8 text-center">
              <p className="text-sm text-slate-500">
                No triage reports yet. Record a voice triage on the homepage to see results here.
              </p>
            </div>
          ) : (
            <div className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-700">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs text-slate-500 font-mono uppercase tracking-wider">Time</th>
                    <th className="text-left py-3 px-4 text-xs text-slate-500 font-mono uppercase tracking-wider">Class</th>
                    <th className="text-left py-3 px-4 text-xs text-slate-500 font-mono uppercase tracking-wider">Confidence</th>
                    <th className="hidden sm:table-cell text-left py-3 px-4 text-xs text-slate-500 font-mono uppercase tracking-wider">Normal</th>
                    <th className="hidden sm:table-cell text-left py-3 px-4 text-xs text-slate-500 font-mono uppercase tracking-wider">Anomalous</th>
                    <th className="hidden sm:table-cell text-left py-3 px-4 text-xs text-slate-500 font-mono uppercase tracking-wider">Wheeze</th>
                    <th className="hidden sm:table-cell text-left py-3 px-4 text-xs text-slate-500 font-mono uppercase tracking-wider">COPD</th>
                    <th className="hidden md:table-cell text-left py-3 px-4 text-xs text-slate-500 font-mono uppercase tracking-wider">Cough</th>
                    <th className="hidden md:table-cell text-left py-3 px-4 text-xs text-slate-500 font-mono uppercase tracking-wider">Hoarseness</th>
                    <th className="hidden md:table-cell text-left py-3 px-4 text-xs text-slate-500 font-mono uppercase tracking-wider">Duration</th>
                    <th className="hidden sm:table-cell text-left py-3 px-4 text-xs text-slate-500 font-mono uppercase tracking-wider">Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {triageData.map((r) => {
                    const cls = CLASS_COLORS[r.predicted_class] || "text-slate-400 border-slate-600 bg-slate-700/10";
                    const isSelected = compareIds.includes(r.id);
                    return (
                      <tr key={r.id} className={`border-b border-slate-800/50 transition-colors ${isSelected ? "bg-cyan-500/10 cursor-pointer" : "hover:bg-slate-700/20 cursor-pointer"}`} onClick={() => toggleCompare(r.id)}>
                        <td className="py-3 px-4 text-slate-400 font-mono text-xs whitespace-nowrap">
                          {new Date(r.created_at).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium ${cls}`}>
                            {LABELS[r.predicted_class] || "Unknown"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-mono text-xs">
                          {(r.confidence * 100).toFixed(1)}%
                        </td>
                        <td className="hidden sm:table-cell py-3 px-4 text-emerald-400 font-mono text-xs">
                          {(r.probabilities.normal * 100).toFixed(1)}%
                        </td>
                        <td className="hidden sm:table-cell py-3 px-4 text-amber-400 font-mono text-xs">
                          {(r.probabilities.anomalous * 100).toFixed(1)}%
                        </td>
                        <td className="hidden sm:table-cell py-3 px-4 text-cyan-400 font-mono text-xs">
                          {(r.probabilities.wheeze * 100).toFixed(1)}%
                        </td>
                        <td className="hidden sm:table-cell py-3 px-4 text-red-400 font-mono text-xs">
                          {(r.probabilities.copd * 100).toFixed(1)}%
                        </td>
                        <td className="hidden md:table-cell py-3 px-4 text-orange-400 font-mono text-xs">
                          {r.cough_count != null ? r.cough_count : "--"}
                        </td>
                        <td className="hidden md:table-cell py-3 px-4 text-purple-400 font-mono text-xs">
                          {r.hoarseness_index != null ? r.hoarseness_index.toFixed(2) : "--"}
                        </td>
                        <td className="hidden md:table-cell py-3 px-4 text-green-400 font-mono text-xs">
                          {r.breathing_duration_secs != null ? `${r.breathing_duration_secs.toFixed(0)}s` : "--"}
                        </td>
                        <td className="hidden sm:table-cell py-3 px-4 text-cyan-400 font-mono text-xs">
                          {r.inference_ms != null ? `${r.inference_ms}ms` : "--"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Breathing Exercise + Export */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowExercise(true)}
            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Start Exercise
          </button>
          <ExportButton />
        </div>

        {/* Sleep Disruption Index */}
        {sleepReports.length > 0 && (
          <SleepDisruptionCards reports={sleepReports} />
        )}

        {/* Rescue Inhaler Efficiency Tracker */}
        {inhalerStats && inhalerStats.total_puffs_week > 0 ? (
          <RescueInhalerTracker stats={inhalerStats} />
        ) : (
          <section>
            <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">
              Rescue Inhaler Tracker
            </h2>
            <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-6 text-center">
              <p className="text-sm text-slate-500">
                Start logging rescue inhaler medications. Puffs will be tracked automatically.
              </p>
              <p className="text-xs text-slate-600 mt-1">
                GINA guidelines flag {"\u003e"}4 days/week of rescue use as uncontrolled.
              </p>
            </div>
          </section>
        )}

        {/* Medication Tracker */}
        <section>
          <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">
            Medication Tracker
            {medications.length > 0 && (
              <span className="ml-2 font-mono text-slate-600 normal-case">
                &middot; {medications.length} entries
              </span>
            )}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
                <MedicationForm onSuccess={handleMedicationAdded} />
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
                <MedicationHistory medications={medications} onDeleted={handleMedicationAdded} />
              </div>
            </div>
          </div>
        </section>

        {/* Future integrations callout */}
        <div className="border border-dashed border-slate-700 rounded-2xl p-6 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 flex-shrink-0">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white mb-1">
              Coming soon: Wearable and AI Integration
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              The database is already designed to receive data from paired
              devices (Apple Watch, Withings, Fitbit) and store ML predictions
              from the RespiCore acoustic CNN model.
            </p>
          </div>
        </div>

        {/* Breathing Exercise Modal */}
        {showExercise && (
          <BreathingExercise
            onComplete={handleExerciseComplete}
            onClose={() => setShowExercise(false)}
          />
        )}
      </main>
    </div>
  );
}

interface SessionComparisonProps {
  recordA: TriageReport;
  recordB: TriageReport;
}

function SessionComparison({ recordA, recordB }: SessionComparisonProps) {
  const classes: [TriageReport, TriageReport] = [recordA, recordB];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {classes.map((r, i) => (
          <div key={r.id} className="bg-slate-800/40 border border-slate-700 rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono text-slate-500">
                {i === 0 ? "Session A" : "Session B"}
              </span>
              <span className="text-xs font-mono text-slate-600">
                {new Date(r.created_at).toLocaleString("en-US", {
                  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-medium ${CLASS_COLORS[r.predicted_class] || "text-slate-400 border-slate-600 bg-slate-700/10"}`}>
                {LABELS[r.predicted_class]}
              </span>
              <span className="text-xs font-mono text-slate-400">
                {(r.confidence * 100).toFixed(1)}% conf
              </span>
            </div>
            <div className="space-y-1.5">
              {(["normal", "anomalous", "wheeze", "copd"] as const).map((cls) => {
                const pct = r.probabilities[cls] * 100;
                const colorMap: Record<string, string> = {
                  normal: "bg-emerald-400",
                  anomalous: "bg-amber-400",
                  wheeze: "bg-cyan-400",
                  copd: "bg-red-400",
                };
                return (
                  <div key={cls} className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-500 w-[70px] capitalize">{cls}</span>
                    <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${colorMap[cls]}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 w-[36px] text-right">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
            {r.inference_ms != null && (
              <p className="text-xs font-mono text-slate-600">Inference: {r.inference_ms}ms</p>
            )}
          </div>
        ))}
      </div>

      <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl px-5 py-4 flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono">
        <span className="text-slate-400">Confidence delta:</span>
        <span
          className={
            Math.abs(recordA.confidence - recordB.confidence) > 0.15
              ? "text-amber-400 font-bold"
              : "text-emerald-400"
          }
        >
          {((recordA.confidence - recordB.confidence) * 100).toFixed(1)}pp
        </span>
        {recordA.predicted_class !== recordB.predicted_class && (
          <span className="text-red-400 font-bold">Class changed: {LABELS[recordA.predicted_class]} &rarr; {LABELS[recordB.predicted_class]}</span>
        )}
        {recordA.predicted_class === recordB.predicted_class && (
          <span className="text-emerald-400">Same classification</span>
        )}
      </div>
    </div>
  );
}
