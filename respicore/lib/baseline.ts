// lib/baseline.ts
// Computes each user's personal baseline ranges and detects deviations.

import type { HealthMetric, PersonalBaseline } from "@/lib/types/health";

interface HealthAlert {
  id: string;
  severity: "warning" | "urgent";
  message: string;
  detail: string;
  icon: "heart" | "lungs" | "activity" | "alert";
}

const MIN_READINGS = 5;

function mean(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function std(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1));
}

export function computePersonalBaseline(metrics: HealthMetric[]): PersonalBaseline | null {
  const spo2s = metrics.map((m) => m.spo2).filter((v): v is number => v != null);
  const hrs = metrics.map((m) => m.heart_rate).filter((v): v is number => v != null);
  const symptoms = metrics.map((m) => m.symptom_score).filter((v): v is number => v != null);

  const n = spo2s.length + hrs.length + symptoms.length;
  if (n < MIN_READINGS) return null;

  return {
    spo2_mean: spo2s.length ? Math.round(mean(spo2s) * 10) / 10 : 0,
    spo2_std: spo2s.length > 1 ? Math.round(std(spo2s) * 10) / 10 : 0,
    spo2_min: spo2s.length ? Math.min(...spo2s) : 0,
    spo2_max: spo2s.length ? Math.max(...spo2s) : 0,
    heart_rate_mean: hrs.length ? Math.round(mean(hrs) * 10) / 10 : 0,
    heart_rate_std: hrs.length > 1 ? Math.round(std(hrs) * 10) / 10 : 0,
    heart_rate_range: hrs.length ? [Math.min(...hrs), Math.max(...hrs)] as [number, number] : [0, 0],
    symptom_score_mean: symptoms.length ? Math.round(mean(symptoms) * 10) / 10 : 0,
    n_readings: n,
    computed_at: new Date().toISOString(),
  };
}

export function computeBaselineAlerts(
  baseline: PersonalBaseline | null,
  metrics: HealthMetric[]
): HealthAlert[] {
  const alerts: HealthAlert[] = [];
  if (!baseline || metrics.length === 0) return alerts;

  const latest = metrics[0];

  // SpO2 deviation from personal baseline (>2 std below mean)
  if (baseline.spo2_std > 0 && latest.spo2 != null) {
    const threshold = baseline.spo2_mean - 2 * baseline.spo2_std;
    if (latest.spo2 < threshold && baseline.spo2_std >= 0.5) {
      alerts.push({
        id: "baseline-spo2-deviation",
        severity: "urgent",
        message: "SpO2 deviated from your baseline",
        detail: `Your SpO2 of ${latest.spo2}% is more than 2 standard deviations below your personal mean of ${baseline.spo2_mean}%. This may indicate early deterioration.`,
        icon: "lungs",
      });
    }
  }

  // Heart rate deviation from personal baseline (>2 std from mean)
  if (baseline.heart_rate_std > 0 && latest.heart_rate != null) {
    const threshold = baseline.heart_rate_std >= 2
      ? baseline.heart_rate_std * 2
      : 10; // minimum meaningful std threshold
    if (threshold >= 5 && (Math.abs(latest.heart_rate - baseline.heart_rate_mean) > threshold)) {
      alerts.push({
        id: "baseline-hr-deviation",
        severity: "warning",
        message: "Heart rate outside your normal range",
        detail: `Your heart rate of ${latest.heart_rate} BPM differs from your personal average of ${baseline.heart_rate_mean} BPM (typical range: ${baseline.heart_rate_range[0]}-${baseline.heart_rate_range[1]}).`,
        icon: "heart",
      });
    }
  }

  // Symptom score spike vs personal average
  if (latest.symptom_score != null && baseline.symptom_score_mean > 0) {
    if (latest.symptom_score >= baseline.symptom_score_mean + 3) {
      alerts.push({
        id: "baseline-symptom-spike",
        severity: "warning",
        message: "Symptom score above your usual level",
        detail: `Your symptom score of ${latest.symptom_score}/10 is significantly higher than your personal average of ${baseline.symptom_score_mean}/10.`,
        icon: "activity",
      });
    }
  }

  // Gradual SpO2 drift (mean of last 5 readings vs overall mean, more than 1.5 std)
  const recentSpo2 = metrics
    .slice(0, 5)
    .map((m) => m.spo2)
    .filter((v): v is number => v != null);
  if (recentSpo2.length >= 3 && baseline.spo2_std > 0) {
    const recentMean = mean(recentSpo2);
    const drift = baseline.spo2_mean - recentMean;
    if (drift > 1.5 * baseline.spo2_std) {
      alerts.push({
        id: "baseline-spo2-drift",
        severity: "urgent",
        message: "Gradual SpO2 decline detected",
        detail: `Your average SpO2 over the last ${recentSpo2.length} readings is ${recentMean.toFixed(1)}%, trending below your personal baseline of ${baseline.spo2_mean}%. This gradual decline may appear before symptoms become noticeable.`,
        icon: "lungs",
      });
    }
  }

  return alerts;
}
