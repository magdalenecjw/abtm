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

/**
 * Today's date in library time as "YYYY-MM-DD" — the value format of
 * <input type="date">. Used to pre-fill the admin collection date.
 */
export function todayInLibraryTime(now: Date = new Date()): string {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: LIBRARY_TIME_ZONE,
  }).format(now);
}

/** "2026-10-14" (a date-only value) → "14 Oct 2026". */
export function formatDateOnly(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  const month = new Intl.DateTimeFormat("en-GB", {
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
  return `${d} ${month} ${y}`;
}

/** The three ways the slip can describe a request's status. */
export type ReceiptStatus = "pending" | "approved" | "inactive";
