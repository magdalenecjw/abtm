"use server";

import { createClient } from "@/lib/supabase/server";
import type { PickerBook } from "@/lib/book-picker/filter";

/**
 * Fetches all books for the picker's client-side search. Fetched
 * once and filtered in the browser as the admin types, rather than a
 * server round-trip per keystroke — reasonable at this project's
 * personal-library scale (technical-specifications.md §37).
 */
export async function getBooksForPicker(): Promise<PickerBook[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("books")
    .select("id, book_id, title, author")
    .order("title", { ascending: true });

  if (error) {
    throw new Error(`Could not load books: ${error.message}`);
  }

  return data ?? [];
}