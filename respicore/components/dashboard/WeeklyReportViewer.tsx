"use client";

import { useState } from "react";

interface WeeklyReportData {
  generated_at: string;
  period: { start: string; end: string };
  sleep_disruption: {
    latest_week: any;
    weekly_trend: any[];
  };
  inhaler_efficiency: {
    total_puffs_week: number;
    total_puffs_last_week: number;
    days_with_usage_week: number;
    trend: string;
    gina_flag: boolean;
    daily_breakdown: { date: string; puffs: number }[];
  } | null;
  baseline: any;
  alerts: Array<{ id: string; severity: string; message: string; detail: string }>;
  voice_biomarkers: {
    total_recordings: number;
    avg_cough_count: number | null;
    avg_hoarseness_index: number | null;
    avg_breathing_duration: number | null;
  };
  medication_summary: {
    total_entries: number;
    rescue_inhaler_count: number;
    maintenance_count: number;
    other_count: number;
  };
  triage_distribution: { normal: number; anomalous: number; wheeze: number; copd: number };
  total_readings: number;
  clinical_summary: string;
}

interface WeeklyReportViewerProps {
  report: WeeklyReportData;
  onClose: () => void;
}

export default function WeeklyReportViewer({ report, onClose }: WeeklyReportViewerProps) {
  if (!report) return null;

  async function downloadTextReport() {
    const text = report.clinical_summary;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `respicore_weekly_report_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl space-y-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-white">Weekly Clinical Report</h2>
            <p className="text-xs text-slate-500 font-mono">
              Generated {new Date(report.generated_at).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={downloadTextReport}
              className="text-xs text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400 px-3 py-1.5 rounded-lg transition-colors"
            >
              Download .txt
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Alerts */}
          {report.alerts.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-5 py-4">
              <p className="text-sm font-semibold text-amber-400 mb-2">
                {report.alerts.length} Alert{report.alerts.length > 1 ? "s" : ""}
              </p>
              {report.alerts.map((a) => (
                <div key={a.id} className="text-xs text-slate-400 mt-1">
                  <span className={a.severity === "urgent" ? "text-red-400" : "text-amber-400"}>{a.message}</span>
                  <span className="ml-2">— {a.detail}</span>
                </div>
              ))}
            </div>
          )}

          {/* Respiratory Overview */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-5 py-4">
            <p className="text-sm font-semibold text-white mb-3">Respiratory Overview</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">Total Readings</p>
                <p className="text-xl font-bold text-cyan-400">{report.total_readings}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Voice Recordings</p>
                <p className="text-xl font-bold text-purple-400">{report.voice_biomarkers.total_recordings}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Medication Logs</p>
                <p className="text-xl font-bold text-white">{report.medication_summary.total_entries}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Avg Cough Events</p>
                <p className="text-xl font-bold text-orange-400">
                  {report.voice_biomarkers.avg_cough_count != null ? report.voice_biomarkers.avg_cough_count.toFixed(1) : "--"}
                </p>
              </div>
            </div>
          </div>

          {/* Triage Distribution */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-5 py-4">
            <p className="text-sm font-semibold text-white mb-3">Triage Classification Distribution</p>
            <div className="flex gap-3">
              {[
                { label: "Normal", count: report.triage_distribution.normal, color: "bg-green-500/20 text-green-400" },
                { label: "Anomalous", count: report.triage_distribution.anomalous, color: "bg-amber-500/20 text-amber-400" },
                { label: "Wheeze", count: report.triage_distribution.wheeze, color: "bg-cyan-500/20 text-cyan-400" },
                { label: "COPD", count: report.triage_distribution.copd, color: "bg-red-500/20 text-red-400" },
              ].map((item) => (
                <button
                  key={item.label}
                  className={`flex-1 text-center px-4 py-3 rounded-lg ${item.color}`}
                >
                  <p className="text-lg font-bold">{item.count}</p>
                  <p className="text-[10px] uppercase">{item.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Sleep Quality */}
          {report.sleep_disruption.latest_week && (
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-5 py-4">
              <p className="text-sm font-semibold text-white mb-2">Sleep Quality</p>
              <p className="text-sm text-slate-400">{report.sleep_disruption.latest_week.summary}</p>
              {report.sleep_disruption.latest_week.avg_morning_spo2_all > 0 && (
                <p className="text-xs text-slate-500 mt-2">
                  Avg morning SpO2: {report.sleep_disruption.latest_week.avg_morning_spo2_all}%
                </p>
              )}
            </div>
          )}

          {/* Inhaler Efficiency */}
          {report.inhaler_efficiency && (
            <div className={`bg-slate-800/60 border rounded-xl px-5 py-4 ${report.inhaler_efficiency.gina_flag ? "border-red-500/30" : "border-slate-700"}`}>
              <p className="text-sm font-semibold text-white mb-2">
                Rescue Inhaler Efficiency
                {report.inhaler_efficiency.gina_flag && (
                  <span className="ml-2 text-xs text-red-400">— GINA THRESHOLD EXCEEDED</span>
                )}
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-slate-500">This Week</p>
                  <p className="text-lg font-bold text-white">{report.inhaler_efficiency.total_puffs_week} puffs</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Last Week</p>
                  <p className="text-lg font-bold text-slate-400">{report.inhaler_efficiency.total_puffs_last_week} puffs</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Trend</p>
                  <p className={`text-lg font-bold ${report.inhaler_efficiency.trend === "increasing" ? "text-red-400" : report.inhaler_efficiency.trend === "decreasing" ? "text-green-400" : "text-slate-400"}`}>
                    {report.inhaler_efficiency.trend}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Used {report.inhaler_efficiency.days_with_usage_week}/7 days {report.inhaler_efficiency.gina_flag ? "(uncontrolled per GINA)" : "(controlled)"}
              </p>
            </div>
          )}

          {/* Full Clinical Summary */}
          {report.clinical_summary && (
            <div className="bg-slate-900/60 border border-slate-700 rounded-xl px-5 py-4">
              <p className="text-sm font-semibold text-white mb-2">Full Clinical Summary</p>
              <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono leading-relaxed">
                {report.clinical_summary}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
