"use client";
// components/dashboard/MetricsChart.tsx
// Renders the SpO2 + Heart Rate line chart AND the history table.
// Requires: npm install recharts

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";
import type { HealthMetric } from "@/lib/types/health";

interface MetricsChartProps {
  metrics: HealthMetric[];
}

function formatDate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function SpO2Badge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-slate-600">--</span>;
  const color = value >= 95 ? "text-green-400" : value >= 90 ? "text-amber-400" : "text-red-400";
  return <span className={`font-mono font-bold ${color}`}>{value}%</span>;
}

function SymptomBadge({ score }: { score: number }) {
  const color = score <= 3 ? "text-green-400" : score <= 6 ? "text-amber-400" : "text-red-400";
  return <span className={`font-mono ${color}`}>{score}/10</span>;
}

export default function MetricsChart({ metrics }: MetricsChartProps) {
  const chartData = [...metrics]
    .reverse()
    .map((m) => ({
      date:       formatDate(m.recorded_at),
      spo2:       m.spo2            ?? undefined,
      heart_rate: m.heart_rate      ?? undefined,
      resp_rate:  m.respiratory_rate ?? undefined,
    }))
    .filter((d) => d.spo2 || d.heart_rate);

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-1">Trend - Last 30 Days</h3>
        <p className="text-xs text-slate-500 mb-5">SpO2 (%) and Heart Rate (BPM)</p>
        {chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-600 text-sm">
            No SpO2 or heart rate data yet. Log your first reading.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="spo2" domain={[85, 100]} tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="hr" orientation="right" domain={[40, 180]} tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8", paddingTop: "12px" }} />
              <Line yAxisId="spo2" type="monotone" dataKey="spo2" name="SpO2 %" stroke="#00c8ff" strokeWidth={2} dot={{ fill: "#00c8ff", r: 3 }} activeDot={{ r: 5 }} connectNulls />
              <Line yAxisId="hr" type="monotone" dataKey="heart_rate" name="Heart Rate" stroke="#ff7c5c" strokeWidth={2} dot={{ fill: "#ff7c5c", r: 3 }} activeDot={{ r: 5 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* History table */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-white">Reading History</h3>
          <p className="text-xs text-slate-500 mt-0.5">{metrics.length} entries in the last 30 days</p>
        </div>
        {metrics.length === 0 ? (
          <div className="px-6 py-10 text-center text-slate-600 text-sm">No readings logged yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wide">
                  <th className="text-left px-6 py-3 font-medium">Date</th>
                  <th className="text-right px-4 py-3 font-medium">SpO2</th>
                  <th className="text-right px-4 py-3 font-medium">HR</th>
                  <th className="text-right px-4 py-3 font-medium">RR</th>
                  <th className="text-right px-4 py-3 font-medium">Symptom</th>
                  <th className="text-center px-4 py-3 font-medium">Exercise</th>
                  <th className="text-left px-4 py-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {metrics.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-3 text-slate-300 font-mono text-xs">
                      {new Date(m.recorded_at).toLocaleString("en-US", {
                        month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right"><SpO2Badge value={m.spo2} /></td>
                    <td className="px-4 py-3 text-right text-slate-300">{m.heart_rate ?? "--"}</td>
                    <td className="px-4 py-3 text-right text-slate-300">{m.respiratory_rate ?? "--"}</td>
                    <td className="px-4 py-3 text-right">
                      {m.symptom_score ? <SymptomBadge score={m.symptom_score} /> : <span className="text-slate-600">--</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {m.breathing_exercise_done ? (
                        <span className="text-green-400">
                          Done{m.exercise_duration_mins ? ` ${m.exercise_duration_mins}m` : ""}
                        </span>
                      ) : (
                        <span className="text-slate-600">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs max-w-[180px] truncate">
                      {m.notes || <span className="text-slate-700">--</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
