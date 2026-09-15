import type { SupabaseClient } from "@supabase/supabase-js";
import type { PreviewResult } from "./preview";

export type ApplyResult =
  | { ok: true; newCount: number; updatedCount: number }
  | { ok: false; error: string };

/**
 * Writes the new + updated rows to `books` as a single multi-row
 * upsert (per docs/workflows.md §6.4: "all changes are applied in a
 * single atomic database transaction — either everything succeeds, or
 * nothing is applied"). A multi-row upsert compiles to one SQL
 * statement (INSERT ... ON CONFLICT DO UPDATE), which Postgres already
 * runs atomically — no separate transaction wrapper or database
 * function is needed for this guarantee.
 *
 * "Unchanged" rows are never included in the upsert payload — nothing
 * needs writing for them, and skipping them avoids bumping their
 * `updated_at` for no real change.
 *
 * "Missing" book_ids are informational only (§6.3) — this function
 * never deletes or deactivates anything on their behalf.
 *
 * Pass the authenticated admin's server-side Supabase client (not the
 * service-role client) so the existing admin RLS policies
 * (003_admin_authorization.sql) remain the real gate on this write —
 * defense in depth, consistent with the rest of the admin routes.
 */
export async function applySync(
  supabase: SupabaseClient,
  preview: Pick<PreviewResult, "newRows" | "updatedRows">,
): Promise<ApplyResult> {
  const upsertRows = [
    ...preview.newRows.map((row) => ({
      book_id: row.book_id,
      title: row.title,
      author: row.author,
      genre: row.genre,
      notes: row.notes,
      active: row.active,
    })),
    ...preview.updatedRows.map(({ row }) => ({
      book_id: row.book_id,
      title: row.title,
      author: row.author,
      genre: row.genre,
      notes: row.notes,
      active: row.active,
    })),
  ];

  if (upsertRows.length === 0) {
    return { ok: true, newCount: 0, updatedCount: 0 };
  }

  const { error } = await supabase
    .from("books")
    .upsert(upsertRows, { onConflict: "book_id" });

  if (error) {
    return { ok: false, error: error.message };
  }

  return {
    ok: true,
    newCount: preview.newRows.length,
    updatedCount: preview.updatedRows.length,
  };
}