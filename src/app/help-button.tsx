"use client";

import { useEffect, useRef, useState } from "react";

// Click-to-open (not hover), per ui-specification.md §1.1: hover has
// no reliable mobile equivalent. One combined static popup covering
// both how borrowing works and a brief note on My Reads — not a
// separate route. Styled like the spine hover card
// (visual-system.md §9.1, §11). Closes with ×, a click outside, or
// Escape.
export function HelpButton() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    // Not position:relative — the card anchors to the header's right
    // edge (.site-header), so it always stays on-screen on phones.
    <div ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="How it works"
        aria-expanded={open}
        className="help-icon"
      >
        ?
      </button>
      {open && (
        <div role="dialog" aria-labelledby="help-title" className="help-card">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="help-card-close"
          >
            ×
          </button>
          <h2 id="help-title" className="help-card-title">
            How it works
          </h2>
          <dl className="help-card-list">
            <dt>Borrowing</dt>
            <dd>
              Enter the shared passcode, give your name and a public
              nickname, then save the receipt link shown once. It&apos;s how
              you check or cancel your request.
            </dd>
            <dt>My Reads</dt>
            <dd>
              A personal reading log. &quot;On my shelf&quot; entries link
              back to the catalogue; &quot;NLB&quot; ones are from the
              National Library Board, not this collection.
            </dd>
          </dl>
        </div>
      )}
    </div>
  );
}
