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

/**
 * Merges and deduplicates catalogue search results from multiple
 * queries (one per searched column), sorted by title. Pure function —
 * kept separate from the Supabase call so it's testable without a DB.
 */
export function mergeCatalogueResults(
  resultSets: CatalogueBook[][],
): CatalogueBook[] {
  const merged = new Map<string, CatalogueBook>();
  for (const results of resultSets) {
    for (const book of results) {
      merged.set(book.id, book);
    }
  }
  return Array.from(merged.values()).sort((a, b) =>
    a.title.localeCompare(b.title),
  );
}

/**
 * Fetches active books for the public catalogue grid, optionally
 * filtered by a search term matched against title, author, OR genre
 * (technical-specifications.md §14).
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
 *
 * When searching, this runs three separate `ilike` queries (one per
 * column) and merges results in application code, rather than one
 * combined `.or(...)` filter. Supabase-js's `.or()` takes a raw
 * PostgREST filter string that isn't automatically escaped for
 * user input — commas/parentheses in a search term could corrupt the
 * filter's structure. Three parameterized queries avoid that
 * entirely; at this project's scale (§37: "simplicity over premature
 * optimization" for a personal/friends-only library), the extra
 * round trips are a non-issue.
 */
export async function getActiveBooks(
  searchTerm?: string,
): Promise<CatalogueBook[]> {
  const supabase = await createClient();
  const trimmed = searchTerm?.trim();

  if (!trimmed) {
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

  const pattern = `%${trimmed}%`;
  const columns = ["title", "author", "genre"] as const;

  const results = await Promise.all(
    columns.map((column) =>
      supabase
        .from("books")
        .select("id, book_id, title, author, genre")
        .eq("active", true)
        .ilike(column, pattern),
    ),
  );

  for (const result of results) {
    if (result.error) {
      throw new Error(`Could not search catalogue: ${result.error.message}`);
    }
  }

  return mergeCatalogueResults(results.map((r) => r.data ?? []));
}

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
 * Why one fetch instead of filtered database queries (as
 * getActiveBooks does for search):
 * - The volume count and the genre chips need the *whole* active
 *   catalogue regardless of the filter, so it has to be fetched anyway.
 * - Whole-genre matching on a semicolon-separated text field isn't
 *   expressible as a simple, safely-parameterised PostgREST filter.
 * - At a personal library's scale (hundreds of rows, four short text
 *   columns), filtering in memory is effectively free (§37).
 *
 * Still lean per §14/§33: only id/book_id/title/author/genre — no
 * status, covers, or loan data, which load per book in the modal.
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
