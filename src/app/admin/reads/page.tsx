import Link from "next/link";
import { AdminFooter, AdminHeader } from "../admin-header";
import { AdminPageHeading } from "../admin-page-heading";
import { getAllReadsForAdmin } from "./actions";
import { DeleteButton } from "./delete-button";
import { splitGenres } from "@/lib/catalogue/genres";
import { formatDateOnly } from "@/lib/borrowing/receipt";

/** Source pill, plus the linked book_id for owned reads. */
function SourceCell({
  source,
  bookIdCode,
}: {
  source: string | null;
  bookIdCode: string | null;
}) {
  if (source === "Owned") {
    return (
      <>
        <span className="source-pill source-owned">On my shelf</span>
        <span className="admin-sub">{bookIdCode ?? "Not linked"}</span>
      </>
    );
  }
  if (source === "NLB") return <span className="source-pill source-nlb">NLB</span>;
  return <span className="admin-muted">—</span>;
}

// No "add new" entry point — per ui-specification.md §2.8, Goodreads
// import is the only way rows are created.
export default async function AdminReadsPage() {
  const reads = await getAllReadsForAdmin();

  return (
    <main className="admin-page">
      <AdminHeader current="reads" />
      <AdminPageHeading
        eyebrow="My Reads"
        title="Reading list"
        note={
          <>
            {reads.length} {reads.length === 1 ? "read" : "reads"} ·{" "}
            <Link href="/admin/reads/import" className="text-link">
              Import from Goodreads
            </Link>
          </>
        }
      />

      {reads.length === 0 ? (
        <p className="shelf-empty">
          No reads yet.{" "}
          <Link href="/admin/reads/import" className="text-link">
            Import from Goodreads
          </Link>{" "}
          to add some.
        </p>
      ) : (
        <>
          <div className="admin-table-wrap admin-desktop-only">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Genre</th>
                  <th>Rating</th>
                  <th>Date read</th>
                  <th>Source</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reads.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="admin-book-title">{r.title}</span>
                      <span className="admin-sub">{r.author}</span>
                    </td>
                    <td>{r.genre ? splitGenres(r.genre).join(" · ") : "—"}</td>
                    <td className="admin-nowrap">
                      {r.rating !== null ? `${r.rating} / 5` : "—"}
                    </td>
                    <td className="admin-nowrap">
                      {r.dateRead ? formatDateOnly(r.dateRead) : "—"}
                    </td>
                    <td>
                      <SourceCell source={r.source} bookIdCode={r.bookIdCode} />
                    </td>
                    <td>
                      <div className="admin-action-row">
                        <Link
                          href={`/admin/reads/${r.id}/edit`}
                          className="secondary-button admin-compact admin-quiet-pill"
                        >
                          Edit
                        </Link>
                        <DeleteButton id={r.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="admin-cards admin-phone-only">
            {reads.map((r) => (
              <li key={r.id} className="admin-card">
                <div>
                  <span className="admin-book-title">{r.title}</span>
                  <span className="admin-sub">{r.author}</span>
                </div>
                <dl className="admin-card-facts">
                  <dt>Genre</dt>
                  <dd>{r.genre ? splitGenres(r.genre).join(" · ") : "—"}</dd>
                  <dt>Rating</dt>
                  <dd>{r.rating !== null ? `${r.rating} / 5` : "—"}</dd>
                  <dt>Date read</dt>
                  <dd>{r.dateRead ? formatDateOnly(r.dateRead) : "—"}</dd>
                  <dt>Source</dt>
                  <dd>
                    <SourceCell source={r.source} bookIdCode={r.bookIdCode} />
                  </dd>
                </dl>
                <div className="admin-action-row">
                  <Link
                    href={`/admin/reads/${r.id}/edit`}
                    className="secondary-button admin-compact admin-quiet-pill"
                  >
                    Edit
                  </Link>
                  <DeleteButton id={r.id} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      <AdminFooter />
    </main>
  );
}
