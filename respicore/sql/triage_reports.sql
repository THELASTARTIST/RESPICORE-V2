-- Run this in your Supabase SQL Editor to add triage report storage.
-- This creates the table, RLS policies, and indexes for the dashboard.

-- 1. Create the triage_reports table
create table triage_reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  predicted_class text check (predicted_class in ('normal', 'anomalous', 'wheeze', 'copd')) not null,
  confidence numeric not null,
  probabilities jsonb default '{}' not null,
  inference_ms numeric,
  created_at timestamptz default now()
);

-- 2. Enable Row-Level Security
alter table triage_reports enable row level security;

-- 3. RLS: users can only see their own reports
create policy "Users can view own triage reports"
  on triage_reports for select
  using (auth.uid() = user_id);

create policy "Users can insert own triage reports"
  on triage_reports for insert
  with check (auth.uid() = user_id);

-- 4. Index for faster queries
create index idx_triage_reports_user_created on triage_reports (user_id, created_at desc);
