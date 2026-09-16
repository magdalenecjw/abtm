"use server";

import { createClient } from "@/lib/supabase/server";

export type AdminReadRow = {
  id: string;
  bookId: string | null;
  bookIdCode: string | null; // human-readable code, if linked
  title: string;
  author: string;
  genre: string | null;
  rating: number | null;
  notes: string | null;
  dateRead: string | null;
  source: "Owned" | "NLB" | null;
};

type RawBookEmbed =
  | { book_id: string }
  | { book_id: string }[]
  | null;

function normalizeBookIdCode(book: RawBookEmbed): string | null {
  if (!book) return null;
  if (Array.isArray(book)) return book[0]?.book_id ?? null;
  return book.book_id;
}

/**
 * Fetches all reads for the admin list, per ui-specification.md §2.8
 * — full detail including book_id link status, ordered newest-read
 * first (nulls last, same convention as the public feed).
 */
export async function getAllReadsForAdmin(): Promise<AdminReadRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reads")
    .select(
      "id, book_id, title, author, genre, rating, notes, date_read, source, books(book_id)",
    )
    .order("date_read", { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error(`Could not load reads: ${error.message}`);
  }

  return (data ?? []).map((r) => ({
    id: r.id,
    bookId: r.book_id,
    bookIdCode: normalizeBookIdCode(r.books as RawBookEmbed),
    title: r.title,
    author: r.author,
    genre: r.genre,
    rating: r.rating,
    notes: r.notes,
    dateRead: r.date_read,
    source: r.source,
  }));
}

export type DeleteResult = { ok: true } | { ok: false; error: string };

/**
 * Hard delete, no restrictions, per ui-specification.md §2.8 — no
 * foreign key references `reads`, so nothing blocks removing a row
 * entirely (e.g. an unwanted or mismatched import).
 */
export async function deleteRead(id: string): Promise<DeleteResult> {
  const supabase = await createClient();

  const { error } = await supabase.from("reads").delete().eq("id", id);

  if (error) {
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  return { ok: true };
}

export type ReadDetail = {
  id: string;
  title: string;
  author: string;
  genre: string | null;
  rating: number | null;
  notes: string | null;
  dateRead: string | null;
  source: "Owned" | "NLB" | null;
  bookIdCode: string | null;
};

/** Fetches a single read for the edit page, including its linked book_id CODE (not the internal UUID) for display/editing. */
export async function getReadById(id: string): Promise<ReadDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reads")
    .select(
      "id, title, author, genre, rating, notes, date_read, source, books(book_id)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    title: data.title,
    author: data.author,
    genre: data.genre,
    rating: data.rating,
    notes: data.notes,
    dateRead: data.date_read,
    source: data.source,
    bookIdCode: normalizeBookIdCode(data.books as RawBookEmbed),
  };
}

export type UpdateResult = { ok: true } | { ok: false; error: string };

export type ReadFormFields = {
  title: string;
  author: string;
  genre: string;
  rating: string;
  notes: string;
  dateRead: string;
  source: "" | "Owned" | "NLB";
  bookIdCode: string;
};

/**
 * Updates a read — every field editable post-import
 * (ui-specification.md §2.8), unlike the narrower import-time preview
 * (workflows.md §7.4) which locks title/author/date_read. The book
 * link is entered/edited by its human-readable book_id CODE (e.g.
 * "BK0001"), resolved to the internal UUID here — an empty value
 * unlinks the read from any book.
 */
export async function updateRead(
  id: string,
  fields: ReadFormFields,
): Promise<UpdateResult> {
  const supabase = await createClient();

  let bookUuid: string | null = null;
  const trimmedCode = fields.bookIdCode.trim();
  if (trimmedCode) {
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("id")
      .eq("book_id", trimmedCode)
      .maybeSingle();

    if (bookError || !book) {
      return {
        ok: false,
        error: `No book found with book_id "${trimmedCode}".`,
      };
    }
    bookUuid = book.id;
  }

  let rating: number | null = null;
  if (fields.rating.trim()) {
    const parsed = Number(fields.rating);
    if (Number.isNaN(parsed)) {
      return { ok: false, error: "Rating must be a number." };
    }
    rating = parsed;
  }

  const { error } = await supabase
    .from("reads")
    .update({
      title: fields.title,
      author: fields.author,
      genre: fields.genre || null,
      rating,
      notes: fields.notes || null,
      date_read: fields.dateRead || null,
      source: fields.source || null,
      book_id: bookUuid,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  return { ok: true };
}