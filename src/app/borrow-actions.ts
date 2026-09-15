"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateToken, hashToken } from "@/lib/borrowing/tokens";
import { isRateLimited } from "@/lib/borrowing/rate-limit";
import { validateName } from "@/lib/borrowing/validate-request";

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


export type SubmitRequestResult =
  | { status: "invalid_token" }
  | {
      status: "field_errors";
      realNameError: string | null;
      nicknameError: string | null;
    }
  | { status: "duplicate" }
  | { status: "book_unavailable" }
  | { status: "error"; message: string }
  | {
      status: "success";
      requestId: string;
      queuePosition: number;
      managementToken: string;
    };

const DUPLICATE_GUARD_WINDOW_MS = 5 * 60 * 1000; // 5 minutes, workflows.md §3.3

/**
 * Submits a borrowing request, following the exact ordered sequence
 * in workflows.md §3.4 (steps numbered in comments below to match).
 * Uses the service-role client throughout — same reasoning as
 * verifyPasscode above.
 */
export async function submitBorrowRequest(
  verificationToken: string,
  realName: string,
  nickname: string,
  bookUuid: string,
): Promise<SubmitRequestResult> {
  const supabase = createAdminClient();

  // Step 2: validate verification token — exists, unexpired, unused.
  const tokenHash = hashToken(verificationToken);
  const { data: tokenRow, error: tokenError } = await supabase
    .from("verification_tokens")
    .select("id, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (
    tokenError ||
    !tokenRow ||
    tokenRow.used_at !== null ||
    new Date(tokenRow.expires_at).getTime() <= Date.now()
  ) {
    return { status: "invalid_token" };
  }

  // Step 3: validate field formats.
  const realNameError = validateName(realName);
  const nicknameError = validateName(nickname);
  if (realNameError || nicknameError) {
    return { status: "field_errors", realNameError, nicknameError };
  }

  // Step 4: duplicate guard (same book_id + real_name within 5 min).
  const windowStart = new Date(
    Date.now() - DUPLICATE_GUARD_WINDOW_MS,
  ).toISOString();
  const { data: recentDuplicate, error: dupError } = await supabase
    .from("loan_requests")
    .select("id")
    .eq("book_id", bookUuid)
    .eq("real_name", realName)
    .gte("requested_at", windowStart)
    .limit(1)
    .maybeSingle();

  if (dupError) {
    return {
      status: "error",
      message: "Something went wrong. Please try again.",
    };
  }
  if (recentDuplicate) {
    return { status: "duplicate" };
  }

  // Step 5: confirm the book still exists and is active.
  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("id")
    .eq("id", bookUuid)
    .eq("active", true)
    .maybeSingle();

  if (bookError || !book) {
    return { status: "book_unavailable" };
  }

  // Step 6: consume the verification token — only now, after every
  // other check has passed, so a field/duplicate error doesn't cost
  // the visitor their passcode verification (§3.4 step 6's explicit
  // rationale). The `.is("used_at", null)` guards against a race
  // consuming the same token twice.
  const { error: consumeError } = await supabase
    .from("verification_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", tokenRow.id)
    .is("used_at", null);

  if (consumeError) {
    return {
      status: "error",
      message: "Something went wrong. Please try again.",
    };
  }

  // Queue position: count of existing PENDING requests for this book
  // BEFORE this one is created — that's exactly how many are ahead of
  // it (technical-specifications.md §9).
  const { count: pendingAheadCount, error: countError } = await supabase
    .from("loan_requests")
    .select("id", { count: "exact", head: true })
    .eq("book_id", bookUuid)
    .eq("status", "pending");

  if (countError) {
    return {
      status: "error",
      message: "Something went wrong. Please try again.",
    };
  }

  // Steps 7-8: create the request, with a freshly generated,
  // hashed-only management token.
  const rawManagementToken = generateToken();
  const managementTokenHash = hashToken(rawManagementToken);

  const { data: newRequest, error: insertError } = await supabase
    .from("loan_requests")
    .insert({
      book_id: bookUuid,
      real_name: realName,
      nickname,
      status: "pending",
      management_token_hash: managementTokenHash,
    })
    .select("id")
    .single();

  if (insertError || !newRequest) {
    return {
      status: "error",
      message: "Something went wrong. Please try again.",
    };
  }

  // Step 9: return confirmation data, including the raw management
  // token — the ONLY time it's ever available
  // (technical-specifications.md §11, workflows.md §3.5/§4.1).
  return {
    status: "success",
    requestId: newRequest.id,
    queuePosition: pendingAheadCount ?? 0,
    managementToken: rawManagementToken,
  };
}


export type CancelResult =
  | { status: "cancelled" }
  | { status: "not_pending"; currentStatus: string }
  | { status: "invalid" };

/**
 * Cancels a request via its management token, per workflows.md §4.4.
 * Re-checks the request is still PENDING at the moment of the click
 * (it may have changed since page load, e.g. admin approved it in
 * the meantime) — if it's no longer PENDING, this reflects the
 * current true status rather than erroring, per the spec's "always
 * re-fetch and re-render from server truth" approach.
 *
 * Shared by both the post-submission confirmation screen and the
 * dedicated /request/manage/{token} page (same underlying action,
 * per workflows.md §3.5's note that they're "the same view/component").
 */
export async function cancelRequestByToken(
  managementToken: string,
): Promise<CancelResult> {
  const supabase = createAdminClient();
  const tokenHash = hashToken(managementToken);

  const { data: request, error } = await supabase
    .from("loan_requests")
    .select("id, status")
    .eq("management_token_hash", tokenHash)
    .maybeSingle();

  if (error || !request) {
    return { status: "invalid" };
  }

  if (request.status !== "pending") {
    return { status: "not_pending", currentStatus: request.status };
  }

  const { error: updateError } = await supabase
    .from("loan_requests")
    .update({ status: "cancelled" })
    .eq("id", request.id)
    .eq("status", "pending"); // guard against a race since the last check

  if (updateError) {
    return { status: "invalid" };
  }

  return { status: "cancelled" };
}