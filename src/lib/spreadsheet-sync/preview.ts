import type { SyncRow } from "./parse";

/** The subset of a `books` row needed to compare against a spreadsheet row. */
export type ExistingBook = {
  id: string; // internal UUID, needed later for the update/upsert call
  book_id: string;
  title: string;
  author: string;
  genre: string;
  notes: string | null;
  active: boolean;
};

const COMPARABLE_FIELDS = [
  "title",
  "author",
  "genre",
  "notes",
  "active",
] as const;
type ComparableField = (typeof COMPARABLE_FIELDS)[number];

export type FieldDiff = {
  field: ComparableField;
  oldValue: string;
  newValue: string;
};

export type PreviewResult = {
  newRows: SyncRow[];
  updatedRows: { existingId: string; row: SyncRow; diffs: FieldDiff[] }[];
  unchangedCount: number;
  /** book_ids present in the DB but absent from this upload — informational only, no action attached (§6.3). */
  missingBookIds: string[];
};

/** Formats a field value consistently for display in a diff, regardless of its underlying type. */
function displayValue(value: string | boolean | null): string {
  if (value === null || value === "") return "(empty)";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  return value;
}

function diffFields(existing: ExistingBook, incoming: SyncRow): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  for (const field of COMPARABLE_FIELDS) {
    const oldRaw = existing[field];
    const newRaw = incoming[field];
    if (oldRaw !== newRaw) {
      diffs.push({
        field,
        oldValue: displayValue(oldRaw),
        newValue: displayValue(newRaw),
      });
    }
  }
  return diffs;
}

/**
 * Classifies validated spreadsheet rows against the current `books` table,
 * per docs/workflows.md §6.3.
 *
 * This is a pure function — it does not query the database itself. The
 * caller fetches `existingBooks` (all books, active or not — deactivated
 * books can still be re-synced) and `parsedRows` (from parseSpreadsheet,
 * Step 1), then hands both to this function.
 */
export function classifyRows(
  parsedRows: SyncRow[],
  existingBooks: ExistingBook[],
): PreviewResult {
  const existingByBookId = new Map(existingBooks.map((b) => [b.book_id, b]));
  const seenBookIds = new Set<string>();

  const newRows: SyncRow[] = [];
  const updatedRows: PreviewResult["updatedRows"] = [];
  let unchangedCount = 0;

  for (const row of parsedRows) {
    seenBookIds.add(row.book_id);
    const existing = existingByBookId.get(row.book_id);

    if (!existing) {
      newRows.push(row);
      continue;
    }

    const diffs = diffFields(existing, row);
    if (diffs.length === 0) {
      unchangedCount++;
    } else {
      updatedRows.push({ existingId: existing.id, row, diffs });
    }
  }

  const missingBookIds = existingBooks
    .filter((b) => !seenBookIds.has(b.book_id))
    .map((b) => b.book_id);

  return { newRows, updatedRows, unchangedCount, missingBookIds };
}