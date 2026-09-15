"use client";

import { useEffect, useState, useTransition } from "react";
import { getSpineTitle } from "@/lib/catalogue/spine-title";
import { getBookDetail, type BookDetail } from "./actions";
import type { CatalogueBook } from "@/lib/catalogue/books";
import { BorrowFlow, type BorrowStep } from "./borrow-flow";

const STATUS_LABEL: Record<BookDetail["status"], string> = {
  available: "Available",
  checked_out: "Checked out",
  on_loan: "On loan",
};

type ModalView = "details" | "borrowing";

// Visual treatment intentionally deferred — see docs/visual-system.md,
// which is not yet applied here (Phase 6 of the build). Behavioral
// rule that IS implemented: visual-system.md §6's closing-behavior
// spec — click-outside/Escape close the details view, but are
// disabled during the passcode/form borrowing steps (in-progress
// data at risk), leaving only the explicit × button.
export function CatalogueGrid({ books }: { books: CatalogueBook[] }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<BookDetail | null>(null);
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useState<ModalView>("details");
  const [blockEasyClose, setBlockEasyClose] = useState(false);

  function openBook(id: string) {
    setOpen(true);
    setSelected(null);
    setView("details");
    setBlockEasyClose(false);
    startTransition(async () => {
      const detail = await getBookDetail(id);
      setSelected(detail);
    });
  }

  function close() {
    if (blockEasyClose) return;
    setOpen(false);
    setSelected(null);
    setView("details");
  }

  function forceClose() {
    setOpen(false);
    setSelected(null);
    setView("details");
  }

  function handleBorrowStepChange(step: BorrowStep) {
    setBlockEasyClose(step === "passcode" || step === "form");
  }

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- close() reads blockEasyClose via closure; re-subscribing on that change is the point
  }, [open, blockEasyClose]);

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
              onClick={forceClose}
              aria-label="Close"
              className="absolute top-2 right-2"
            >
              ×
            </button>

            {view === "details" && (
              <>
                {isPending && <p>Loading…</p>}

                {!isPending && selected === null && (
                  <p>This book could not be found.</p>
                )}

                {selected && (
                  <div>
                    {selected.coverUrl && (
                      // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, not a local/optimizable asset
                      <img
                        src={selected.coverUrl}
                        alt={`Cover of ${selected.title}`}
                        className="w-32 mb-3"
                      />
                    )}
                    <h2 className="text-xl mb-1">{selected.title}</h2>
                    <p className="mb-1">By {selected.author}</p>
                    <p className="mb-1">{selected.genre}</p>
                    {selected.notes && (
                      <p className="mb-3">{selected.notes}</p>
                    )}

                    <p className="font-medium">
                      {STATUS_LABEL[selected.status]}
                    </p>

                    {selected.status === "available" && (
                      <button
                        type="button"
                        onClick={() => setView("borrowing")}
                      >
                        Request to borrow
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
              </>
            )}

            {view === "borrowing" && selected && (
              <BorrowFlow
                bookUuid={selected.id}
                onStepChange={handleBorrowStepChange}
                onClose={forceClose}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}