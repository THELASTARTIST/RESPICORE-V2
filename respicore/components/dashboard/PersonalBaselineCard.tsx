"use client";

import type { PersonalBaseline } from "@/lib/types/health";

interface PersonalBaselineCardProps {
  baseline: PersonalBaseline | null;
}

export default function PersonalBaselineCard({ baseline }: PersonalBaselineCardProps) {
  if (!baseline) return null;

  return (
    <section>
      <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">
        Personal Baseline
        <span className="ml-2 font-mono text-slate-600 normal-case">
          {baseline.n_readings} readings
        </span>
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {/* SpO2 baseline */}
        {baseline.spo2_mean > 0 && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500">Personal SpO2</p>
              <span className="text-[10px] font-mono text-slate-600">
                {"\u03c3"} {baseline.spo2_std}
              </span>
            </div>
            <p className="text-xl font-bold text-white">
              {baseline.spo2_mean}%
              <span className="text-sm text-slate-500 font-normal"> mean</span>
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] text-slate-500">Range:</span>
              <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden relative">
                <div
                  className="absolute inset-y-0 bg-cyan-500/40 rounded-full"
                  style={{
                    left: `${((baseline.spo2_mean - 2 * baseline.spo2_std - 85) / 15) * 100}%`,
                    right: `${100 - ((baseline.spo2_mean + 2 * baseline.spo2_std - 85) / 15) * 100}%`,
                  }}
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-600 mt-1 font-mono">
              {baseline.spo2_min}\u2013{baseline.spo2_max}% recorded
            </p>
          </div>
        )}

        {/* Heart rate baseline */}
        {baseline.heart_rate_mean > 0 && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500">Personal Heart Rate</p>
              <span className="text-[10px] font-mono text-slate-600">
                {"\u03c3"} {baseline.heart_rate_std}
              </span>
            </div>
            <p className="text-xl font-bold text-white">
              {baseline.heart_rate_mean}
              <span className="text-sm text-slate-500 font-normal"> BPM</span>
            </p>
            <p className="text-[10px] text-slate-600 mt-1 font-mono">
              Typical: {baseline.heart_rate_range[0]}\u2013{baseline.heart_rate_range[1]} BPM
            </p>
          </div>
        )}

        {/* Symptom baseline */}
        {baseline.symptom_score_mean > 0 && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500">Personal Symptom</p>
            </div>
            <p className="text-xl font-bold text-white">
              {baseline.symptom_score_mean}
              <span className="text-sm text-slate-500 font-normal"> /10 avg</span>
            </p>
            <div className="mt-2 w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  baseline.symptom_score_mean <= 3
                    ? "bg-green-500/50"
                    : baseline.symptom_score_mean <= 6
                    ? "bg-amber-500/50"
                    : "bg-red-500/50"
                }`}
                style={{ width: `${(baseline.symptom_score_mean / 10) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <p className="text-[10px] text-slate-600 mt-2">
        Baseline auto-computed from your last 30-day data. Alerts fire when you deviate from your personal normal, not generic clinical thresholds.
      </p>
    </section>
  );
}
