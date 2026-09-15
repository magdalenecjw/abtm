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