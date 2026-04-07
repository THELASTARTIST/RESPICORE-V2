// components/dashboard/AlertBanner.tsx
// Dismissable health alert banner computed from metric trends.

"use client";

import { useState, useEffect } from "react";
import type { HealthAlert } from "@/lib/alerts";

const ICONS: Record<string, React.ReactNode> = {
  heart: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  lungs: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
    </svg>
  ),
  activity: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>
  ),
  alert: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.833c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
};

export default function AlertBanner({ alerts, className }: { alerts: HealthAlert[]; className?: string }) {
  const [ dismissed, setDismissed ] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = localStorage.getItem("dismissed-alerts");
      if (stored) {
        const ids = JSON.parse(stored) as string[];
        setDismissed(new Set(ids));
      }
    } catch {}
  }, []);

  const visible = alerts.filter((a) => !dismissed.has(a.id));
  if (!visible.length) return null;

  function dismiss(id: string) {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    try {
      localStorage.setItem("dismissed-alerts", JSON.stringify([...next]));
    } catch {}
  }

  return (
    <div className={`space-y-2 ${className || ""}`}>
      {visible.map((alert) => {
        const isUrgent = alert.severity === "urgent";
        return (
          <div
            key={alert.id}
            className={`border rounded-xl px-4 py-3 flex items-start gap-3 ${
              isUrgent
                ? "bg-red-500/10 border-red-500/30"
                : "bg-amber-500/10 border-amber-500/30"
            }`}
          >
            <span className={`flex-shrink-0 ${isUrgent ? "text-red-400" : "text-amber-400"}`}>
              {ICONS[alert.icon]}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${isUrgent ? "text-red-400" : "text-amber-400"}`}>
                {alert.message}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{alert.detail}</p>
            </div>
            <button
              onClick={() => dismiss(alert.id)}
              className="text-slate-500 hover:text-white transition-colors flex-shrink-0"
              title="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
