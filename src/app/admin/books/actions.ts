"use server";

import { createClient } from "@/lib/supabase/server";

export type BookStatus = "available" | "checked_out" | "on_loan";

export type AdminBookRow = {
  id: string;
  bookIdCode: string;
  title: string;
  author: string;
  genre: string;
  active: boolean;
  status: BookStatus;
};

/**
 * Fetches ALL books (active and inactive) for the admin Books list,
 * per ui-specification.md §2.4 — unlike the public catalogue, which
 * only shows active books. Derives each book's availability status
 * the same way the public catalogue's details modal does, via the
 * book_loan_status view (which itself covers every book, not just
 * active ones).
 */
export async function getAllBooksForAdmin(): Promise<AdminBookRow[]> {
  const supabase = await createClient();

  const { data: books, error } = await supabase
    .from("books")
    .select("id, book_id, title, author, genre, active")
    .order("title", { ascending: true });

  if (error) {
    throw new Error(`Could not load books: ${error.message}`);
  }

  const { data: statuses, error: statusError } = await supabase
    .from("book_loan_status")
    .select("books_uuid, has_pending_request, has_approved_request");

  if (statusError) {
    throw new Error(`Could not load loan status: ${statusError.message}`);
  }

  const statusMap = new Map(
    (statuses ?? []).map((s) => [s.books_uuid, s]),
  );

  return (books ?? []).map((b) => {
    const s = statusMap.get(b.id);
    let status: BookStatus = "available";
    if (s?.has_approved_request) status = "on_loan";
    else if (s?.has_pending_request) status = "checked_out";

    return {
      id: b.id,
      bookIdCode: b.book_id,
      title: b.title,
      author: b.author,
      genre: b.genre,
      active: b.active,
      status,
    };
  });
}