// app/api/health-metrics/route.ts
// POST /api/health-metrics  -> insert a new metric reading
// GET  /api/health-metrics  -> fetch paginated metrics for the authenticated user

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { MetricFormData, ApiResponse, HealthMetric } from "@/lib/types/health";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "Unauthorized" },
      { status: 401 }
    );
  }

  let body: MetricFormData;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const hasMetric = [
    body.spo2,
    body.heart_rate,
    body.respiratory_rate,
    body.peak_flow,
    body.symptom_score,
    body.notes,
    body.breathing_exercise_done,
  ].some((v) => v !== undefined && v !== null && v !== "");

  if (!hasMetric) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "At least one metric value is required." },
      { status: 400 }
    );
  }

  const payload = {
    user_id:                 user.id,
    spo2:                    body.spo2                    ?? null,
    heart_rate:              body.heart_rate               ?? null,
    respiratory_rate:        body.respiratory_rate         ?? null,
    peak_flow:               body.peak_flow                ?? null,
    symptom_score:           body.symptom_score            ?? null,
    notes:                   body.notes                    ?? null,
    breathing_exercise_done: body.breathing_exercise_done  ?? false,
    exercise_duration_mins:  body.exercise_duration_mins   ?? null,
    recorded_at:             body.recorded_at ?? new Date().toISOString(),
    data_source:             "manual" as const,
  };

  const { data, error: insertError } = await supabase
    .from("health_metrics")
    .insert(payload)
    .select()
    .single();

  if (insertError) {
    console.error("[API] health_metrics INSERT error:", insertError);
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: insertError.message },
      { status: 500 }
    );
  }

  return NextResponse.json<ApiResponse<HealthMetric>>(
    { data, error: null },
    { status: 201 }
  );
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const limit  = Math.min(parseInt(searchParams.get("limit")  || "30"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const from = searchParams.get("from") || thirtyDaysAgo.toISOString();
  const to   = searchParams.get("to")   || new Date().toISOString();

  const { data, error: fetchError, count } = await supabase
    .from("health_metrics")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .gte("recorded_at", from)
    .lte("recorded_at", to)
    .order("recorded_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (fetchError) {
    console.error("[API] health_metrics SELECT error:", fetchError);
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: fetchError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data,
    error: null,
    meta: { total: count, limit, offset },
  });
}
