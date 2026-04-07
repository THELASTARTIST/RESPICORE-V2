-- Run this in your Supabase SQL Editor to add waveform storage for multi-session comparison.

-- Add columns for waveform-based session comparison
alter table triage_reports
  add column if not exists waveform_data jsonb default '[]' not null,
  add column if not exists predicted_class_key text check (predicted_class_key in ('normal', 'anomalous', 'wheeze', 'copd')),
  add column if not exists audio_duration numeric;
