import Link from "next/link";
import { AdminFooter, AdminHeader } from "../admin-header";
import { AdminPageHeading } from "../admin-page-heading";
import { getAllBooksForAdmin, type BookStatus } from "./actions";
import { splitGenres } from "@/lib/catalogue/genres";

const STATUS_LABEL: Record<BookStatus, string> = {
  available: "Available",
  checked_out: "Checked out",
  on_loan: "On loan",
};

const STATUS_CLASS: Record<BookStatus, string> = {
  available: "status-available",
  checked_out: "status-checked-out",
  on_loan: "status-on-loan",
};

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "available", label: "Available" },
  { value: "checked_out", label: "Checked out" },
  { value: "on_loan", label: "On loan" },
];

function booksHref(status: string, q: string): string {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  if (q) params.set("q", q);
  const query = params.toString();
  return query ? `/admin/books?${query}` : "/admin/books";
}

// Books list (ui-specification.md §2.4, visual-system.md §14.5): every
// book including inactive ones. Status filters are pill links and the
// search is a plain GET form, so both work without JavaScript.
export default async function AdminBooksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status = "all", q = "" } = await searchParams;
  const allBooks = await getAllBooksForAdmin();

  const query = q.trim().toLowerCase();
  const books = allBooks.filter((b) => {
    if (status !== "all" && b.status !== status) return false;
    if (
      query &&
      !`${b.title} ${b.author} ${b.bookIdCode}`.toLowerCase().includes(query)
    ) {
      return false;
    }
    return true;
  });

  return (
    <main className="admin-page">
      <AdminHeader current="books" />
      <AdminPageHeading
        eyebrow="Catalogue"
        title="Books"
        note={`${books.length} of ${allBooks.length} books, including hidden ones`}
      />

      <div className="admin-filters">
        <div className="admin-filter-row">
          <span className="admin-filter-label">Status</span>
          {STATUS_FILTERS.map((f) => (
            <Link
              key={f.value}
              href={booksHref(f.value, q)}
              scroll={false}
              className="chip"
              aria-current={status === f.value ? "true" : undefined}
            >
              {f.label}
            </Link>
          ))}
        </div>
        <form method="get" className="admin-filter-row">
          <label htmlFor="q" className="admin-filter-label">
            Search
          </label>
          {status !== "all" && (
            <input type="hidden" name="status" value={status} />
          )}
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Title, author, or book_id"
            className="admin-search-line"
          />
          <button type="submit" className="sr-only">
            Search
          </button>
        </form>
      </div>

      {books.length === 0 ? (
        <p className="shelf-empty">No books match these filters.</p>
      ) : (
        <>
          <div className="admin-table-wrap admin-desktop-only">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Author</th>
                  <th>Genre</th>
                  <th>Status</th>
                  <th>Shown publicly</th>
                </tr>
              </thead>
              <tbody>
                {books.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <Link
                        href={`/admin/books/${b.id}`}
                        className="admin-row-link"
                      >
                        <span className="admin-book-title">{b.title}</span>
                      </Link>
                      <span className="admin-sub">{b.bookIdCode}</span>
                    </td>
                    <td>{b.author}</td>
                    <td>{splitGenres(b.genre).join(" · ")}</td>
                    <td>
                      <span
                        className={`status-badge ${STATUS_CLASS[b.status]}`}
                      >
                        {STATUS_LABEL[b.status]}
                      </span>
                    </td>
                    <td>
                      {b.active ? (
                        "Yes"
                      ) : (
                        <span className="admin-hidden-pill">Hidden</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="admin-cards admin-phone-only">
            {books.map((b) => (
              <li key={b.id} className="admin-card">
                <div className="admin-card-top">
                  <div>
                    <Link
                      href={`/admin/books/${b.id}`}
                      className="admin-row-link"
                    >
                      <span className="admin-book-title">{b.title}</span>
                    </Link>
                    <span className="admin-sub">
                      {b.bookIdCode} · {b.author}
                    </span>
                  </div>
                  <span className={`status-badge ${STATUS_CLASS[b.status]}`}>
                    {STATUS_LABEL[b.status]}
                  </span>
                </div>
                <dl className="admin-card-facts">
                  <dt>Genre</dt>
                  <dd>{splitGenres(b.genre).join(" · ")}</dd>
                  <dt>Shown</dt>
                  <dd>
                    {b.active ? (
                      "Yes"
                    ) : (
                      <span className="admin-hidden-pill">Hidden</span>
                    )}
                  </dd>
                </dl>
              </li>
            ))}
          </ul>
        </>
      )}
      <AdminFooter />
    </main>
  );
}
