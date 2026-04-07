"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Cell,
} from "recharts";
import type { RescueInhalerStats } from "@/lib/types/health";

interface RescueInhalerTrackerProps {
  stats: RescueInhalerStats | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function RescueInhalerTracker({ stats }: RescueInhalerTrackerProps) {
  if (!stats) return null;

  const trendIcon = stats.trend === "increasing" ? "\u2191" : stats.trend === "decreasing" ? "\u2193" : "\u2192";
  const trendColor = stats.trend === "increasing" ? "text-red-400" : stats.trend === "decreasing" ? "text-green-400" : "text-slate-400";

  return (
    <section>
      <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">
        Rescue Inhaler Tracker
        <span className="ml-2 font-mono text-slate-600 normal-case">
          {stats.gina_flag && (
            <span className="text-red-400 font-bold">* GINA THRESHOLD EXCEEDED</span>
          )}
        </span>
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Summary cards */}
        <div className="space-y-3">
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl px-5 py-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Puffs This Week</p>
            <p className="text-2xl font-bold text-white mt-1">
              {stats.total_puffs_week}
              <span className={`ml-2 text-sm font-mono ${trendColor}`}>
                {trendIcon}
              </span>
            </p>
            {stats.total_puffs_last_week > 0 && (
              <p className="text-[10px] text-slate-600 mt-1">
                Last week: {stats.total_puffs_last_week} puffs
              </p>
            )}
          </div>

          <div className={`bg-slate-800/60 rounded-2xl px-5 py-4 border ${stats.gina_flag ? "border-red-500/30" : "border-slate-700"}`}>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Days Used</p>
            <p className={`text-2xl font-bold mt-1 ${stats.gina_flag ? "text-red-400" : "text-white"}`}>
              {stats.days_with_usage_week}/7
            </p>
            <p className="text-[10px] text-slate-600 mt-1">
              GINA: {"\u2264"}4 days/week is controlled
            </p>
          </div>

          {stats.gina_flag && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl px-5 py-4">
              <p className="text-xs text-red-400 font-semibold">GINA Warning</p>
              <p className="text-xs text-red-400/80 mt-1 leading-relaxed">
                Rescue inhaler used on {stats.days_with_usage_week} days this week. {"\u003e"}4 days/week
                indicates uncontrolled asthma per GINA guidelines. Consider reviewing your maintenance therapy with your clinician.
              </p>
            </div>
          )}
        </div>

        {/* Daily bar chart */}
        <div className="lg:col-span-2 bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
          <p className="text-sm font-semibold text-white mb-1">Daily Consumption</p>
          <p className="text-xs text-slate-500 mb-4">Last 7 days (puffs per day)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={stats.daily_breakdown.map((d) => ({
                date: formatDate(d.date),
                puffs: d.puffs,
              }))}
              margin={{ top: 5, right: 10, left: -5, bottom: 5 }}
            >
              <XAxis dataKey="date" tick={{ fill: "#475569", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: "#475569", fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const entry = payload[0];
                  return (
                    <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs shadow-xl">
                      <p className="text-slate-400">{entry.payload.date}</p>
                      <p className="text-cyan-400">
                        {entry.value} puff{(entry.value as number) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="puffs" radius={[4, 4, 0, 0]}>
                {stats.daily_breakdown.map((d, i) => (
                  <Cell key={i} fill={d.puffs > 0 ? (stats.gina_flag ? "#ef4444" : "#22d3ee") : "#1e293b"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
