"use server";

import { createClient } from "@/lib/supabase/server";
import { parseSpreadsheet, type SyncRow } from "@/lib/spreadsheet-sync/parse";
import {
  classifyRows,
  type ExistingBook,
  type PreviewResult,
} from "@/lib/spreadsheet-sync/preview";
import { applySync } from "@/lib/spreadsheet-sync/apply";

async function fetchExistingBooks(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<ExistingBook[]> {
  // Deliberately NOT filtered to active=true — a deactivated book must
  // still be matched/re-synced if it reappears in the spreadsheet
  // (workflows.md §6.3), so we need the full table here, unlike the
  // public catalogue query (which does filter to active books).
  const { data, error } = await supabase
    .from("books")
    .select("id, book_id, title, author, genre, notes, active");

  if (error) {
    throw new Error(`Could not read current catalogue: ${error.message}`);
  }

  return (data ?? []) as ExistingBook[];
}

export type PreviewActionResult =
  | { status: "errors"; errors: string[] }
  | { status: "preview"; rows: SyncRow[]; preview: PreviewResult };

/**
 * Step one: parse + validate the uploaded file, then classify it
 * against the current catalogue (docs/workflows.md §6.2-6.3).
 *
 * Per §6.2, any validation failure blocks the sync entirely — no
 * preview is generated in that case, just the full list of problems.
 */
export async function previewUpload(
  formData: FormData,
): Promise<PreviewActionResult> {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { status: "errors", errors: ["Please choose a file to upload."] };
  }

  const buffer = await file.arrayBuffer();
  const parseResult = await parseSpreadsheet(buffer);

  if (!parseResult.ok) {
    return { status: "errors", errors: parseResult.errors };
  }

  const supabase = await createClient();
  const existingBooks = await fetchExistingBooks(supabase);
  const preview = classifyRows(parseResult.rows, existingBooks);

  return { status: "preview", rows: parseResult.rows, preview };
}

export type ApplyActionResult =
  | {
      status: "success";
      newCount: number;
      updatedCount: number;
      unchangedCount: number;
      missingBookIds: string[];
    }
  | { status: "error"; error: string };

/**
 * Step two: re-validates against the LIVE catalogue state (not the
 * client-held preview) before writing, per §6.4 ("server re-validates
 * ... before applying"). The client only ever carries forward the
 * already-parsed rows, never its own classification — new/updated/
 * unchanged is always freshly derived here, in case the catalogue
 * changed between preview and apply.
 */
export async function applyUpload(
  rows: SyncRow[],
): Promise<ApplyActionResult> {
  const supabase = await createClient();
  const existingBooks = await fetchExistingBooks(supabase);
  const preview = classifyRows(rows, existingBooks);

  const result = await applySync(supabase, preview);

  if (!result.ok) {
    return { status: "error", error: result.error };
  }

  return {
    status: "success",
    newCount: result.newCount,
    updatedCount: result.updatedCount,
    unchangedCount: preview.unchangedCount,
    missingBookIds: preview.missingBookIds,
  };
}