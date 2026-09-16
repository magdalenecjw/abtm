"use client";

import { useState } from "react";

// Click-to-open (not hover), per ui-specification.md §1.1: hover has
// no reliable mobile equivalent. One combined static popup covering
// both how borrowing works and a brief note on My Reads / NLB
// tagging — not a separate route.
export function HelpButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Help"
        aria-expanded={open}
        className="w-8 h-8 rounded-full border border-[var(--rule)] flex items-center justify-center text-sm hover:border-[var(--accent)]"
      >
        ?
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Help"
          className="absolute right-0 mt-2 w-72 bg-[var(--background)] border border-[var(--rule)] rounded-[3px] p-4 text-sm shadow-lg z-20"
        >
          <p className="mb-3">
            <strong className="font-medium">Borrowing:</strong> enter the
            shared passcode, submit your name and a public nickname, then
            save the private link shown once to manage or cancel your
            request.
          </p>
          <p>
            <strong className="font-medium">My Reads:</strong> a personal
            reading log. &quot;Owned&quot; entries link back to the
            catalogue; &quot;NLB&quot; entries are available via the
            National Library Board, not from this collection.
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-3 text-link"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}