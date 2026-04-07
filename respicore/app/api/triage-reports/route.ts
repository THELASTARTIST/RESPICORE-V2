// app/api/triage-reports/route.ts
// POST -> save a triage report (voice analysis result)
// GET  -> fetch user's triage reports

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { predicted_class, confidence, probabilities, inference_ms } = body;
  if (!predicted_class || confidence == null) {
    return NextResponse.json({ error: "predicted_class and confidence required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("triage_reports")
    .insert({
      user_id: user.id,
      predicted_class,
      confidence: parseFloat(confidence) || 0,
      probabilities: probabilities ?? {},
      inference_ms: inference_ms ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("[API] triage_reports INSERT error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

  const { data, error, count } = await supabase
    .from("triage_reports")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(0, limit - 1);

  if (error) {
    console.error("[API] triage_reports SELECT error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, error: null, meta: { total: count, limit } });
}