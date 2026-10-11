/**
 * Helpers for the receipt slip (visual-system.md §13.2). Pure — no
 * Supabase or Next.js imports.
 */

/**
 * Time zone the receipt's "Requested" time is shown in. Fixed rather
 * than taken from the environment because the request page renders on
 * the server (UTC on Vercel), while the confirmation renders in the
 * borrower's browser — a fixed zone keeps both identical.
 */
export const LIBRARY_TIME_ZONE = "Asia/Singapore";

const requestedAtFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: LIBRARY_TIME_ZONE,
});

/** "2026-10-11T15:04:00Z" → "11 Oct 2026, 23:04" (library time). */
export function formatRequestedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts = Object.fromEntries(
    requestedAtFormat.formatToParts(date).map((p) => [p.type, p.value]),
  );
  return `${parts.day} ${parts.month} ${parts.year}, ${parts.hour}:${parts.minute}`;
}

/** The three ways the slip can describe a request's status. */
export type ReceiptStatus = "pending" | "approved" | "inactive";
