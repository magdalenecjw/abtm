/** Returns the ordinal suffix for a positive integer: 1 -> "st", 2 -> "nd", 11 -> "th", 21 -> "st", etc. */
export function ordinalSuffix(n: number): string {
  const lastTwoDigits = n % 100;
  const lastDigit = n % 10;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) return "th";
  if (lastDigit === 1) return "st";
  if (lastDigit === 2) return "nd";
  if (lastDigit === 3) return "rd";
  return "th";
}

/** Formats queue position wording per technical-specifications.md §11/§4.3: "0 ahead — you're next" or "You are Nth in line". */
export function formatQueuePosition(aheadCount: number): string {
  if (aheadCount === 0) return "0 ahead — you're next";
  const position = aheadCount + 1;
  return `You are ${position}${ordinalSuffix(position)} in line`;
}
/**
 * For each PENDING request, how many other pending requests for the
 * same book were made before it (technical-specifications.md §9) —
 * the admin Requests table shows this under the status. Pure; works
 * on the already-fetched admin list. Keyed by request id.
 */
export function pendingAheadCounts(
  requests: {
    id: string;
    bookKey: string;
    status: string;
    requestedAt: string;
  }[],
): Map<string, number> {
  const pendingByBook = new Map<string, { id: string; at: number }[]>();
  for (const r of requests) {
    if (r.status !== "pending") continue;
    const list = pendingByBook.get(r.bookKey) ?? [];
    list.push({ id: r.id, at: new Date(r.requestedAt).getTime() });
    pendingByBook.set(r.bookKey, list);
  }
  const result = new Map<string, number>();
  for (const list of pendingByBook.values()) {
    list.sort((a, b) => a.at - b.at);
    list.forEach((item, index) => result.set(item.id, index));
  }
  return result;
}
