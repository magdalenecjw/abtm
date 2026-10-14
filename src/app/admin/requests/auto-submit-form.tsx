"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * A plain GET form that submits itself whenever a field changes
 * (visual-system.md §14.4) — pills apply instantly; the search field
 * applies on Enter or when it loses focus (the native "change" event).
 *
 * Without JavaScript it's just a normal form: the visible "Apply"
 * button inside <noscript> submits it.
 */
export function AutoSubmitForm({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const form = ref.current;
    if (!form) return;
    const submit = () => form.requestSubmit();
    form.addEventListener("change", submit);
    return () => form.removeEventListener("change", submit);
  }, []);

  return (
    <form ref={ref} method="get" className={className}>
      {children}
      <button type="submit" className="sr-only">
        Apply filters
      </button>
      <noscript>
        <button type="submit" className="secondary-button admin-compact">
          Apply filters
        </button>
      </noscript>
    </form>
  );
}
