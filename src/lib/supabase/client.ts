import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use in Client Components ("use client" files).
 *
 * Uses the anon/public key — this is safe to ship to the browser.
 * Row Level Security policies (docs/001_initial_schema.sql,
 * docs/002_initial_rls.sql, docs/003_admin_authorization.sql) are what
 * actually govern what this client is allowed to read/write.
 *
 * Do not use this client for anything that needs to bypass RLS —
 * see src/lib/supabase/admin.ts for that.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}