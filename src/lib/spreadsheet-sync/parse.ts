import ExcelJS from "exceljs";

export const REQUIRED_COLUMNS = [
  "book_id",
  "title",
  "author",
  "genre",
  "active",
] as const;

export type SyncRow = {
  rowNumber: number;
  book_id: string;
  title: string;
  author: string;
  genre: string;
  notes: string | null;
  active: boolean;
};

export type ParseResult =
  | { ok: true; rows: SyncRow[] }
  | { ok: false; errors: string[] };

function parseActiveValue(raw: unknown): boolean | null {
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "string") {
    const normalized = raw.trim().toUpperCase();
    if (normalized === "TRUE") return true;
    if (normalized === "FALSE") return false;
  }
  return null;
}

/** Coerces an ExcelJS cell value (string, number, rich text, etc.) to plain trimmed text. */
function cellText(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "string") return raw.trim();
  if (typeof raw === "number") return String(raw);
  if (typeof raw === "object") {
    if ("text" in raw && typeof raw.text === "string") return raw.text.trim();
    if ("richText" in raw && Array.isArray(raw.richText)) {
      return raw.richText
        .map((part) => (typeof part.text === "string" ? part.text : ""))
        .join("")
        .trim();
    }
  }
  return String(raw).trim();
}

/**
 * Parses and validates an uploaded catalogue spreadsheet, per
 * docs/workflows.md §6.1-6.2.
 *
 * All validation failures across the ENTIRE file are collected and
 * returned together (not just the first one found), so the admin can
 * fix everything in one pass before re-uploading — per §6.2's explicit
 * requirement, this function never short-circuits on the first error.
 *
 * Column matching is case-insensitive on header names (a defensive
 * convenience beyond what the spec strictly requires) — `active`
 * values are case-insensitive per §6.1.
 */
export async function parseSpreadsheet(
  buffer: ArrayBuffer,
): Promise<ParseResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return {
      ok: false,
      errors: ["The uploaded file has no worksheet to read."],
    };
  }

  // Map header name -> column index (ExcelJS columns are 1-indexed).
  const headerRow = worksheet.getRow(1);
  const columnIndexByName = new Map<string, number>();
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const name = cellText(cell.value).toLowerCase();
    if (name) columnIndexByName.set(name, colNumber);
  });

  const errors: string[] = [];

  for (const column of REQUIRED_COLUMNS) {
    if (!columnIndexByName.has(column)) {
      errors.push(`Missing required column: \`${column}\`.`);
    }
  }

  // If nothing at all was recognized as a header, there's no sound way
  // to read rows — bail out early rather than produce a flood of
  // confusing per-row errors.
  if (columnIndexByName.size === 0) {
    return { ok: false, errors };
  }

  const rows: SyncRow[] = [];
  const seenBookIds = new Map<string, number>(); // book_id -> first row seen

  const lastRow = worksheet.rowCount;
  for (let rowNumber = 2; rowNumber <= lastRow; rowNumber++) {
    const row = worksheet.getRow(rowNumber);

    const getField = (col: string) => {
      const idx = columnIndexByName.get(col);
      if (!idx) return "";
      return cellText(row.getCell(idx).value);
    };

    const book_id = getField("book_id");
    const title = getField("title");
    const author = getField("author");
    const genre = getField("genre");
    const notesRaw = columnIndexByName.has("notes") ? getField("notes") : "";
    const activeIdx = columnIndexByName.get("active");
    const activeRaw = activeIdx ? row.getCell(activeIdx).value : undefined;

    // Skip entirely blank rows (ExcelJS can report trailing empty rows
    // at the end of a sheet) rather than reporting a wall of "missing
    // value" errors for rows the admin never meant to fill in.
    const allBlank =
      !book_id && !title && !author && !genre && activeRaw == null;
    if (allBlank) continue;

    for (const [field, value] of [
      ["book_id", book_id],
      ["title", title],
      ["author", author],
      ["genre", genre],
    ] as const) {
      if (columnIndexByName.has(field) && !value) {
        errors.push(`Row ${rowNumber} is missing a value for \`${field}\`.`);
      }
    }

    let active: boolean | null = null;
    if (columnIndexByName.has("active")) {
      active = parseActiveValue(activeRaw);
      if (active === null) {
        errors.push(`Row ${rowNumber}: \`active\` must be TRUE or FALSE.`);
      }
    }

    if (book_id) {
      const firstSeenRow = seenBookIds.get(book_id);
      if (firstSeenRow) {
        errors.push(
          `Duplicate \`book_id\` found: \`${book_id}\` appears on rows ${firstSeenRow} and ${rowNumber}.`,
        );
      } else {
        seenBookIds.set(book_id, rowNumber);
      }
    }

    rows.push({
      rowNumber,
      book_id,
      title,
      author,
      genre,
      notes: notesRaw || null,
      active: active ?? false,
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, rows };
}