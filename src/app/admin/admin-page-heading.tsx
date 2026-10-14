import type { ReactNode } from "react";

/**
 * Back-office page heading (visual-system.md §14.2): a small eyebrow,
 * the page name in italic Caslon, and an optional note on the right.
 */
export function AdminPageHeading({
  title,
  eyebrow = "Back office",
  note,
}: {
  title: string;
  eyebrow?: string;
  note?: ReactNode;
}) {
  return (
    <div className="admin-heading">
      <div>
        <p className="admin-eyebrow">{eyebrow}</p>
        <h1 className="admin-title">{title}</h1>
      </div>
      {note && <p className="admin-note">{note}</p>}
    </div>
  );
}
