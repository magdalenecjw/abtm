/**
 * Pure helpers for the catalogue's genre filter and search, per
 * technical-specifications.md §14.2–14.3 and visual-system.md §10.
 *
 * Kept free of any Supabase/Next.js imports (same pattern as
 * src/lib/borrowing/filter-requests.ts) so they can be exercised
 * without a database or a request context.
 */

/** Minimal shape these helpers need — CatalogueBook satisfies it. */
type GenreBearing = { genre: string };
type Searchable = { title: string; author: string; genre: string };

/** How many genre chips are shown before "More" (visual-system.md §10). */
export const TOP_GENRE_COUNT = 5;

export type RankedGenre = {
  /** Display name — the spelling first seen in the catalogue. */
  name: string;
  /** Number of active books carrying this genre. */
  count: number;
};

/**
 * Comparison key for genres: Unicode-normalised, trimmed, lowercased,
 * with internal runs of whitespace collapsed — so "Historical  Fiction"
 * and "historical fiction" are treated as the same genre.
 */
export function genreKey(genre: string): string {
  return genre.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Splits a book's genre field into its individual genres.
 *
 * The spreadsheet stores one or more genres separated by semicolons
 * (technical-specifications.md §14.3, §16), e.g.
 * "Fiction; Historical Fiction" → ["Fiction", "Historical Fiction"].
 * Parts are trimmed; empty parts (e.g. a trailing ";") are dropped;
 * a genre repeated within the same field is kept only once.
 */
export function splitGenres(genreField: string | null | undefined): string[] {
  if (!genreField) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of genreField.split(";")) {
    const name = part.trim().replace(/\s+/g, " ");
    if (!name) continue;
    const key = genreKey(name);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(name);
  }
  return result;
}

/**
 * Ranks every genre across the given books by how many books carry it
 * (most first), ties broken alphabetically — this ordering decides
 * which five chips show before "More" (visual-system.md §10).
 *
 * Genres are merged case-insensitively; the display name is the first
 * spelling encountered.
 */
export function rankGenres(books: GenreBearing[]): RankedGenre[] {
  const byKey = new Map<string, RankedGenre>();
  for (const book of books) {
    for (const name of splitGenres(book.genre)) {
      const key = genreKey(name);
      const existing = byKey.get(key);
      if (existing) existing.count += 1;
      else byKey.set(key, { name, count: 1 });
    }
  }
  return Array.from(byKey.values()).sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name),
  );
}

/**
 * Splits ranked genres into the chips shown up front and the ones
 * tucked under "More". Within "More", genres are listed alphabetically
 * (visual-system.md §10) since their rank no longer matters there.
 */
export function partitionGenres(
  ranked: RankedGenre[],
  topCount: number = TOP_GENRE_COUNT,
): { top: RankedGenre[]; more: RankedGenre[] } {
  const top = ranked.slice(0, topCount);
  const more = ranked
    .slice(topCount)
    .sort((a, b) => a.name.localeCompare(b.name));
  return { top, more };
}

/**
 * True if the book lists `genre` as one of its genres — a whole-genre,
 * case-insensitive match. "Fiction" does NOT match a book whose only
 * genre is "Historical Fiction" (technical-specifications.md §14.3).
 */
export function hasGenre(book: GenreBearing, genre: string): boolean {
  const wanted = genreKey(genre);
  if (!wanted) return true;
  return splitGenres(book.genre).some((g) => genreKey(g) === wanted);
}

/**
 * True if the search term appears anywhere in the title, author, or
 * genre field — case-insensitive substring match, same behaviour as
 * the previous database `ilike` search (technical-specifications.md
 * §14.2). An empty term matches everything.
 *
 * Unlike `ilike`, "%" and "_" in the search box are treated as plain
 * characters rather than wildcards.
 */
export function matchesSearch(book: Searchable, term: string): boolean {
  const needle = term.normalize("NFC").trim().toLowerCase();
  if (!needle) return true;
  return [book.title, book.author, book.genre].some((value) =>
    value.normalize("NFC").toLowerCase().includes(needle),
  );
}

/**
 * Applies the catalogue's search and genre filter together (both must
 * match), preserving the input order.
 */
export function filterCatalogue<T extends Searchable>(
  books: T[],
  { q, genre }: { q?: string; genre?: string },
): T[] {
  return books.filter(
    (book) =>
      matchesSearch(book, q ?? "") && (!genre || hasGenre(book, genre)),
  );
}

/**
 * The hero's volume count (visual-system.md §9.2): "97 volumes", or
 * "12 of 97 volumes" while a search or genre filter is active.
 */
export function formatVolumeCount(
  shown: number,
  total: number,
  isFiltered: boolean,
): string {
  const noun = total === 1 ? "volume" : "volumes";
  return isFiltered ? `${shown} of ${total} ${noun}` : `${total} ${noun}`;
}
