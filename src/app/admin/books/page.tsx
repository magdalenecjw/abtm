import Link from "next/link";
import { AdminHeader } from "../admin-header";
import { getAllBooksForAdmin, type BookStatus } from "./actions";

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

export default async function AdminBooksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const allBooks = await getAllBooksForAdmin();

  const query = q?.trim().toLowerCase() ?? "";
  const books = allBooks.filter((b) => {
    if (status && status !== "all" && b.status !== status) return false;
    if (
      query &&
      !`${b.title} ${b.author} ${b.bookIdCode}`.toLowerCase().includes(query)
    ) {
      return false;
    }
    return true;
  });

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 md:px-8">
      <AdminHeader />
      <h1 className="page-heading mb-6">Books</h1>

      <form method="get" className="mb-6 flex flex-wrap gap-2 items-end">
        <div>
          <label htmlFor="q" className="text-sm block mb-1">
            Search
          </label>
          <input
            id="q"
            name="q"
            type="text"
            defaultValue={q ?? ""}
            placeholder="Title, author, or book_id"
            className="search-input"
          />
        </div>
        <div>
          <label htmlFor="status" className="text-sm block mb-1">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status ?? "all"}
            className="search-input"
          >
            <option value="all">All</option>
            <option value="available">Available</option>
            <option value="checked_out">Checked out</option>
            <option value="on_loan">On loan</option>
          </select>
        </div>
        <button type="submit" className="secondary-button">
          Apply
        </button>
      </form>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-[var(--rule)] text-left">
            <th className="p-2">book_id</th>
            <th className="p-2">Title</th>
            <th className="p-2">Author</th>
            <th className="p-2">Genre</th>
            <th className="p-2">Status</th>
            <th className="p-2">Active</th>
          </tr>
        </thead>
        <tbody>
          {books.map((b) => (
            <tr key={b.id} className="border-b border-[var(--rule)]">
              <td className="p-2">
                <Link href={`/admin/books/${b.id}`} className="text-link">
                  {b.bookIdCode}
                </Link>
              </td>
              <td className="p-2">
                <Link href={`/admin/books/${b.id}`} className="text-link">
                  {b.title}
                </Link>
              </td>
              <td className="p-2">{b.author}</td>
              <td className="p-2">{b.genre}</td>
              <td className={`p-2 font-medium ${STATUS_CLASS[b.status]}`}>
                {STATUS_LABEL[b.status]}
              </td>
              <td className="p-2">{b.active ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {books.length === 0 && <p className="mt-4">No books match these filters.</p>}
    </main>
  );
}
