import Link from "next/link";
import { AdminHeader } from "../admin-header";
import { getAllReadsForAdmin } from "./actions";
import { DeleteButton } from "./delete-button";

// No "add new" entry point — per ui-specification.md §2.8, Goodreads
// import is the only way rows are created.
export default async function AdminReadsPage() {
  const reads = await getAllReadsForAdmin();

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 md:px-8">
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
        <table className="w-full text-sm border-collapse">
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
      )}
    </main>
  );
}
