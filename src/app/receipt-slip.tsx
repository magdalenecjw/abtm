import type { ReactNode } from "react";
import { formatQueuePosition } from "@/lib/borrowing/queue-position";
import { formatRequestedAt, type ReceiptStatus } from "@/lib/borrowing/receipt";

const LIBRARY_NAME = "(automated) book teller machine";

const STATUS_PILL: Record<ReceiptStatus, { label: string; className: string }> =
  {
    pending: { label: "Pending", className: "status-checked-out" },
    approved: { label: "Approved", className: "status-available" },
    inactive: {
      label: "No longer active",
      className: "receipt-status-inactive",
    },
  };

/**
 * The receipt slip (visual-system.md §13.2) — used for both the
 * confirmation in the details modal ("Please take your receipt") and
 * the saved-link request page ("Your request"), so they always match.
 *
 * Shows only the borrower's own request: book title, when it was
 * requested, status, and queue position while pending — never any
 * names or collection/return dates (technical-specifications.md §11).
 *
 * `children` sit below the line items: the receipt link box and/or the
 * cancel action, depending on where the slip is used. No hooks, so it
 * works in both Server and Client Components.
 */
export function ReceiptSlip({
  heading,
  bookTitle,
  requestedAt,
  status,
  queuePosition,
  children,
}: {
  heading: string;
  bookTitle: string;
  requestedAt: string;
  status: ReceiptStatus;
  /** Requests ahead in the queue — shown only while pending. */
  queuePosition?: number;
  children?: ReactNode;
}) {
  const pill = STATUS_PILL[status];
  const requested = formatRequestedAt(requestedAt);

  return (
    <article className="receipt" aria-label={heading}>
      <header className="receipt-head">
        <p className="receipt-library">{LIBRARY_NAME}</p>
        <h2 className="receipt-heading">{heading}</h2>
      </header>

      <hr className="receipt-tear" />

      <dl className="receipt-lines">
        <div className="receipt-line">
          <dt>Transaction</dt>
          <dd>Borrow request</dd>
        </div>
        {bookTitle && (
          <div className="receipt-line">
            <dt>Book</dt>
            <dd className="receipt-book">{bookTitle}</dd>
          </div>
        )}
        {requested && (
          <div className="receipt-line">
            <dt>Requested</dt>
            <dd>{requested}</dd>
          </div>
        )}
        <div className="receipt-line">
          <dt>Status</dt>
          <dd>
            <span className={`status-badge ${pill.className}`}>
              {pill.label}
            </span>
          </dd>
        </div>
        {status === "pending" && queuePosition !== undefined && (
          <div className="receipt-line">
            <dt>Queue</dt>
            <dd>{formatQueuePosition(queuePosition)}</dd>
          </div>
        )}
      </dl>

      {children}

      <p className="receipt-foot">Thank you for borrowing</p>
    </article>
  );
}
