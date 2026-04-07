// lib/types/health.ts
// Shared TypeScript interfaces mirroring the Supabase database schema.
// Used across API routes, server components, and client components
// for end-to-end type safety.

export type DataSource = "manual" | "wearable" | "ml_inference" | "import";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: string;
  user_id: string;
  device_name: string;
  device_type: "smartwatch" | "pulse_oximeter" | "spirometer" | string;
  manufacturer: string | null;
  model: string | null;
  firmware_version: string | null;
  paired_at: string;
  last_synced_at: string | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
}

export interface HealthMetric {
  id: string;
  user_id: string;
  device_id: string | null;

  // Core readings
  spo2: number | null;
  heart_rate: number | null;
  respiratory_rate: number | null;
  peak_flow: number | null;
  fev1: number | null;

  // Subjective
  symptom_score: number | null;
  notes: string | null;
  breathing_exercise_done: boolean;
  exercise_duration_mins: number | null;

  data_source: DataSource;
  recorded_at: string;
  created_at: string;
}

// DTO used by the metric submission form
export class TriageReport {
  id: string;
  user_id: string;
  predicted_class: "normal" | "anomalous" | "wheeze" | "copd";
  confidence: number;
  probabilities: { normal: number; anomalous: number; wheeze: number; copd: number };
  inference_ms: number | null;
  created_at: string;
}

export interface MetricFormData {
  spo2?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  peak_flow?: number;
  symptom_score?: number;
  notes?: string;
  breathing_exercise_done: boolean;
  exercise_duration_mins?: number;
  recorded_at?: string;
}

export interface MLPrediction {
  id: string;
  user_id: string;
  metric_id: string | null;
  model_version: string;
  predicted_class: "normal" | "anomalous" | "wheeze" | "copd";
  confidence: number;
  probabilities: {
    normal: number;
    anomalous: number;
    wheeze: number;
    copd: number;
  };
  spectrogram_url: string | null;
  inference_ms: number | null;
  created_at: string;
}

// API response wrappers
export interface ApiSuccess<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface MedicationLog {
  id: string;
  user_id: string;
  medication_type: string;
  medication_name: string | null;
  dosage: string;
  notes: string | null;
  puff_count: number | null;
  taken_at: string;
  created_at: string;
}

export interface VoiceBiomarker {
  cough_count: number | null;
  hoarseness_index: number | null;
  breathing_duration_secs: number | null;
}

export interface PersonalBaseline {
  spo2_mean: number;
  spo2_std: number;
  spo2_min: number;
  spo2_max: number;
  heart_rate_mean: number;
  heart_rate_std: number;
  heart_rate_range: [number, number];
  symptom_score_mean: number;
  n_readings: number;
  computed_at: string;
}

export interface SleepDisruptionReport {
  week_start: string;
  week_end: string;
  n_night_meds: number;
  n_rescue_inhaler_nights: number;
  avg_morning_spo2_all: number;
  avg_morning_spo2_after_meds: number;
  spo2_delta_pct: number;
  avg_morning_symptom_all: number;
  avg_morning_symptom_after_meds: number;
  summary: string;
}

export interface RescueInhalerStats {
  total_puffs_week: number;
  total_puffs_last_week: number;
  days_with_usage_week: number;
  trend: "increasing" | "stable" | "decreasing";
  gina_flag: boolean;
  daily_breakdown: { date: string; puffs: number }[];
}
