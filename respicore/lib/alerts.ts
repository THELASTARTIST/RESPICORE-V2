// lib/alerts.ts
// Computes symptom trend alerts from existing health metrics data.

import type { HealthMetric } from "@/lib/types/health";

export interface HealthAlert {
  id: string;
  severity: "warning" | "urgent";
  message: string;
  detail: string;
  icon: "heart" | "lungs" | "activity" | "alert";
}

export function computeHealthAlerts(metrics: HealthMetric[]): HealthAlert[] {
  const alerts: HealthAlert[] = [];
  const sorted = [...metrics].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  );

  // Check SpO2 below 92% for 3+ consecutive days with readings
  const lowSpo2Days = getConsecutiveDaysWithLowSpo2(sorted);
  if (lowSpo2Days >= 3) {
    alerts.push({
      id: "low-spo2",
      severity: "urgent",
      message: "Consistently low SpO2 detected",
      detail: `Your SpO2 has been below 92% for ${lowSpo2Days} consecutive reading days. Consider consulting a healthcare provider.`,
      icon: "lungs",
    });
  }

  // Check symptom score rising trend (monotonic increase over 3+ readings)
  const risingTrend = getMonotonicSymptomRise(sorted);
  if (risingTrend >= 3) {
    alerts.push({
      id: "rising-symptom",
      severity: "warning",
      message: "Symptom score trending upward",
      detail: `Your reported symptom score has increased across ${risingTrend} consecutive readings. Monitor closely.`,
      icon: "activity",
    });
  }

  // Check heart rate consistently outside normal 60-100 for 3+ days
  const hrOffDays = getConsecutiveDaysWithAbnormalHR(sorted);
  if (hrOffDays >= 3) {
    alerts.push({
      id: "abnormal-hr",
      severity: "warning",
      message: "Abnormal heart rate pattern",
      detail: `Your heart rate has been outside the 60-100 BPM range for ${hrOffDays} consecutive reading days.`,
      icon: "heart",
    });
  }

  // Check respiratory rate above 25 for 2+ consecutive days
  const rrHighDays = getConsecutiveDaysWithHighRR(sorted);
  if (rrHighDays >= 2) {
    alerts.push({
      id: "high-rr",
      severity: "urgent",
      message: "Elevated respiratory rate",
      detail: `Your respiratory rate has exceeded 25 br/min for ${rrHighDays} consecutive reading days.`,
      icon: "alert",
    });
  }

  return alerts;
}

function getConsecutiveDaysWithLowSpo2(metrics: HealthMetric[]): number {
  const withSpo2 = metrics.filter((m) => m.spo2 != null);
  if (!withSpo2.length) return 0;

  const dates = [...new Set(withSpo2.map((m) => m.recorded_at.slice(0, 10)))].sort();
  let maxStreak = 0;
  let currentStreak = 0;

  for (let i = 0; i < dates.length; i++) {
    const dayData = metrics.filter(
      (m) => m.recorded_at.slice(0, 10) === dates[i] && m.spo2 != null
    );
    const dayAvgSpo2 =
      dayData.reduce((s, m) => s + (m.spo2 ?? 0), 0) / dayData.length;

    if (dayAvgSpo2 < 92) {
      if (i > 0) {
        const prev = new Date(dates[i - 1]);
        const curr = new Date(dates[i]);
        const diffDays = (curr.getTime() - prev.getTime()) / 86400000;
        if (diffDays <= 2) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return maxStreak;
}

function getMonotonicSymptomRise(metrics: HealthMetric[]): number {
  const withScore = metrics.filter((m) => m.symptom_score != null);
  if (withScore.length < 3) return 0;

  let maxStreak = 0;
  let currentStreak = 1;

  for (let i = 1; i < withScore.length; i++) {
    if (withScore[i].symptom_score! >= withScore[i - 1].symptom_score!) {
      currentStreak++;
    } else {
      currentStreak = 1;
    }
    maxStreak = Math.max(maxStreak, currentStreak);
  }

  return maxStreak >= 3 ? maxStreak : 0;
}

function getConsecutiveDaysWithAbnormalHR(metrics: HealthMetric[]): number {
  const withHR = metrics.filter((m) => m.heart_rate != null);
  if (!withHR.length) return 0;

  const dates = [...new Set(withHR.map((m) => m.recorded_at.slice(0, 10)))].sort();
  let maxStreak = 0;
  let currentStreak = 0;

  for (let i = 0; i < dates.length; i++) {
    const dayData = metrics.filter(
      (m) => m.recorded_at.slice(0, 10) === dates[i] && m.heart_rate != null
    );
    const dayAvgHR =
      dayData.reduce((s, m) => s + (m.heart_rate ?? 0), 0) / dayData.length;

    const isAbnormal = dayAvgHR < 60 || dayAvgHR > 100;
    if (isAbnormal) {
      if (i > 0) {
        const prev = new Date(dates[i - 1]);
        const curr = new Date(dates[i]);
        const diffDays = (curr.getTime() - prev.getTime()) / 86400000;
        if (diffDays <= 2) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return maxStreak;
}

function getConsecutiveDaysWithHighRR(metrics: HealthMetric[]): number {
  const withRR = metrics.filter((m) => m.respiratory_rate != null);
  if (!withRR.length) return 0;

  const dates = [...new Set(withRR.map((m) => m.recorded_at.slice(0, 10)))].sort();
  let maxStreak = 0;
  let currentStreak = 0;

  for (let i = 0; i < dates.length; i++) {
    const dayData = metrics.filter(
      (m) => m.recorded_at.slice(0, 10) === dates[i] && m.respiratory_rate != null
    );
    const dayAvgRR =
      dayData.reduce((s, m) => s + (m.respiratory_rate ?? 0), 0) / dayData.length;

    if (dayAvgRR > 25) {
      if (i > 0) {
        const prev = new Date(dates[i - 1]);
        const curr = new Date(dates[i]);
        const diffDays = (curr.getTime() - prev.getTime()) / 86400000;
        if (diffDays <= 2) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return maxStreak;
}
