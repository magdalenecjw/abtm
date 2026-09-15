"use server";

import { createClient } from "@/lib/supabase/server";
import { validateCoverFile } from "@/lib/covers/validate";
import {
  matchCoverFiles,
  stripExtension,
  type BookForMatching,
  type CoverFileMatch,
} from "@/lib/covers/match";
import { processCoverImage } from "@/lib/covers/resize";

async function getBooksForCoverMatching(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<BookForMatching[]> {
  const { data: books, error: booksError } = await supabase
    .from("books")
    .select("id, book_id");

  if (booksError) {
    throw new Error(`Could not read catalogue: ${booksError.message}`);
  }

  const { data: covers, error: coversError } = await supabase
    .from("book_covers")
    .select("book_id");

  if (coversError) {
    throw new Error(`Could not read covers: ${coversError.message}`);
  }

  const coveredIds = new Set((covers ?? []).map((c) => c.book_id));

  return (books ?? []).map((b) => ({
    id: b.id,
    book_id: b.book_id,
    hasCover: coveredIds.has(b.id),
  }));
}

/**
 * Preview step: classifies filenames (extensions already stripped by
 * the caller) against the current catalogue, per workflows.md §8.4.
 * No files are uploaded yet — this only needs filenames, not bytes.
 */
export async function previewCoverMatch(
  filenamesWithoutExtension: string[],
): Promise<CoverFileMatch[]> {
  const supabase = await createClient();
  const books = await getBooksForCoverMatching(supabase);
  return matchCoverFiles(filenamesWithoutExtension, books);
}

export type CoverApplyResult = {
  filename: string;
  ok: boolean;
  reason?: string;
};

/**
 * Apply step: re-validates and re-matches each file against the LIVE
 * catalogue (not the client-held preview — same re-validation pattern
 * used for spreadsheet sync), then resizes/re-encodes and uploads.
 *
 * Per-file independence (workflows.md §8.5): each file succeeds or
 * fails on its own — one bad file never blocks or rolls back the
 * others. This is a deliberate departure from the atomic-transaction
 * pattern used for spreadsheet sync/Goodreads import: those are pure
 * database writes, but this also involves external Storage writes
 * that can't be rolled back the same way.
 */
export async function applyCovers(
  formData: FormData,
): Promise<CoverApplyResult[]> {
  const supabase = await createClient();
  const books = await getBooksForCoverMatching(supabase);

  const files = formData.getAll("files").filter((f) => f instanceof File);
  const results: CoverApplyResult[] = [];

  for (const file of files) {
    try {
      const validationError = validateCoverFile({
        name: file.name,
        size: file.size,
        type: file.type,
      });
      if (validationError) {
        results.push({ filename: file.name, ok: false, reason: validationError });
        continue;
      }

      const [match] = matchCoverFiles([stripExtension(file.name)], books);
      if (match.status === "unmatched" || !match.bookUuid || !match.bookIdCode) {
        results.push({
          filename: file.name,
          ok: false,
          reason: "No matching book_id in the catalogue.",
        });
        continue;
      }

      const inputBuffer = Buffer.from(await file.arrayBuffer());
      const processedBuffer = await processCoverImage(inputBuffer);
      const storagePath = `${match.bookIdCode}.webp`;

      const { error: uploadError } = await supabase.storage
        .from("covers")
        .upload(storagePath, processedBuffer, {
          contentType: "image/webp",
          upsert: true,
        });

      if (uploadError) {
        results.push({
          filename: file.name,
          ok: false,
          reason: `Upload failed: ${uploadError.message}`,
        });
        continue;
      }

      const { error: dbError } = await supabase.from("book_covers").upsert(
        {
          book_id: match.bookUuid,
          storage_path: storagePath,
          uploaded_at: new Date().toISOString(),
        },
        { onConflict: "book_id" },
      );

      if (dbError) {
        results.push({
          filename: file.name,
          ok: false,
          reason: `Saved image but failed to record it: ${dbError.message}`,
        });
        continue;
      }

      results.push({ filename: file.name, ok: true });
    } catch (err) {
      results.push({
        filename: file.name,
        ok: false,
        reason: err instanceof Error ? err.message : "Unknown error.",
      });
    }
  }

  return results;
}