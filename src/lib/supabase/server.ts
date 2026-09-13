import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for use in Server Components, Server Actions, and
 * Route Handlers. Reads/writes the auth session via cookies, so it knows
 * whether the current request is from a logged-in admin (Supabase Auth).
 *
 * Still uses the anon/public key and is still subject to RLS — this is
 * NOT a privilege-escalation client. It's the same access level as
 * src/lib/supabase/client.ts, just usable on the server and aware of
 * the request's auth cookies.
 *
 * `cookies()` is async in Next.js 16 — must be awaited before use.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll is called from a Server Component in some cases
            // (e.g. rendering a page, not handling a mutation). Writing
            // cookies there is a no-op that Next.js rejects — safe to
            // ignore as long as proxy.ts (see Step 3) refreshes the
            // session on every request.
          }
        },
      },
    },
  );
}