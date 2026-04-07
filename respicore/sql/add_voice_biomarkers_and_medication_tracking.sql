-- Voice Biomarker Trend, Personal Baseline, Sleep Disruption \& Rescue Inhaler Tracking
-- Run this in Supabase SQL Editor.
\n\n-- 1. Add voice biomarker columns to triage_reports
alter table triage_reports
  add column if not exists cough_count int,
  add column if not exists hoarseness_index float,
  add column if not exists breathing_duration_secs float;
\n\n-- 2. Ensure puff_count on medications_log for rescue inhaler tracking
alter table medications_log
  add column if not exists puff_count int;
\n\n-- 3. Index for rescue inhaler queries
create index if not exists idx_meds_user_type_time
  on medications_log (user_id, medication_type, taken_at desc);
\n\n-- 4. Index for sleep/time-of-day queries
create index if not exists idx_healthmetrics_user_recorded
  on health_metrics (user_id, recorded_at desc);
\n\n