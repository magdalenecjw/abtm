import { createClient } from "@/lib/supabase/server";

export type PublicRead = {
  id: string;
  bookId: string | null; // internal UUID, set only for Owned+linked reads
  title: string;
  author: string;
  coverUrl: string | null;
  genre: string | null;
  rating: number | null;
  notes: string | null;
  source: "Owned" | "NLB" | null;
};

/**
 * Fetches the public My Reads feed, per ui-specification.md §1.2:
 * reverse-chronological (by date_read), no search/filter. date_read
 * itself is never shown publicly, only used for ordering.
 *
 * Covers: for Owned reads, the cover comes from the linked book's
 * actual cover in book_covers (kept current if the admin replaces
 * it) — reads.cover_url is only used as a fallback for non-owned
 * reads that have their own stored cover reference.
 */
export async function getPublicReads(): Promise<PublicRead[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reads")
    .select(
      "id, book_id, title, author, cover_url, genre, rating, notes, source, date_read",
    )
    .order("date_read", { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error(`Could not load reads: ${error.message}`);
  }

  const rows = data ?? [];
  const linkedBookIds = rows
    .map((r) => r.book_id)
    .filter((id): id is string => id !== null);

  const coverByBookId = new Map<string, string>();
  if (linkedBookIds.length > 0) {
    const { data: covers } = await supabase
      .from("book_covers")
      .select("book_id, storage_path")
      .in("book_id", linkedBookIds);

    for (const cover of covers ?? []) {
      const url = supabase.storage
        .from("covers")
        .getPublicUrl(cover.storage_path).data.publicUrl;
      coverByBookId.set(cover.book_id, url);
    }
  }

  return rows.map((r) => ({
    id: r.id,
    bookId: r.book_id,
    title: r.title,
    author: r.author,
    coverUrl: r.book_id
      ? coverByBookId.get(r.book_id) ?? null
      : r.cover_url,
    genre: r.genre,
    rating: r.rating,
    notes: r.notes,
    source: r.source,
  }));
}