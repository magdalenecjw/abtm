import Papa from "papaparse";

export type GoodreadsRow = {
  goodreadsId: string;
  title: string;
  author: string;
  dateRead: string | null; // ISO yyyy-mm-dd
  rating: number | null;
  notes: string | null;
};

export type ParseGoodreadsResult =
  | { ok: true; rows: GoodreadsRow[] }
  | { ok: false; errors: string[] };

const REQUIRED_COLUMNS = ["Book Id", "Title", "Author", "Exclusive Shelf"];

/** Goodreads exports "Date Read" as YYYY/MM/DD; returns null for blank/unparseable values. */
function parseGoodreadsDate(raw: string): string | null {
  if (!raw || !raw.trim()) return null;
  const match = raw.trim().match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (!match) return null;
  const [, y, m, d] = match;
  return `${y}-${m}-${d}`;
}

/**
 * Parses a Goodreads library export CSV, per workflows.md §7.1.
 *
 * Row filtering is silent, per the spec: only rows where
 * Exclusive Shelf = "read" are kept — no count or message is shown
 * for the excluded rows (want-to-read, currently-reading, etc.).
 *
 * "My Rating" of 0 is Goodreads' convention for "no rating given",
 * so it's treated as null here rather than a literal zero rating.
 */
export function parseGoodreadsCsv(csvText: string): ParseGoodreadsResult {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0) {
    return {
      ok: false,
      errors: result.errors.map(
        (e) => `Row ${e.row ?? "?"}: ${e.message}`,
      ),
    };
  }

  const headers = result.meta.fields ?? [];
  const missing = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
  if (missing.length > 0) {
    return {
      ok: false,
      errors: missing.map((col) => `Missing required column: \`${col}\`.`),
    };
  }

  const readRows = result.data.filter(
    (row) => (row["Exclusive Shelf"] ?? "").trim().toLowerCase() === "read",
  );

  const rows: GoodreadsRow[] = readRows
    .filter((row) => row["Book Id"]?.trim() && row["Title"]?.trim())
    .map((row) => {
      const ratingRaw = row["My Rating"]?.trim();
      const rating =
        ratingRaw && Number(ratingRaw) > 0 ? Number(ratingRaw) : null;

      return {
        goodreadsId: row["Book Id"].trim(),
        title: row["Title"].trim(),
        author: (row["Author"] ?? "").trim(),
        dateRead: parseGoodreadsDate(row["Date Read"] ?? ""),
        rating,
        notes: row["My Review"]?.trim() || null,
      };
    });

  return { ok: true, rows };
}