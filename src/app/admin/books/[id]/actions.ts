"use server";

import { createClient } from "@/lib/supabase/server";

export type BookDetailForAdmin = {
  id: string;
  bookIdCode: string;
  title: string;
  author: string;
  genre: string;
  notes: string | null;
  active: boolean;
};

/**
 * Read-only metadata for the Book detail page — the spreadsheet is
 * the sole source of truth for these fields (ui-specification.md
 * §2.5); there is no manual edit form for them here.
 */
export async function getBookDetailForAdmin(
  id: string,
): Promise<BookDetailForAdmin | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("books")
    .select("id, book_id, title, author, genre, notes, active")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    bookIdCode: data.book_id,
    title: data.title,
    author: data.author,
    genre: data.genre,
    notes: data.notes,
    active: data.active,
  };
}

export type LoanHistoryRow = {
  id: string;
  realName: string;
  nickname: string;
  requestedAt: string;
  status: string;
  collectionDate: string | null;
  returnDate: string | null;
};

/**
 * Past and current requests for this book — gives context without
 * needing to cross-reference the Requests screen separately, per
 * ui-specification.md §2.5.
 */
export async function getLoanHistoryForBook(
  bookId: string,
): Promise<LoanHistoryRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("loan_requests")
    .select("id, real_name, nickname, requested_at, status, collection_date, return_date")
    .eq("book_id", bookId)
    .order("requested_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load loan history: ${error.message}`);
  }

  return (data ?? []).map((r) => ({
    id: r.id,
    realName: r.real_name,
    nickname: r.nickname,
    requestedAt: r.requested_at,
    status: r.status,
    collectionDate: r.collection_date,
    returnDate: r.return_date,
  }));
}