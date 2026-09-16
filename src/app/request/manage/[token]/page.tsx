import { AppBrand } from "@/app/app-brand";
import { getRequestStatusByToken } from "@/app/borrow-actions";
import { CancelButton } from "./cancel-button";
import { formatQueuePosition } from "@/lib/borrowing/queue-position";

// This is a Server Component that fetches fresh on every load/
// navigation — never caching state across visits, per
// workflows.md §4.2. `params` is a Promise in Next.js 16 (confirmed
// against the installed version's own docs).
export default async function ManageRequestPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await getRequestStatusByToken(token);

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <AppBrand />
      <h1 className="page-heading mb-6 mt-6">Your request</h1>

      {result.status === "invalid" && (
        <p>This request link is invalid or no longer available.</p>
      )}

      {result.status === "pending" && (
        <div>
          <p className="mb-4">{formatQueuePosition(result.queuePosition)}</p>
          <CancelButton token={token} />
        </div>
      )}

      {result.status === "approved" && (
        <p className="status-available font-medium">Approved</p>
      )}

      {(result.status === "returned" || result.status === "cancelled") && (
        <p>This request is no longer active.</p>
      )}
    </main>
  );
}