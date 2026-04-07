"use client";

import type { SleepDisruptionReport } from "@/lib/types/health";

interface SleepDisruptionCardsProps {
  reports: SleepDisruptionReport[];
}

function formatWeekRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} \u2013 ${e.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export default function SleepDisruptionCards({ reports }: SleepDisruptionCardsProps) {
  if (!reports.length) return null;

  const latest = reports[reports.length - 1];

  return (
    <section>
      <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">
        Sleep Disruption Index
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weekly summary */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-500">This Week</p>
            <p className="text-[10px] text-slate-600 font-mono">{formatWeekRange(latest.week_start, latest.week_end)}</p>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{latest.summary}</p>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="bg-slate-900/50 rounded-lg px-3 py-2 text-center">
              <p className="text-lg font-bold text-white">{latest.n_rescue_inhaler_nights}</p>
              <p className="text-[10px] text-slate-500">Rescue nights</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg px-3 py-2 text-center">
              <p className="text-lg font-bold text-white">{latest.avg_morning_spo2_all > 0 ? `${latest.avg_morning_spo2_all}%` : "--"}</p>
              <p className="text-[10px] text-slate-500">Morn. SpO2 avg</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg px-3 py-2 text-center">
              <p className={`text-lg font-bold ${latest.spo2_delta_pct < -2 ? "text-red-400" : latest.spo2_delta_pct < 0 ? "text-amber-400" : "text-green-400"}`}>
                {latest.spo2_delta_pct > 0 ? "+" : ""}{latest.spo2_delta_pct.toFixed(1)}%
              </p>
              <p className="text-[10px] text-slate-500">SpO2 delta</p>
            </div>
          </div>
        </div>

        {/* Historical */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-3 max-h-[240px] overflow-y-auto">
          <p className="text-xs text-slate-500">Past Weeks</p>
          {reports.slice(0, -1).reverse().map((r) => (
            <div key={r.week_start} className="bg-slate-900/40 rounded-lg px-3 py-2.5 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-400 font-mono">{formatWeekRange(r.week_start, r.week_end)}</span>
                <span className="text-slate-600">{r.n_rescue_inhaler_nights} night{r.n_rescue_inhaler_nights !== 1 ? "s" : ""}</span>
              </div>
              <p className="text-slate-500">{r.summary}</p>
              {r.avg_morning_spo2_all > 0 && (
                <p className="text-slate-600 mt-1">
                  Morning SpO2: {r.avg_morning_spo2_all}% {r.spo2_delta_pct < 0 ? `(${r.spo2_delta_pct.toFixed(1)}% vs overall)` : ""}
                </p>
              )}
            </div>
          ))}
          {reports.length <= 1 && (
            <p className="text-slate-600 text-xs text-center py-2">More weeks of data needed for historical comparison.</p>
          )}
        </div>
      </div>
    </section>
  );
}
