"use server";

import { createClient } from "@/lib/supabase/server";
import { computeAttentionFlag } from "@/lib/borrowing/attention-flags";
import { getAllBooksForAdmin } from "./books/actions";

export type DashboardStats = {
  totalBooks: number;
  available: number;
  checkedOut: number;
  onLoan: number;
  pendingRequests: number;
  notYetCollected: number;
  /** Combines the "Needs attention," "Long loan," and "Very long loan" tiers into one count, per ui-specification.md §2.2. */
  longLoan: number;
  totalReads: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const books = await getAllBooksForAdmin();
  const totalBooks = books.length;
  const available = books.filter((b) => b.status === "available").length;
  const checkedOut = books.filter((b) => b.status === "checked_out").length;
  const onLoan = books.filter((b) => b.status === "on_loan").length;

  const { data: requests, error } = await supabase
    .from("loan_requests")
    .select("status, collection_date, approved_at");

  if (error) {
    throw new Error(`Could not load requests: ${error.message}`);
  }

  const pendingRequests = (requests ?? []).filter(
    (r) => r.status === "pending",
  ).length;

  let notYetCollected = 0;
  let longLoan = 0;
  for (const r of requests ?? []) {
    const flag = computeAttentionFlag({
      status: r.status,
      collection_date: r.collection_date,
      approved_at: r.approved_at,
    });
    if (flag === "not_yet_collected") notYetCollected++;
    if (
      flag === "needs_attention" ||
      flag === "long_loan" ||
      flag === "very_long_loan"
    ) {
      longLoan++;
    }
  }

  const { count: totalReads, error: readsError } = await supabase
    .from("reads")
    .select("id", { count: "exact", head: true });

  if (readsError) {
    throw new Error(`Could not load reads: ${readsError.message}`);
  }

  return {
    totalBooks,
    available,
    checkedOut,
    onLoan,
    pendingRequests,
    notYetCollected,
    longLoan,
    totalReads: totalReads ?? 0,
  };
}