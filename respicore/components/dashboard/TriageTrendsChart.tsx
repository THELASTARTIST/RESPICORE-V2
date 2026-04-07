"use client";

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, AreaChart, Area,
} from "recharts";

interface TriageReport {
  id: string;
  created_at: string;
  predicted_class: "normal" | "anomalous" | "wheeze" | "copd";
  confidence: number;
  probabilities: { normal: number; anomalous: number; wheeze: number; copd: number };
  inference_ms: number | null;
}

interface TriageTrendsChartProps {
  reports: TriageReport[];
}

const CLASS_COLORS = {
  normal: "#10b981",
  anomalous: "#f59e0b",
  wheeze: "#06b6d4",
  copd: "#ef4444",
};

const CLASS_LABELS = {
  normal: "Normal",
  anomalous: "Anomalous",
  wheeze: "Wheeze",
  copd: "COPD/Bronchitis",
};

function formatDate(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    + " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function CustomTrendTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-xs shadow-xl max-w-[220px]">
      <p className="text-slate-400 mb-2 font-mono">{label}</p>
      {payload
        .filter((p: any) => p.value !== undefined)
        .map((p: any) => {
          const pct = typeof p.value === "number" ? p.value.toFixed(1) + "%" : p.value;
          return (
            <p key={p.dataKey} style={{ color: p.color }}>
              {p.name}: <span className="font-bold">{pct}</span>
            </p>
          );
        })}
    </div>
  );
}

export default function TriageTrendsChart({ reports }: TriageTrendsChartProps) {
  const chartData = [...reports].reverse().map((r) => ({
    time: formatDate(r.created_at),
    confidence: Math.round(r.confidence * 1000) / 10,
    normal: Math.round(r.probabilities.normal * 1000) / 10,
    anomalous: Math.round(r.probabilities.anomalous * 1000) / 10,
    wheeze: Math.round(r.probabilities.wheeze * 1000) / 10,
    copd: Math.round(r.probabilities.copd * 1000) / 10,
  }));

  if (reports.length === 0) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-1">Triage Trends</h3>
        <p className="text-xs text-slate-500 mb-4">Class probabilities and confidence over time</p>
        <div className="h-48 flex items-center justify-center text-slate-600 text-sm">
          No triage reports yet. Record a triage on the homepage to see trends.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Confidence over time */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-1">Classification Confidence</h3>
        <p className="text-xs text-slate-500 mb-4">Top class confidence per triage report</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="time" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTrendTooltip />} />
            <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8", paddingTop: "12px" }} />
            <Line
              type="monotone"
              dataKey="confidence"
              name="Confidence %"
              stroke="#00c8ff"
              strokeWidth={2}
              dot={{ fill: "#00c8ff", r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Class probabilities breakdown */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-1">Class Probabilities</h3>
        <p className="text-xs text-slate-500 mb-4">How each class scored per triage</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="time" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTrendTooltip />} />
            <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8", paddingTop: "12px" }} />
            <Line type="monotone" dataKey="normal" name="Normal" stroke={CLASS_COLORS.normal} strokeWidth={2} dot={{ fill: CLASS_COLORS.normal, r: 2 }} connectNulls />
            <Line type="monotone" dataKey="anomalous" name="Anomalous" stroke={CLASS_COLORS.anomalous} strokeWidth={2} dot={{ fill: CLASS_COLORS.anomalous, r: 2 }} connectNulls />
            <Line type="monotone" dataKey="wheeze" name="Wheeze" stroke={CLASS_COLORS.wheeze} strokeWidth={2} dot={{ fill: CLASS_COLORS.wheeze, r: 2 }} connectNulls />
            <Line type="monotone" dataKey="copd" name="COPD/Bronchitis" stroke={CLASS_COLORS.copd} strokeWidth={2} dot={{ fill: CLASS_COLORS.copd, r: 2 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
