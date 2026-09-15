import type { AttentionFlag } from "./attention-flags";

export type RequestStatus = "pending" | "approved" | "returned" | "cancelled";

export type AdminRequestRow = {
  id: string;
  bookTitle: string;
  bookIdCode: string;
  realName: string;
  nickname: string;
  requestedAt: string;
  status: RequestStatus;
  collectionDate: string | null;
  returnDate: string | null;
  approvedAt: string | null;
  attentionFlag: AttentionFlag;
};

export type RequestFilters = {
  showPending: boolean;
  showApproved: boolean;
  /** Reveals RETURNED/CANCELLED requests, per workflows.md §5.1's "Show history" toggle. */
  showHistory: boolean;
  /** Independent flag checkboxes (workflows.md §5.2) — empty means no flag filtering applied. */
  flags: AttentionFlag[];
  titleSearch: string;
};

/**
 * Filters the admin requests list per workflows.md §5.1-5.2. Pure
 * function — the actual DB fetch happens separately; this just
 * applies the filter combination to an already-fetched list, so it's
 * testable without a database.
 */
export function filterRequests(
  requests: AdminRequestRow[],
  filters: RequestFilters,
): AdminRequestRow[] {
  return requests.filter((r) => {
    const statusMatches =
      (filters.showPending && r.status === "pending") ||
      (filters.showApproved && r.status === "approved") ||
      (filters.showHistory &&
        (r.status === "returned" || r.status === "cancelled"));
    if (!statusMatches) return false;

    if (filters.flags.length > 0) {
      if (!r.attentionFlag || !filters.flags.includes(r.attentionFlag)) {
        return false;
      }
    }

    const q = filters.titleSearch.trim().toLowerCase();
    if (q && !r.bookTitle.toLowerCase().includes(q)) {
      return false;
    }

    return true;
  });
}