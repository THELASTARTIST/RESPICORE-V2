"use client";

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, AreaChart, Area,
} from "recharts";
import { useMemo } from "react";

interface TriageReport {
  id: string;
  created_at: string;
  predicted_class: string;
  cough_count: number | null;
  hoarseness_index: number | null;
  breathing_duration_secs: number | null;
}

interface VoiceBiomarkerSparklinesProps {
  reports: TriageReport[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type DataPoint = {
  date: string;
  fullDate: string;
  value: number;
};

function MiniSparkline({
  data,
  color,
  label,
  unit,
  height = 80,
  gradientId,
}: {
  data: DataPoint[];
  color: string;
  label: string;
  unit: string;
  height?: number;
  gradientId: string;
}) {
  const avg = data.length ? (data.reduce((s, d) => s + d.value, 0) / data.length).toFixed(1) : "--";
  const latest = data.length ? data[data.length - 1].value : null;

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{label}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-white">
              {latest !== null ? (typeof latest === 'number' ? (latest % 1 === 0 ? latest : latest.toFixed(1)) : latest) : "--"}
            </span>
            <span className="text-xs text-slate-500">{unit}</span>
          </div>
          <p className="text-[10px] text-slate-600 font-mono">avg: {avg}</p>
        </div>
      </div>

      {data.length < 2 ? (
        <div className={`h-[${height}px] flex items-center justify-center text-slate-600 text-xs flex-1`}>
          Need 2+ recordings for trend
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -5, bottom: 5 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fill: "#475569", fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as DataPoint;
                return (
                  <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs shadow-xl">
                    <p className="text-slate-400 font-mono">{p.fullDate}</p>
                    <p style={{ color }}>
                      {label}: <span className="font-bold">{p.value} {unit}</span>
                    </p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#${gradientId})`}
              dot={{ fill: color, r: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default function VoiceBiomarkerSparklines({ reports }: VoiceBiomarkerSparklinesProps) {
  const hasBiomarkerData = useMemo(
    () => reports.some((r) => r.cough_count != null || r.hoarseness_index != null || r.breathing_duration_secs != null),
    [reports]
  );

  const chartData = useMemo(
    () =>
      reports
        .filter(
          (r) =>
            r.cough_count != null ||
            r.hoarseness_index != null ||
            r.breathing_duration_secs != null
        )
        .reverse()
        .map((r) => ({
          date: formatDate(r.created_at),
          fullDate: new Date(r.created_at).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          cough: r.cough_count ?? 0,
          hoarseness: r.hoarseness_index ?? 0,
          breathing: r.breathing_duration_secs ?? 0,
        })),
    [reports]
  );

  if (!hasBiomarkerData || chartData.length === 0) {
    return null; // Will not render section
  }

  const coughData: DataPoint[] = chartData.map((d) => ({ date: d.date, fullDate: d.fullDate, value: d.cough }));
  const hoarsenessData: DataPoint[] = chartData.map((d) => ({ date: d.date, fullDate: d.fullDate, value: d.hoarseness }));
  const breathingData: DataPoint[] = chartData.map((d) => ({ date: d.date, fullDate: d.fullDate, value: d.breathing }));

  return (
    <section>
      <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">
        Voice Biomarker Trends
        <span className="ml-2 font-mono text-slate-600 normal-case">
          &middot; {chartData.length} recordings
        </span>
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MiniSparkline
          data={coughData}
          color="#f97316"
          label="Cough Events"
          unit="count"
          gradientId="coughGradient"
        />
        <MiniSparkline
          data={hoarsenessData}
          color="#a855f7"
          label="Hoarseness Index"
          unit="spectral"
          gradientId="hoarsenessGradient"
        />
        <MiniSparkline
          data={breathingData}
          color="#22c55e"
          label="Breathing Duration"
          unit="secs"
          gradientId="breathingGradient"
        />
      </div>
    </section>
  );
}
