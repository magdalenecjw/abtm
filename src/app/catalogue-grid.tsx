"use client";

import { useEffect, useState, useTransition } from "react";
import { getSpineTitle, getSpineHeight } from "@/lib/catalogue/spine-title";
import { getBookDetail, type BookDetail } from "./actions";
import type { CatalogueBook } from "@/lib/catalogue/books";
import { BorrowFlow, type BorrowStep } from "./borrow-flow";

const STATUS_LABEL: Record<BookDetail["status"], string> = {
  available: "Available",
  checked_out: "Checked out",
  on_loan: "On loan",
};

const STATUS_CLASS: Record<BookDetail["status"], string> = {
  available: "status-available",
  checked_out: "status-checked-out",
  on_loan: "status-on-loan",
};

type ModalView = "details" | "borrowing";

// Behavioral rule implemented per visual-system.md §6: click-outside/
// Escape close the details view, but are disabled during the
// passcode/form borrowing steps (in-progress data at risk), leaving
// only the explicit × button.
export function CatalogueGrid({
  books,
  initialOpenBookId,
}: {
  books: CatalogueBook[];
  initialOpenBookId?: string;
}) {
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

  // Supports linking here from another page (e.g. My Reads §1.2:
  // an "Owned" entry links through to this same modal via catalogue
  // navigation, not a distinct URL) with ?openBook={id} in the URL.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deriving initial state from a URL-sourced prop at mount (opening the modal for a book linked from another page) is the intended one-time initialization here, not a repeated sync loop.
    if (initialOpenBookId) openBook(initialOpenBookId);
  }, [initialOpenBookId]);

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
      {/* Book spines: uniform width, height varies per book, horizontal
          title text, alternating neutral fills so spines don't read as
          identical clones — per visual-system.md §7. Long-title
          handling: colon-truncation happens in getSpineTitle (a text
          transform); the remaining CSS-only rules (wrap up to a max
          height, then ellipsis) are handled here with line-clamp. */}
      <ul className="flex flex-wrap items-end gap-4 list-none p-0">
        {books.map((book, i) => (
          <li key={book.id}>
            <button
              type="button"
              onClick={() => openBook(book.id)}
              style={{
                height: `${getSpineHeight(book.id)}px`,
                background: i % 2 === 0 ? "var(--spine-light)" : "var(--spine-dark)",
              }}
              className="book-spine flex items-end justify-center w-24 p-3 text-center"
            >
              <span className="font-caslon text-sm leading-snug line-clamp-4 break-words w-full">
                {getSpineTitle(book.title)}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {open && (
        <div
          role="presentation"
          onClick={close}
          className="modal-scrim fixed inset-0 flex items-center justify-center p-4 z-30"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Book details"
            onClick={(e) => e.stopPropagation()}
            className="modal-panel max-w-md w-full p-6 relative rounded-[3px] border border-[var(--rule)]"
          >
            <button
              type="button"
              onClick={forceClose}
              aria-label="Close"
              className="absolute top-3 right-3 text-lg leading-none hover:text-[var(--accent)]"
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
                        className="w-32 mb-4 rounded-[3px] border border-[var(--rule)]"
                      />
                    )}
                    <h2 className="book-title text-2xl mb-2">
                      {selected.title}
                    </h2>
                    <p className="mb-1">By {selected.author}</p>
                    <p className="mb-1 text-sm">{selected.genre}</p>
                    {selected.notes && (
                      <p className="mb-4 text-sm">{selected.notes}</p>
                    )}

                    <p
                      className={`text-sm font-medium mb-4 ${STATUS_CLASS[selected.status]}`}
                    >
                      {STATUS_LABEL[selected.status]}
                    </p>

                    {/* Shown regardless of status (available/checked_out/
                        on_loan) — the queue mechanism (technical-
                        specifications.md §9) means new borrowers can
                        join the queue even while a book is already
                        requested or on loan. Only an inactive book
                        (which wouldn't appear in the catalogue at all)
                        has no valid request path. */}
                    <button
                      type="button"
                      onClick={() => setView("borrowing")}
                      className="primary-button"
                    >
                      Request to borrow
                    </button>

                    {selected.status === "on_loan" &&
                      selected.currentBorrowerNickname && (
                        <p className="mt-3 text-sm">
                          On loan to {selected.currentBorrowerNickname}
                          {selected.loanStartedAt &&
                            ` since ${new Date(selected.loanStartedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}`}
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