import type { GoodreadsRow } from "./parse";

export type BookForGoodreadsMatching = {
  id: string; // internal UUID
  book_id: string; // human-readable code
  title: string;
  author: string;
};

export type GoodreadsMatchResult = {
  row: GoodreadsRow;
  /** Already in `reads` (matched on goodreads_id) — excluded from the actionable list, count-only per §7.2. */
  isDuplicate: boolean;
  /** Set only when exactly one book matches — zero or multiple matches both mean "no auto-link" (§7.3, treated identically, no separate "ambiguous" state). */
  matchedBook: BookForGoodreadsMatching | null;
};

/**
 * Normalizes text for catalogue matching, per workflows.md §7.3:
 * lowercase, trim, strip punctuation. Deliberately simple — no
 * prefix-stripping or subtitle/edition tolerance, since anything
 * uncertain falls through to manual review anyway.
 */
export function normalizeForMatching(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ");
}

/**
 * Matches parsed Goodreads rows against duplicate detection
 * (goodreads_id) and catalogue matching (normalized title+author),
 * per workflows.md §7.2-7.3. Pure function — DB fetching happens
 * separately in the caller.
 */
export function matchGoodreadsRows(
  rows: GoodreadsRow[],
  existingGoodreadsIds: Set<string>,
  books: BookForGoodreadsMatching[],
): GoodreadsMatchResult[] {
  const byNormalizedKey = new Map<string, BookForGoodreadsMatching[]>();
  for (const book of books) {
    const key = `${normalizeForMatching(book.title)}|${normalizeForMatching(book.author)}`;
    const list = byNormalizedKey.get(key) ?? [];
    list.push(book);
    byNormalizedKey.set(key, list);
  }

  return rows.map((row) => {
    const isDuplicate = existingGoodreadsIds.has(row.goodreadsId);
    if (isDuplicate) {
      return { row, isDuplicate, matchedBook: null };
    }

    const key = `${normalizeForMatching(row.title)}|${normalizeForMatching(row.author)}`;
    const candidates = byNormalizedKey.get(key) ?? [];
    const matchedBook = candidates.length === 1 ? candidates[0] : null;

    return { row, isDuplicate: false, matchedBook };
  });
}