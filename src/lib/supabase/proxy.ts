import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session on every matched request, and
 * enforces server-side authorization for /admin routes.
 *
 * Per technical-specifications.md §21/§23: "Server-side authorisation is
 * mandatory; hiding admin UI controls is insufficient." This is that
 * server-side enforcement — it runs before any /admin page renders.
 *
 * Uses getClaims() (not getSession()) to verify identity: getClaims()
 * verifies the JWT itself (locally, via cached JWKS in most project
 * configurations) rather than trusting an unverified session read.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: getClaims() must be called to refresh the session — do not
  // remove this even if `data` looks unused, or tokens will silently stop
  // refreshing and admins will be logged out unexpectedly.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = data?.claims != null;

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname === "/admin/login";

  if (isAdminRoute && !isLoginRoute && !isLoggedIn) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginRoute && isLoggedIn) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/admin";
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}