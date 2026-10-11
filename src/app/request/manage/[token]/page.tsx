import { AppBrand } from "@/app/app-brand";
import { getRequestStatusByToken } from "@/app/borrow-actions";
import { ReceiptSlip } from "@/app/receipt-slip";
import { CancelButton } from "./cancel-button";

// This is a Server Component that fetches fresh on every load/
// navigation — never caching state across visits, per
// workflows.md §4.2. `params` is a Promise in Next.js 16 (confirmed
// against the installed version's own docs).
//
// Presented as the receipt slip (visual-system.md §13.2), showing
// only the borrower's own request (technical-specifications.md §11).
// An invalid link gets the plain message, with no slip.
export default async function ManageRequestPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await getRequestStatusByToken(token);

  return (
    <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <AppBrand />

      <div className="mt-10">
        {result.status === "invalid" ? (
          <p className="text-center">
            This request link is invalid or no longer available.
          </p>
        ) : (
          <ReceiptSlip
            heading="Your request"
            bookTitle={result.bookTitle}
            requestedAt={result.requestedAt}
            status={
              result.status === "pending"
                ? "pending"
                : result.status === "approved"
                  ? "approved"
                  : "inactive"
            }
            queuePosition={
              result.status === "pending" ? result.queuePosition : undefined
            }
          >
            {result.status === "pending" && (
              <>
                <hr className="receipt-tear" />
                <CancelButton token={token} />
              </>
            )}
            {result.status === "approved" && (
              <p className="receipt-note">Approved.</p>
            )}
            {(result.status === "returned" ||
              result.status === "cancelled") && (
              <p className="receipt-note">This request is no longer active.</p>
            )}
          </ReceiptSlip>
        )}
      </div>
    </main>
  );
}
