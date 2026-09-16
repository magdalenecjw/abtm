"use server";

import { createClient } from "@/lib/supabase/server";
import { parseGoodreadsCsv } from "@/lib/goodreads/parse";
import {
  matchGoodreadsRows,
  type GoodreadsMatchResult,
  type BookForGoodreadsMatching,
} from "@/lib/goodreads/match";

export type PreviewGoodreadsResult =
  | { status: "errors"; errors: string[] }
  | {
      status: "preview";
      toImport: GoodreadsMatchResult[];
      alreadyImportedCount: number;
    };

/**
 * Preview step: parse + filter (workflows.md §7.1), then classify
 * against duplicates and the catalogue (§7.2-7.3).
 */
export async function previewGoodreadsImport(
  formData: FormData,
): Promise<PreviewGoodreadsResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "errors", errors: ["Please choose a file to upload."] };
  }

  const csvText = await file.text();
  const parseResult = parseGoodreadsCsv(csvText);
  if (!parseResult.ok) {
    return { status: "errors", errors: parseResult.errors };
  }

  const supabase = await createClient();

  const { data: existingReads, error: readsError } = await supabase
    .from("reads")
    .select("goodreads_id")
    .not("goodreads_id", "is", null);

  if (readsError) {
    return {
      status: "errors",
      errors: [`Could not check for duplicates: ${readsError.message}`],
    };
  }

  const existingGoodreadsIds = new Set(
    (existingReads ?? [])
      .map((r) => r.goodreads_id)
      .filter((id): id is string => id !== null),
  );

  const { data: books, error: booksError } = await supabase
    .from("books")
    .select("id, book_id, title, author");

  if (booksError) {
    return {
      status: "errors",
      errors: [`Could not read catalogue: ${booksError.message}`],
    };
  }

  const matches = matchGoodreadsRows(
    parseResult.rows,
    existingGoodreadsIds,
    (books ?? []) as BookForGoodreadsMatching[],
  );

  const toImport = matches.filter((m) => !m.isDuplicate);
  const alreadyImportedCount = matches.length - toImport.length;

  return { status: "preview", toImport, alreadyImportedCount };
}

export type GoodreadsApplyRow = {
  goodreadsId: string;
  title: string;
  author: string;
  dateRead: string | null;
  rating: number | null;
  notes: string | null;
  source: "" | "Owned" | "NLB";
  bookIdCode: string; // required if source === "Owned"
};

export type GoodreadsApplyResult =
  | { ok: true; importedCount: number; alreadyImportedCount: number }
  | { ok: false; error: string };

/**
 * Apply step, per workflows.md §7.5: applies the CURRENT EDITED
 * STATE of each row (not the raw parsed CSV), in a single atomic
 * insert (one multi-row INSERT is one SQL statement — same reasoning
 * as spreadsheet sync's upsert). Re-checks duplicates against live
 * state first (defensive re-validation, same pattern used
 * throughout this app), rather than trusting the client-held preview.
 */
export async function applyGoodreadsImport(
  rows: GoodreadsApplyRow[],
): Promise<GoodreadsApplyResult> {
  const supabase = await createClient();

  const { data: existing, error: existingError } = await supabase
    .from("reads")
    .select("goodreads_id")
    .in(
      "goodreads_id",
      rows.map((r) => r.goodreadsId),
    );

  if (existingError) {
    return {
      ok: false,
      error: `Could not verify duplicates: ${existingError.message}`,
    };
  }

  const existingIds = new Set(
    (existing ?? []).map((e) => e.goodreads_id),
  );
  const freshRows = rows.filter((r) => !existingIds.has(r.goodreadsId));
  const alreadyImportedCount = rows.length - freshRows.length;

  if (freshRows.length === 0) {
    return { ok: true, importedCount: 0, alreadyImportedCount };
  }

  const insertRows: {
    goodreads_id: string;
    title: string;
    author: string;
    date_read: string | null;
    rating: number | null;
    notes: string | null;
    source: "Owned" | "NLB" | null;
    book_id: string | null;
  }[] = [];

  for (const row of freshRows) {
    let bookUuid: string | null = null;
    let finalTitle = row.title;
    let finalAuthor = row.author;

    if (row.source === "Owned") {
      const trimmedCode = row.bookIdCode.trim();
      if (!trimmedCode) {
        return {
          ok: false,
          error: `"${row.title}" is marked Owned but has no linked book_id.`,
        };
      }

      const { data: book, error: bookError } = await supabase
        .from("books")
        .select("id, title, author")
        .eq("book_id", trimmedCode)
        .maybeSingle();

      if (bookError || !book) {
        return {
          ok: false,
          error: `No book found with book_id "${trimmedCode}" for "${row.title}".`,
        };
      }

      bookUuid = book.id;
      // Linking a book switches title/author to the books table
      // values, per workflows.md §7.3/§7.4 — even if this row was
      // linked manually to a different book than the CSV title
      // suggested.
      finalTitle = book.title;
      finalAuthor = book.author;
    }

    insertRows.push({
      goodreads_id: row.goodreadsId,
      title: finalTitle,
      author: finalAuthor,
      date_read: row.dateRead,
      rating: row.rating,
      notes: row.notes,
      source: row.source || null,
      book_id: bookUuid,
    });
  }

  const { error: insertError } = await supabase
    .from("reads")
    .insert(insertRows);

  if (insertError) {
    return {
      ok: false,
      error: `Something went wrong: ${insertError.message}`,
    };
  }

  return {
    ok: true,
    importedCount: insertRows.length,
    alreadyImportedCount,
  };
}