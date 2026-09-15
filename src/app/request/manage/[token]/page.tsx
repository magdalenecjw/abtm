import { getRequestStatusByToken } from "@/app/borrow-actions";
import { CancelButton } from "./cancel-button";
import { formatQueuePosition } from "@/lib/borrowing/queue-position";

// Visual treatment intentionally deferred — see docs/visual-system.md,
// which is not yet applied here (Phase 6 of the build).
//
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
    <main className="p-8 max-w-md">
      <h1 className="text-2xl mb-4">Your request</h1>

      {result.status === "invalid" && (
        <p>This request link is invalid or no longer available.</p>
      )}

      {result.status === "pending" && (
        <div>
          <p className="mb-3">{formatQueuePosition(result.queuePosition)}</p>
          <CancelButton token={token} />
        </div>
      )}

      {result.status === "approved" && <p>Approved</p>}

      {(result.status === "returned" || result.status === "cancelled") && (
        <p>This request is no longer active</p>
      )}
    </main>
  );
}