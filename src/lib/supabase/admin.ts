import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client using the service_role key.
 *
 * BYPASSES ROW LEVEL SECURITY ENTIRELY. Use only for server-side logic
 * that legitimately needs to act outside a specific user's permissions —
 * e.g. the public borrowing flow's server-side submission sequence
 * (docs/workflows.md §3.4), which validates a passcode/token rather than
 * relying on a logged-in identity.
 *
 * The `import "server-only"` line above causes a build-time error if this
 * file is ever imported into a Client Component or other browser-bundled
 * code — a safety net on top of not prefixing the key with NEXT_PUBLIC_.
 *
 * Do NOT use this for admin-authenticated requests — for those, prefer
 * src/lib/supabase/server.ts so RLS policies keyed on the admin's auth
 * session (docs/003_admin_authorization.sql) still apply as a second
 * layer of defense, per technical-specifications.md §23.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}