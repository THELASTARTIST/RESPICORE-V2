// lib/supabase/client.ts
// Browser-side Supabase client.
// Use this ONLY in Client Components ("use client").
// The anon key is safe to expose — RLS policies enforce data isolation at DB level.

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
