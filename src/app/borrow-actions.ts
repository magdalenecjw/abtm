"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateToken, hashToken } from "@/lib/borrowing/tokens";
import { isRateLimited } from "@/lib/borrowing/rate-limit";

const VERIFICATION_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes, workflows.md §3.2

/**
 * Best-effort client IP extraction from standard proxy headers
 * (Vercel sets x-forwarded-for reliably in production). Falls back
 * to "unknown" in environments without these headers (e.g. local
 * dev) — rate limiting is less precise there, but this only affects
 * local testing, not production behavior.
 */
async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = headersList.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

export type PasscodeResult =
  | { ok: true; verificationToken: string }
  | { ok: false; error: string };

/**
 * Verifies the shared borrow passcode, per workflows.md §3.2.
 *
 * Uses the service-role client throughout: passcode_attempts and
 * verification_tokens intentionally have no public RLS policies
 * (012_borrowing_flow_schema.sql), matching
 * technical-specifications.md §23's guidance that request-flow writes
 * should go through controlled server-side logic rather than direct
 * RLS-gated public access.
 */
export async function verifyPasscode(passcode: string): Promise<PasscodeResult> {
  const ip = await getClientIp();
  const supabase = createAdminClient();

  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000,
  ).toISOString();

  const { count, error: countError } = await supabase
    .from("passcode_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip_address", ip)
    .gte("attempted_at", twentyFourHoursAgo);

  if (countError) {
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  // Deliberately vague — doesn't reveal remaining lockout time, per
  // workflows.md §3.2.
  if (isRateLimited(count ?? 0)) {
    return {
      ok: false,
      error: "Too many incorrect attempts. Please try again later.",
    };
  }

  const expectedPasscode = process.env.BORROW_PASSCODE;
  if (!expectedPasscode || passcode !== expectedPasscode) {
    // Record the failed attempt BEFORE returning, so it counts toward
    // the rate limit.
    await supabase.from("passcode_attempts").insert({ ip_address: ip });
    return { ok: false, error: "The borrow passcode is incorrect." };
  }

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(
    Date.now() + VERIFICATION_TOKEN_TTL_MS,
  ).toISOString();

  const { error: insertError } = await supabase
    .from("verification_tokens")
    .insert({ token_hash: tokenHash, expires_at: expiresAt });

  if (insertError) {
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  // The raw token is returned exactly once, here — the client holds
  // it only in memory (React state), never in any browser storage,
  // per workflows.md §3.2.
  return { ok: true, verificationToken: rawToken };
}