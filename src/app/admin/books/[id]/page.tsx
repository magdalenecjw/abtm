import { AdminHeader } from "@/app/admin/admin-header";
import { AdminPageHeading } from "@/app/admin/admin-page-heading";
import { getBookDetailForAdmin, getLoanHistoryForBook } from "./actions";
import { CoversForm } from "../covers/covers-form";
import { splitGenres } from "@/lib/catalogue/genres";
import { formatDateOnly, formatRequestedAt } from "@/lib/borrowing/receipt";

const HISTORY_STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "status-checked-out" },
  approved: { label: "Approved", className: "status-available" },
  returned: { label: "Returned", className: "admin-status-muted" },
  cancelled: { label: "Cancelled", className: "admin-status-muted" },
};

// `params` is a Promise in Next.js 16 (confirmed against the
// installed version's own docs).
export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const book = await getBookDetailForAdmin(id);

  if (!book) {
    return (
      <main className="admin-page">
        <AdminHeader current="books" />
        <p>This book could not be found.</p>
      </main>
    );
  }

  const history = await getLoanHistoryForBook(id);

  return (
    <main className="admin-page">
      <AdminHeader current="books" />
      <AdminPageHeading eyebrow={`Book · ${book.bookIdCode}`} title={book.title} />

      {/* Read-only for all catalogue metadata — the spreadsheet is the
          sole source of truth (ui-specification.md §2.5). Correcting
          metadata always means: edit the spreadsheet, re-sync. */}
      <section className="admin-section">
        <h2 className="admin-section-title">Details</h2>
        <dl className="admin-facts">
          <dt>Author</dt>
          <dd>{book.author}</dd>
          <dt>Genre</dt>
          <dd>{splitGenres(book.genre).join(" · ")}</dd>
          <dt>Notes</dt>
          <dd>{book.notes ?? "—"}</dd>
          <dt>Shown publicly</dt>
          <dd>
            {book.active ? (
              "Yes"
            ) : (
              <span className="admin-hidden-pill">Hidden</span>
            )}
          </dd>
        </dl>
        <p className="admin-sub admin-section-note">
          To change these, edit the spreadsheet and sync it.
        </p>
      </section>

      <section className="admin-section">
        <h2 className="admin-section-title">Cover</h2>
        {/* Single-file case of the unified upload mechanism
            (workflows.md §8.1) — the same component used for bulk
            upload, filtered to this book by uploading a file named
            exactly {book.bookIdCode}.<ext>. */}
        <p className="admin-section-intro">
          Upload a file named <strong>{book.bookIdCode}.jpg</strong> (or
          .png / .webp / .heic) to set this book&apos;s cover.
        </p>
        <CoversForm />
      </section>

      <section className="admin-section">
        <h2 className="admin-section-title">Loan history</h2>
        {history.length === 0 ? (
          <p className="admin-section-intro">No requests for this book yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Borrower</th>
                  <th>Requested</th>
                  <th>Status</th>
                  <th>Collected</th>
                  <th>Returned</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td>
                      <span>{h.realName}</span>
                      <span className="admin-sub">&ldquo;{h.nickname}&rdquo;</span>
                    </td>
                    <td className="admin-nowrap">
                      {formatRequestedAt(h.requestedAt).split(",")[0]}
                    </td>
                    <td>
                      <span
                        className={`status-badge ${HISTORY_STATUS[h.status]?.className ?? "admin-status-muted"}`}
                      >
                        {HISTORY_STATUS[h.status]?.label ?? h.status}
                      </span>
                    </td>
                    <td className="admin-nowrap">
                      {h.collectionDate ? formatDateOnly(h.collectionDate) : "—"}
                    </td>
                    <td className="admin-nowrap">
                      {h.returnDate ? formatDateOnly(h.returnDate.slice(0, 10)) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
