/**
 * Pure helpers for the public "Transaction history" page
 * (visual-system.md §12, ui-specification.md §1.2). No Supabase or
 * Next.js imports, so they can be tested on their own.
 */

export type RatingDot = "full" | "half" | "empty";

/**
 * Turns a rating into five dots (visual-system.md §12.2): one full dot
 * per whole point, a half dot for a half point. Ratings are rounded to
 * the nearest half and kept within 0–5, so a hand-edited 4.3 shows as
 * 4.5 and an out-of-range value can't break the row.
 */
export function ratingDots(rating: number): RatingDot[] {
  const rounded = Math.min(5, Math.max(0, Math.round(rating * 2) / 2));
  return Array.from({ length: 5 }, (_, i) => {
    if (rounded >= i + 1) return "full";
    if (rounded >= i + 0.5) return "half";
    return "empty";
  });
}

/** Rating as a readable label, e.g. "Rated 4.5 out of 5". */
export function ratingLabel(rating: number): string {
  const rounded = Math.min(5, Math.max(0, Math.round(rating * 2) / 2));
  return `Rated ${rounded} out of 5`;
}

/**
 * The hero count (visual-system.md §12.1): one per entry, so a re-read
 * counts again — "42 books read", "1 book read".
 */
export function formatReadCount(count: number): string {
  return `${count} ${count === 1 ? "book" : "books"} read`;
}
