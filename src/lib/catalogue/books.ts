import { createClient } from "@/lib/supabase/server";

export type CatalogueBook = {
  id: string;
  book_id: string;
  title: string;
  author: string;
  genre: string;
};

/**
 * Fetches all active books for the public catalogue grid.
 *
 * Deliberately lean — no status, cover, or loan info here. Per
 * technical-specifications.md §14/§33, the spine grid only shows
 * titles; per-book status and cover load only when the details modal
 * opens for that specific book, not for the whole grid up front.
 *
 * `active = true` filtering is enforced twice: by RLS
 * ("Public can view active books", 002_initial_rls.sql) as the real
 * security boundary, and again here for clarity/defensiveness — an
 * explicit filter also means this function still behaves correctly
 * if ever called with a client that has broader access (e.g. if
 * reused from an admin context later).
 */
export async function getActiveBooks(): Promise<CatalogueBook[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("books")
    .select("id, book_id, title, author, genre")
    .eq("active", true)
    .order("title", { ascending: true });

  if (error) {
    throw new Error(`Could not load catalogue: ${error.message}`);
  }

  return data ?? [];
}