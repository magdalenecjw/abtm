"use client";

import { useEffect, useState } from "react";
import { getBooksForPicker } from "./book-picker-actions";
import { filterBooksForPicker, type PickerBook } from "@/lib/book-picker/filter";

// Visual treatment intentionally deferred — see docs/visual-system.md,
// which is not yet applied here (Phase 6 of the build).
//
// Search-as-you-type by title, author, or book_id — replaces having
// to remember/type the exact book_id code by hand.
export function BookPicker({
  value,
  onChange,
  disabled,
}: {
  /** Current book_id CODE (e.g. "BK0001"), or "" for no link. */
  value: string;
  onChange: (bookIdCode: string) => void;
  disabled?: boolean;
}) {
  const [books, setBooks] = useState<PickerBook[] | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getBooksForPicker().then(setBooks);
  }, []);

  const selected = books?.find((b) => b.book_id === value) ?? null;
  const results = books ? filterBooksForPicker(books, query) : [];

  function selectBook(book: PickerBook) {
    onChange(book.book_id);
    setQuery("");
    setOpen(false);
  }

  function clear() {
    onChange("");
    setQuery("");
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={
          open
            ? query
            : selected
              ? `${selected.title} (${selected.book_id})`
              : value
        }
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search by title, author, or book_id"
        disabled={disabled || books === null}
        className="search-input"
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          disabled={disabled}
          className="text-link text-sm ml-2"
        >
          Clear
        </button>
      )}
      {open && results.length > 0 && (
        <ul className="absolute z-10 bg-[var(--background)] border border-[var(--rule)] rounded-[3px] max-h-48 overflow-auto w-64">
          {results.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => selectBook(b)}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-[var(--spine-light)]"
              >
                {b.title} — {b.author} ({b.book_id})
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}