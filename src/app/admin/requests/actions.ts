"use server";

import { createClient } from "@/lib/supabase/server";
import { computeAttentionFlag } from "@/lib/borrowing/attention-flags";
import type { AdminRequestRow, RequestStatus } from "@/lib/borrowing/filter-requests";

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