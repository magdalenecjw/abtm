import { createClient } from "@/lib/supabase/server";
import {
  filterCatalogue,
  genreKey,
  rankGenres,
  type RankedGenre,
} from "./genres";

export type CatalogueBook = {
  id: string;
  book_id: string;
  title: string;
  author: string;
  genre: string;
};

export type Catalogue = {
  /** Active books matching the current search and genre filter, sorted by title. */
  books: CatalogueBook[];
  /** Total number of active books, ignoring any filter — the hero's "97 volumes". */
  totalVolumes: number;
  /** Every genre across ALL active books, most common first (for the chips). */
  genres: RankedGenre[];
  /**
   * The selected genre, spelled as it appears in the catalogue — or
   * null if none was requested, or the requested genre no longer
   * exists (e.g. an old shared link), in which case no genre filter
   * is applied.
   */
  selectedGenre: string | null;
  /** True when a search term and/or genre filter is narrowing the list. */
  isFiltered: boolean;
};

/**
 * Loads the public catalogue page's data in one query: all active
 * books, then search + genre filtering in application code on the
 * server (technical-specifications.md §14.2–14.3, §33).
 *
 * Why one fetch instead of filtered database queries (the previous
 * approach ran one `ilike` query per searched column):
 * - The volume count and the genre chips need the *whole* active
 *   catalogue regardless of the filter, so it has to be fetched anyway.
 * - Whole-genre matching on a semicolon-separated text field isn't
 *   expressible as a simple, safely-parameterised PostgREST filter.
 * - At a personal library's scale (hundreds of rows, four short text
 *   columns), filtering in memory is effectively free (§37).
 *
 * Still lean per §14/§33: only id/book_id/title/author/genre — no
 * status, covers, or loan data, which load per book in the modal.
 *
 * `active = true` is enforced twice: by RLS ("Public can view active
 * books", 002_initial_rls.sql) as the real security boundary, and by
 * the explicit filter below so this stays correct even if called with
 * a client that has broader access.
 */
export async function getCatalogue({
  q,
  genre,
}: {
  q?: string;
  genre?: string;
}): Promise<Catalogue> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("books")
    .select("id, book_id, title, author, genre")
    .eq("active", true)
    .order("title", { ascending: true });

  if (error) {
    throw new Error(`Could not load catalogue: ${error.message}`);
  }

  const all: CatalogueBook[] = data ?? [];
  const genres = rankGenres(all);

  const requestedKey = genre ? genreKey(genre) : "";
  const selectedGenre = requestedKey
    ? (genres.find((g) => genreKey(g.name) === requestedKey)?.name ?? null)
    : null;

  const term = q?.trim() ?? "";
  const books = filterCatalogue(all, {
    q: term,
    genre: selectedGenre ?? undefined,
  });

  return {
    books,
    totalVolumes: all.length,
    genres,
    selectedGenre,
    isFiltered: term.length > 0 || selectedGenre !== null,
  };
}
