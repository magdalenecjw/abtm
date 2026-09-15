export type AttentionFlag =
  | "not_yet_collected"
  | "needs_attention"
  | "long_loan"
  | "very_long_loan"
  | null;

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Computes the attention flag for a loan request, per workflows.md
 * §5.3. Two independent systems, mutually exclusive by construction
 * (System A requires collection_date IS NULL, System B requires it
 * IS NOT NULL — a request can never match both):
 *
 * System A ("Not yet collected"): APPROVED, no collection_date yet,
 * 14+ days since approved_at.
 *
 * System B (loan duration, anchored to days since collection_date):
 * 0-29 none, 30-89 "Needs attention", 90-179 "Long loan", 180+ "Very
 * long loan".
 *
 * `now` is injectable for testability (defaults to the real current
 * time in production use).
 */
export function computeAttentionFlag(
  request: {
    status: string;
    collection_date: string | null;
    approved_at: string | null;
  },
  now: Date = new Date(),
): AttentionFlag {
  if (request.status !== "approved") return null;

  if (request.collection_date === null) {
    if (!request.approved_at) return null;
    const daysSinceApproved = daysBetween(new Date(request.approved_at), now);
    return daysSinceApproved >= 14 ? "not_yet_collected" : null;
  }

  const daysSinceCollection = daysBetween(
    new Date(request.collection_date),
    now,
  );
  if (daysSinceCollection >= 180) return "very_long_loan";
  if (daysSinceCollection >= 90) return "long_loan";
  if (daysSinceCollection >= 30) return "needs_attention";
  return null;
}