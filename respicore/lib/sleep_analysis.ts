// lib/sleep_analysis.ts
// Computes sleep disruption correlation: evening medication use vs next-morning SpO2 & symptom scores.

import type { HealthMetric, MedicationLog, SleepDisruptionReport } from "@/lib/types/health";

/**
 * Group readings into time-of-day buckets.
 * Evening: 18:00–23:59, Night: 00:00–05:59, Morning: 06:00–11:59
 */
type TimeOfDay = "morning" | "evening" | "night";

function classifyTime(iso: string): TimeOfDay {
  const h = new Date(iso).getHours();
  if (h >= 6 && h < 12) return "morning";
  if (h >= 18) return "evening";
  return "night";
}

function getDate(iso: string): string {
  return iso.slice(0, 10);
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface DayData {
  has_evening: boolean;
  has_night_med: boolean; // rescue inhaler used after 18:00
  morning_spo2: number | null;
  morning_symptom: number | null;
}

export function computeSleepDisruption(
  metrics: HealthMetric[],
  medications: MedicationLog[],
  weeks = 4
): SleepDisruptionReport[] {
  const now = new Date();
  const reports: SleepDisruptionReport[] = [];

  for (let w = 0; w < weeks; w++) {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - w * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);

    // Collect unique dates in this week
    const dateSet = new Set<string>();
    for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
      dateSet.add(isoDate(d));
    }

    const dayMap = new Map<string, DayData>();

    // Initialize
    for (const dt of dateSet) {
      dayMap.set(dt, { has_evening: false, has_night_med: false, morning_spo2: null, morning_symptom: null });
    }

    // Mark medication events in the evening/night
    for (const med of medications) {
      const medDate = getDate(med.taken_at);
      const tod = classifyTime(med.taken_at);
      const isRescue = med.medication_type === "inhaler_rescue";

      // If medication taken in evening/night, mark the *next morning* date
      if ((tod === "evening" || tod === "night") && isRescue) {
        const nextDay = new Date(med.taken_at);
        nextDay.setDate(nextDay.getDate() + 1);
        const morningDate = isoDate(nextDay);

        // Check if this morning date falls within our week window
        const existing = dayMap.get(morningDate);
        if (existing) {
          existing.has_night_med = true;
        }
      }

      // General evening medication flag
      if (tod === "evening") {
        const entry = dayMap.get(medDate);
        if (entry) entry.has_evening = true;
      }
    }

    // Capture morning readings (06:00-11:59)
    for (const m of metrics) {
      if (classifyTime(m.recorded_at) === "morning") {
        const date = getDate(m.recorded_at);
        const entry = dayMap.get(date);
        if (!entry) continue;
        if (m.spo2 != null) entry.morning_spo2 = m.spo2;
        if (m.symptom_score != null) entry.morning_symptom = m.symptom_score;
      }
    }

    // Compute aggregates
    const allMornings = [...dayMap.values()].filter(
      (d) => d.morning_spo2 != null || d.morning_symptom != null
    );
    const afterMedMornings = [...dayMap.values()].filter(
      (d) => d.has_night_med && (d.morning_spo2 != null || d.morning_symptom != null)
    );

    const avgSpo2 = (arr: typeof allMornings) => {
      const vals = arr.map((d) => d.morning_spo2).filter((v): v is number => v != null);
      return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
    };

    const avgSymptom = (arr: typeof allMornings) => {
      const vals = arr.map((d) => d.morning_symptom).filter((v): v is number => v != null);
      return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
    };

    const nNightMeds = [...dayMap.values()].filter((d) => d.has_evening || d.has_night_med).length;
    const nRescueNights = [...dayMap.values()].filter((d) => d.has_night_med).length;

    const avgAllSpo2 = avgSpo2(allMornings);
    const avgMedSpo2 = avgSpo2(afterMedMornings);
    const spo2Delta = avgAllSpo2 > 0 && avgMedSpo2 > 0
      ? Math.round(((avgMedSpo2 - avgAllSpo2) / avgAllSpo2) * 1000) / 10
      : 0;

    let summary = "";
    if (nRescueNights > 0) {
      summary = `You used your rescue inhaler on ${nRescueNights} night${nRescueNights > 1 ? "s" : ""} this week`;
      if (spo2Delta < -2) {
        summary += `; morning SpO2 readings were ${Math.abs(spo2Delta).toFixed(1)}% lower on those days.`;
      } else {
        summary += "; morning readings showed no significant correlation.";
      }
    } else if (nNightMeds > 0) {
      summary = `Evening medication was used ${nNightMeds} night${nNightMeds > 1 ? "s" : ""} this week.`;
    } else {
      summary = "No evening medication use this week.";
    }

    const avgAllSymptom = avgSymptom(allMornings);
    const avgMedSymptom = avgSymptom(afterMedMornings);

    if (nRescueNights > 0 && avgMedSymptom > avgAllSymptom) {
      summary += ` Morning symptom scores averaged ${avgMedSymptom.toFixed(0)}/10 on those days vs ${avgAllSymptom.toFixed(0)}/10 overall.`;
    }

    reports.push({
      week_start: isoDate(weekStart),
      week_end: isoDate(weekEnd),
      n_night_meds: nNightMeds,
      n_rescue_inhaler_nights: nRescueNights,
      avg_morning_spo2_all: avgAllSpo2,
      avg_morning_spo2_after_meds: avgMedSpo2,
      spo2_delta_pct: spo2Delta,
      avg_morning_symptom_all: avgAllSymptom,
      avg_morning_symptom_after_meds: avgMedSymptom,
      summary,
    });
  }

  return reports.reverse(); // oldest first
}
