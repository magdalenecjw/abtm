"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * A read's notes, clamped to four lines with "Read more" — only when
 * they're actually cut off (visual-system.md §12.2).
 *
 * Works without JavaScript: the toggle is a native <details>, and CSS
 * (.read-notes:has(details[open])) lifts the clamp when it's open. With
 * JavaScript, this component measures the text and hides "Read more"
 * when the note fits at the current width — so a short note never gets
 * a useless link, and a medium one gets it only on narrow screens.
 *
 * Before measuring (server render / no JS), the link is shown for
 * notes long enough that they'd likely be clamped on a phone.
 */
const LIKELY_CLAMPED_CHARS = 140;

export function ReadNotes({ notes }: { notes: string }) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [clipped, setClipped] = useState(notes.length > LIKELY_CLAMPED_CHARS);

  useLayoutEffect(() => {
    const text = textRef.current;
    if (!text) return;

    const measure = () => {
      // While expanded, keep "Show less" visible.
      if (detailsRef.current?.open) return;
      setClipped(text.scrollHeight > text.clientHeight + 1);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(text);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="read-notes">
      <p ref={textRef} className="read-notes-text">
        {notes}
      </p>
      {clipped && (
        <details ref={detailsRef} className="read-more">
          <summary>
            <span className="read-more-closed">Read more</span>
            <span className="read-more-open">Show less</span>
          </summary>
        </details>
      )}
    </div>
  );
}
