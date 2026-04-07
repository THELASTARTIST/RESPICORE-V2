// app/api/medications/route.ts
// POST /api/medications  -> insert a medication log entry
// GET  /api/medications  -> fetch user's medication logs
// DELETE /api/medications -> delete a medication entry by ID

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { medication_type, medication_name, dosage, notes, puff_count } = body;
  if (!medication_type || !dosage)
    return NextResponse.json({ error: "medication_type and dosage required" }, { status: 400 });

  const { data, error } = await supabase.from("medications_log").insert({
    user_id: user.id,
    medication_type,
    medication_name: medication_name ?? null,
    dosage,
    notes: notes ?? null,
    puff_count: puff_count ?? null,
    taken_at: body.taken_at ?? new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

  const { data, error } = await supabase.from("medications_log").select("*")
    .eq("user_id", user.id)
    .order("taken_at", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });

  const { error } = await supabase.from("medications_log").delete()
    .eq("id", id).eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
