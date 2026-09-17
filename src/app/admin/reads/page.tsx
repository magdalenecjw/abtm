import Link from "next/link";
import { AdminHeader } from "../admin-header";
import { getAllReadsForAdmin } from "./actions";
import { DeleteButton } from "./delete-button";

// No "add new" entry point — per ui-specification.md §2.8, Goodreads
// import is the only way rows are created.
export default async function AdminReadsPage() {
  const reads = await getAllReadsForAdmin();

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 md:px-8">
      <AdminHeader />
      <h1 className="page-heading mb-6">My Reads</h1>

      <p className="mb-6">
        <Link href="/admin/reads/import" className="text-link">
          Import from Goodreads
        </Link>
      </p>

      {reads.length === 0 ? (
        <p>No reads yet. Import from Goodreads to add some.</p>
      ) : (
        <>
          {/* Desktop/tablet: table */}
          <table className="hidden sm:table w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--rule)] text-left">
                <th className="p-2">Title</th>
                <th className="p-2">Author</th>
                <th className="p-2">Genre</th>
                <th className="p-2">Rating</th>
                <th className="p-2">Date read</th>
                <th className="p-2">Source</th>
                <th className="p-2">Linked book</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reads.map((r) => (
                <tr key={r.id} className="border-b border-[var(--rule)]">
                  <td className="p-2">{r.title}</td>
                  <td className="p-2">{r.author}</td>
                  <td className="p-2">{r.genre ?? ""}</td>
                  <td className="p-2">{r.rating ?? ""}</td>
                  <td className="p-2">{r.dateRead ?? ""}</td>
                  <td className="p-2">{r.source ?? ""}</td>
                  <td className="p-2">{r.bookIdCode ?? "(not linked)"}</td>
                  <td className="p-2 flex gap-2 items-center">
                    <Link
                      href={`/admin/reads/${r.id}/edit`}
                      className="text-link"
                    >
                      Edit
                    </Link>
                    <DeleteButton id={r.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile: stacked card per row, per visual-system.md §8 */}
          <div className="sm:hidden flex flex-col gap-4">
            {reads.map((r) => (
              <div
                key={r.id}
                className="border border-[var(--rule)] rounded-[3px] p-4"
              >
                <p className="book-title text-base mb-1">{r.title}</p>
                <p className="text-sm mb-2">{r.author}</p>
                <dl className="text-sm grid grid-cols-[90px_1fr] gap-y-1 mb-3">
                  <dt className="opacity-70">Genre</dt>
                  <dd>{r.genre ?? "—"}</dd>
                  <dt className="opacity-70">Rating</dt>
                  <dd>{r.rating ?? "—"}</dd>
                  <dt className="opacity-70">Date read</dt>
                  <dd>{r.dateRead ?? "—"}</dd>
                  <dt className="opacity-70">Source</dt>
                  <dd>{r.source ?? "—"}</dd>
                  <dt className="opacity-70">Linked book</dt>
                  <dd>{r.bookIdCode ?? "(not linked)"}</dd>
                </dl>
                <div className="flex gap-2 items-center">
                  <Link
                    href={`/admin/reads/${r.id}/edit`}
                    className="text-link"
                  >
                    Edit
                  </Link>
                  <DeleteButton id={r.id} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
