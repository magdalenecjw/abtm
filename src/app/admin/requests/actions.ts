"use server";

import { createClient } from "@/lib/supabase/server";
import { computeAttentionFlag } from "@/lib/borrowing/attention-flags";
import type { AdminRequestRow, RequestStatus } from "@/lib/borrowing/filter-requests";
import { generateToken, hashToken } from "@/lib/borrowing/tokens";

type RawBookEmbed =
  | { book_id: string; title: string }
  | { book_id: string; title: string }[]
  | null;

/** Supabase-js can return an embedded to-one relation as either an object or a single-item array, depending on version/config — handle both. */
function normalizeBook(
  book: RawBookEmbed,
): { book_id: string; title: string } | null {
  if (!book) return null;
  if (Array.isArray(book)) return book[0] ?? null;
  return book;
}

/**
 * Fetches all loan requests for the admin dashboard, with book title
 * and computed attention flag attached. Uses the authenticated
 * server client — relies on the existing "Admin can view all
 * requests" RLS policy (003_admin_authorization.sql), not the
 * service-role client, since this is an admin-session-authenticated
 * read (defense in depth, per technical-specifications.md §23).
 *
 * Fetches everything and filters/searches in application code
 * (src/lib/borrowing/filter-requests.ts) rather than building dynamic
 * SQL for every checkbox combination — reasonable at this project's
 * personal-library scale (§37).
 */
export async function getAllRequestsForAdmin(): Promise<AdminRequestRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("loan_requests")
    .select(
      "id, real_name, nickname, requested_at, status, collection_date, return_date, approved_at, books(book_id, title)",
    )
    .order("requested_at", { ascending: true });

  if (error) {
    throw new Error(`Could not load requests: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const book = normalizeBook(row.books as RawBookEmbed);
    const status = row.status as RequestStatus;
    return {
      id: row.id,
      bookTitle: book?.title ?? "(unknown book)",
      bookIdCode: book?.book_id ?? "?",
      realName: row.real_name,
      nickname: row.nickname,
      requestedAt: row.requested_at,
      status,
      collectionDate: row.collection_date,
      returnDate: row.return_date,
      approvedAt: row.approved_at,
      attentionFlag: computeAttentionFlag({
        status,
        collection_date: row.collection_date,
        approved_at: row.approved_at,
      }),
    };
  });
}


const STATUS_CHANGED_ERROR =
  "This request could not be approved because the book's status has changed. Please refresh the requests list.";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Approve (PENDING -> APPROVED), per workflows.md §5.4. Re-checks the
 * request is still PENDING and the book has no other APPROVED
 * request (the partial unique index from 014_one_approved_per_book.sql
 * is the final database-level safety net regardless).
 */
export async function approveRequest(requestId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: request, error: fetchError } = await supabase
    .from("loan_requests")
    .select("id, status, book_id")
    .eq("id", requestId)
    .maybeSingle();

  if (fetchError || !request || request.status !== "pending") {
    return { ok: false, error: STATUS_CHANGED_ERROR };
  }

  const { data: existingApproved } = await supabase
    .from("loan_requests")
    .select("id")
    .eq("book_id", request.book_id)
    .eq("status", "approved")
    .maybeSingle();

  if (existingApproved) {
    return { ok: false, error: STATUS_CHANGED_ERROR };
  }

  const { error: updateError } = await supabase
    .from("loan_requests")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("status", "pending"); // guard against a race since the last check

  if (updateError) {
    return { ok: false, error: STATUS_CHANGED_ERROR };
  }

  return { ok: true };
}

/**
 * Cancel (PENDING -> CANCELLED or APPROVED -> CANCELLED), per
 * workflows.md §5.4. The APPROVED -> CANCELLED path is admin-only,
 * intended for e.g. a borrower no-show after approval.
 */
export async function cancelRequestAsAdmin(
  requestId: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: request, error: fetchError } = await supabase
    .from("loan_requests")
    .select("id, status")
    .eq("id", requestId)
    .maybeSingle();

  if (fetchError || !request) {
    return { ok: false, error: "This request could not be found." };
  }

  if (request.status !== "pending" && request.status !== "approved") {
    return { ok: false, error: `This request is already ${request.status}.` };
  }

  const { error: updateError } = await supabase
    .from("loan_requests")
    .update({ status: "cancelled" })
    .eq("id", requestId)
    .in("status", ["pending", "approved"]);

  if (updateError) {
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  return { ok: true };
}

/**
 * Mark collected (APPROVED, collection_date editable at any time
 * after being set — workflows.md §5.4's "editable after being set,
 * admin can correct it later if entered in error"). Admin picks the
 * date, not restricted to today, to support backdated logging.
 */
export async function markCollected(
  requestId: string,
  collectionDate: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("loan_requests")
    .update({ collection_date: collectionDate })
    .eq("id", requestId)
    .eq("status", "approved");

  if (error) {
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  return { ok: true };
}

/**
 * Mark returned (APPROVED -> RETURNED), per workflows.md §5.4. Single
 * action, stamps status and return_date together. NOT editable after
 * being set (the spec accepts imprecision here since the next
 * pending request's approval is manual regardless).
 */
export async function markReturned(requestId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("loan_requests")
    .update({ status: "returned", return_date: new Date().toISOString() })
    .eq("id", requestId)
    .eq("status", "approved");

  if (error) {
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  return { ok: true };
}

export type RegenerateLinkResult =
  | { ok: true; managementToken: string }
  | { ok: false; error: string };

/**
 * Regenerate management link (PENDING or APPROVED only — hidden for
 * terminal requests), per workflows.md §5.4. The old hash is
 * overwritten, immediately invalidating the previous link. The new
 * raw token is returned exactly once, for the admin to copy and send
 * manually.
 */
export async function regenerateManagementLink(
  requestId: string,
): Promise<RegenerateLinkResult> {
  const supabase = await createClient();

  const { data: request, error: fetchError } = await supabase
    .from("loan_requests")
    .select("id, status")
    .eq("id", requestId)
    .maybeSingle();

  if (
    fetchError ||
    !request ||
    (request.status !== "pending" && request.status !== "approved")
  ) {
    return {
      ok: false,
      error: "This link cannot be regenerated for this request.",
    };
  }

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);

  const { error: updateError } = await supabase
    .from("loan_requests")
    .update({ management_token_hash: tokenHash })
    .eq("id", requestId)
    .in("status", ["pending", "approved"]);

  if (updateError) {
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  return { ok: true, managementToken: rawToken };
}