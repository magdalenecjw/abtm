export type PickerBook = {
  id: string;
  book_id: string;
  title: string;
  author: string;
};

/**
 * Filters books for the picker's search-as-you-type dropdown, by
 * title, author, or book_id code (case-insensitive substring match).
 * Pure function — fetching happens separately — so it's testable
 * without a database, and reusable across every place a book needs
 * linking (read edit form, Goodreads import preview).
 */
export function filterBooksForPicker(
  books: PickerBook[],
  query: string,
): PickerBook[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return books
    .filter((b) =>
      `${b.title} ${b.author} ${b.book_id}`.toLowerCase().includes(q),
    )
    .slice(0, 20);
}