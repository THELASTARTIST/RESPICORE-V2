// lib/inhaler_tracker.ts
// Tracks rescue inhaler usage, computes weekly stats and GINA guidelines flags.

import type { MedicationLog, RescueInhalerStats } from "@/lib/types/health";

function isoDate(d: Date | string): string {
  return typeof d === "string" ? d.slice(0, 10) : d.toISOString().slice(0, 10);
}

function parsePuffCount(dosage: string): number {
  const match = dosage.match(/(\d+)\s*(?:puffs?|puf|spray|sprays?)/i);
  if (match) return parseInt(match[1]);
  // If dosage is a number-only string
  const num = parseInt(dosage);
  return isNaN(num) ? 1 : num;
}

export function computeRescueInhalerStats(
  medications: MedicationLog[]
): RescueInhalerStats | null {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const rescueMeds = medications.filter((m) => m.medication_type === "inhaler_rescue");
  if (rescueMeds.length === 0) {
    return {
      total_puffs_week: 0,
      total_puffs_last_week: 0,
      days_with_usage_week: 0,
      trend: "stable",
      gina_flag: false,
      daily_breakdown: [],
    };
  }

  // Current week (last 7 days)
  const thisWeekMeds = rescueMeds.filter((m) => new Date(m.taken_at) >= weekAgo);
  const totalPuffsWeek = thisWeekMeds.reduce((sum, m) => sum + (m.puff_count ?? parsePuffCount(m.dosage)), 0);

  // Previous week (7-14 days ago)
  const lastWeekMeds = rescueMeds.filter(
    (m) => new Date(m.taken_at) >= twoWeeksAgo && new Date(m.taken_at) < weekAgo
  );
  const totalPuffsLastWeek = lastWeekMeds.reduce((sum, m) => sum + (m.puff_count ?? parsePuffCount(m.dosage)), 0);

  // Days with usage
  const usageDates = new Set(thisWeekMeds.map((m) => isoDate(m.taken_at)));
  const daysWithUsage = usageDates.size;

  // GINA flag: >4 days/week usage = uncontrolled
  const ginaFlag = daysWithUsage > 4;

  // Trend
  let trend: "increasing" | "stable" | "decreasing" = "stable";
  if (totalPuffsWeek > totalPuffsLastWeek * 1.2) trend = "increasing";
  else if (totalPuffsWeek < totalPuffsLastWeek * 0.8 && totalPuffsLastWeek > 0) trend = "decreasing";

  // Daily breakdown for sparkline
  const dailyMap = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dailyMap.set(isoDate(d), 0);
  }
  for (const med of thisWeekMeds) {
    const date = isoDate(med.taken_at);
    dailyMap.set(date, (dailyMap.get(date) ?? 0) + (med.puff_count ?? parsePuffCount(med.dosage)));
  }
  const dailyBreakdown = [...dailyMap.entries()].map(([date, puffs]) => ({ date, puffs }));

  return {
    total_puffs_week: totalPuffsWeek,
    total_puffs_last_week: totalPuffsLastWeek,
    days_with_usage_week: daysWithUsage,
    trend,
    gina_flag: ginaFlag,
    daily_breakdown: dailyBreakdown,
  };
}
