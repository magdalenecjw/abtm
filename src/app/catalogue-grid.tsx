"use client";

import { useEffect, useState, useTransition } from "react";
import { getSpineTitle } from "@/lib/catalogue/spine-title";
import { getBookDetail, type BookDetail } from "./actions";
import type { CatalogueBook } from "@/lib/catalogue/books";

const STATUS_LABEL: Record<BookDetail["status"], string> = {
  available: "Available",
  checked_out: "Checked out",
  on_loan: "On loan",
};

// Visual treatment intentionally deferred — see docs/visual-system.md,
// which is not yet applied here (Phase 6 of the build). Structural/
// behavioral only: this does implement the specific, concrete
// closing-behavior rule from visual-system.md §6 (click-outside and
// Escape close the details view), since that's a behavior spec, not
// a visual one.
export function CatalogueGrid({ books }: { books: CatalogueBook[] }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<BookDetail | null>(null);
  const [isPending, startTransition] = useTransition();

  function openBook(id: string) {
    setOpen(true);
    setSelected(null);
    startTransition(async () => {
      const detail = await getBookDetail(id);
      setSelected(detail);
    });
  }

  function close() {
    setOpen(false);
    setSelected(null);
  }

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <ul className="flex flex-wrap gap-4 list-none p-0">
        {books.map((book) => (
          <li key={book.id}>
            <button
              type="button"
              onClick={() => openBook(book.id)}
              className="flex items-end justify-center w-24 h-40 border border-gray-400 p-2 text-center text-sm"
            >
              {getSpineTitle(book.title)}
            </button>
          </li>
        ))}
      </ul>

      {open && (
        <div
          role="presentation"
          onClick={close}
          className="fixed inset-0 flex items-center justify-center bg-black/50 p-4"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Book details"
            onClick={(e) => e.stopPropagation()}
            className="bg-white max-w-md w-full p-6 relative"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute top-2 right-2"
            >
              ×
            </button>

            {isPending && <p>Loading…</p>}

            {!isPending && selected === null && (
              <p>This book could not be found.</p>
            )}

            {selected && (
              <div>
                <h2 className="text-xl mb-1">{selected.title}</h2>
                <p className="mb-1">By {selected.author}</p>
                <p className="mb-1">{selected.genre}</p>
                {selected.notes && <p className="mb-3">{selected.notes}</p>}

                <p className="font-medium">
                  {STATUS_LABEL[selected.status]}
                </p>

                {selected.status === "available" && (
                  // Request-to-borrow flow (passcode gate, request
                  // form) is a separate, later step (Phase 4) — this
                  // is a deliberate placeholder, not wired up yet.
                  <button type="button" disabled>
                    Request to borrow (coming soon)
                  </button>
                )}

                {selected.status === "on_loan" &&
                  selected.currentBorrowerNickname && (
                    <p>
                      On loan to {selected.currentBorrowerNickname}
                      {selected.loanStartedAt &&
                        ` since ${selected.loanStartedAt}`}
                    </p>
                  )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}