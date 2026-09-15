import { createClient } from "@supabase/supabase-js";

// Server-only client using the service role key. Never import this from a
// "use client" component — it bypasses RLS entirely, which is fine here
// because it's only ever called from server actions / route handlers that
// already sit behind the PIN-gate middleware.
//
// Scoped to the "diy_tracker" schema (same pattern as SecondBrain's
// "secondbrain" schema in this same WatchTracker project) rather than the
// default "public" schema, so table names don't need a diy_ prefix.
// IMPORTANT: "diy_tracker" must be added to Project Settings -> API ->
// Exposed schemas in the Supabase dashboard, or PostgREST will 404/406 on
// every request — see README.
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase server env vars are missing");
  }
  return createClient(url, key, {
    auth: { persistSession: false },
    db: { schema: "diy_tracker" },
  });
}
