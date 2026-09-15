"use server";

import { createClient } from "@/lib/supabase/server";

export type BookDetail = {
  id: string;
  book_id: string;
  title: string;
  author: string;
  genre: string;
  notes: string | null;
  status: "available" | "checked_out" | "on_loan";
  currentBorrowerNickname: string | null;
  loanStartedAt: string | null;
};

/**
 * Fetches everything the details modal needs for one book, per
 * technical-specifications.md §15.
 *
 * Deliberately fetched on-demand (only when a spine is clicked), not
 * as part of the initial catalogue listing — matches §33's
 * requirement not to load per-book detail for the whole grid up
 * front, and mirrors how covers are handled once Supabase Storage is
 * set up (Phase 3 — not yet, so no cover lookup here yet either).
 */
export async function getBookDetail(id: string): Promise<BookDetail | null> {
  const supabase = await createClient();

  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("id, book_id, title, author, genre, notes")
    .eq("id", id)
    .eq("active", true)
    .maybeSingle();

  if (bookError || !book) return null;

  const { data: loanStatus } = await supabase
    .from("book_loan_status")
    .select(
      "has_pending_request, has_approved_request, current_borrower_nickname, loan_started_at",
    )
    .eq("books_uuid", id)
    .maybeSingle();

  // Derived per technical-specifications.md §8. "checked_out" (queue
  // info shown "as appropriate" per §15) is intentionally minimal for
  // now — the spec doesn't specify exact queue-count content for
  // public view, only that the borrower's OWN queue position is
  // shown privately via their management link (§11), so this avoids
  // over-specifying an ambiguous requirement.
  let status: BookDetail["status"] = "available";
  if (loanStatus?.has_approved_request) status = "on_loan";
  else if (loanStatus?.has_pending_request) status = "checked_out";

  return {
    ...book,
    status,
    currentBorrowerNickname: loanStatus?.current_borrower_nickname ?? null,
    loanStartedAt: loanStatus?.loan_started_at ?? null,
  };
}