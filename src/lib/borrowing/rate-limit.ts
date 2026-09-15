/**
 * Rate-limit threshold for the passcode gate, per workflows.md §3.2:
 * "5 incorrect attempts (tracked by IP address) within a rolling
 * window -> locked out for 24 hours."
 *
 * The spec doesn't pin down the exact size of the counting window
 * separately from the 24h lockout duration. This implementation uses
 * one 24-hour rolling window for both: an IP is blocked whenever 5+
 * failures are found within the last 24 hours. As old failures age
 * past 24 hours they stop counting, so the lockout itself naturally
 * lifts on a rolling basis rather than needing a separate "unlock at"
 * timestamp to track and clear.
 */
export const MAX_PASSCODE_ATTEMPTS = 5;

export function isRateLimited(recentFailureCount: number): boolean {
  return recentFailureCount >= MAX_PASSCODE_ATTEMPTS;
}