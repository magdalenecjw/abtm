import { AdminHeader } from "@/app/admin/admin-header";
import { getBookDetailForAdmin, getLoanHistoryForBook } from "./actions";
import { CoversForm } from "../covers/covers-form";

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
      <main className="max-w-4xl mx-auto px-6 py-12">
        <AdminHeader />
        <p>This book could not be found.</p>
      </main>
    );
  }

  const history = await getLoanHistoryForBook(id);

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <AdminHeader />
      <h1 className="page-heading mb-1">{book.title}</h1>
      <p className="mb-6 text-sm">book_id: {book.bookIdCode}</p>

      {/* Read-only for all catalogue metadata — the spreadsheet is the
          sole source of truth (ui-specification.md §2.5). Correcting
          metadata always means: edit the spreadsheet, re-sync. */}
      <section className="mb-8">
        <h2 className="book-title text-lg mb-3">Metadata</h2>
        <dl className="text-sm grid grid-cols-[120px_1fr] gap-y-2">
          <dt className="opacity-70">Author</dt>
          <dd>{book.author}</dd>
          <dt className="opacity-70">Genre</dt>
          <dd>{book.genre}</dd>
          <dt className="opacity-70">Notes</dt>
          <dd>{book.notes ?? "—"}</dd>
          <dt className="opacity-70">Active</dt>
          <dd>{book.active ? "Yes" : "No"}</dd>
        </dl>
      </section>

      <section className="mb-8">
        <h2 className="book-title text-lg mb-3">Cover</h2>
        {/* Single-file case of the unified upload mechanism
            (workflows.md §8.1) — the same component used for bulk
            upload, filtered to this book by uploading a file named
            exactly {book.bookIdCode}.<ext>. */}
        <p className="text-sm mb-3">
          Upload a file named <strong>{book.bookIdCode}.jpg</strong> (or
          .png/.webp/.heic) to set this book&apos;s cover.
        </p>
        <CoversForm />
      </section>

      <section>
        <h2 className="book-title text-lg mb-3">Loan history</h2>
        {history.length === 0 ? (
          <p className="text-sm">No requests for this book yet.</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--rule)] text-left">
                <th className="p-2">Requester</th>
                <th className="p-2">Nickname</th>
                <th className="p-2">Requested</th>
                <th className="p-2">Status</th>
                <th className="p-2">Collected</th>
                <th className="p-2">Returned</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-b border-[var(--rule)]">
                  <td className="p-2">{h.realName}</td>
                  <td className="p-2">{h.nickname}</td>
                  <td className="p-2">
                    {new Date(h.requestedAt).toLocaleDateString()}
                  </td>
                  <td className="p-2">{h.status}</td>
                  <td className="p-2">{h.collectionDate ?? ""}</td>
                  <td className="p-2">{h.returnDate ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
