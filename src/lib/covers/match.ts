export type BookForMatching = {
  /** Internal UUID (books.id) — used for the book_covers foreign key. */
  id: string;
  /** Human-readable code (books.book_id), e.g. "BK0001" — what the filename must match. */
  book_id: string;
  hasCover: boolean;
};

export type CoverFileMatch = {
  filename: string;
  status: "new" | "replacement" | "unmatched";
  bookUuid: string | null;
  bookIdCode: string | null;
};

/**
 * Matches uploaded filenames (extension already stripped) against
 * existing books by their book_id CODE (e.g. "BK0001"), per
 * workflows.md §8.2 ("exact match, case-sensitive, no fuzzy
 * matching") and classifies each into the three §8.4 preview
 * categories.
 *
 * Pure function — no I/O — so it's identically usable for the preview
 * step and, re-run, as a re-validation step at apply time (same
 * "don't trust client-held classification" pattern used for
 * spreadsheet sync).
 */
export function matchCoverFiles(
  filenamesWithoutExtension: string[],
  books: BookForMatching[],
): CoverFileMatch[] {
  const bookByCode = new Map(books.map((b) => [b.book_id, b]));

  return filenamesWithoutExtension.map((filename) => {
    const book = bookByCode.get(filename);

    if (!book) {
      return {
        filename,
        status: "unmatched",
        bookUuid: null,
        bookIdCode: null,
      };
    }

    return {
      filename,
      status: book.hasCover ? "replacement" : "new",
      bookUuid: book.id,
      bookIdCode: book.book_id,
    };
  });
}

/** Strips a file's extension to get the name to match against book_id. */
export function stripExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  return lastDot === -1 ? filename : filename.slice(0, lastDot);
}