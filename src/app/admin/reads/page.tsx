import Link from "next/link";
import { getAllReadsForAdmin } from "./actions";
import { DeleteButton } from "./delete-button";

// Visual treatment intentionally deferred — see docs/visual-system.md,
// which is not yet applied here (Phase 6 of the build). No "add new"
// entry point — per ui-specification.md §2.8, Goodreads import is
// the only way rows are created.
export default async function AdminReadsPage() {
  const reads = await getAllReadsForAdmin();

  return (
    <main className="p-8">
      <h1 className="text-2xl mb-6">My Reads</h1>

      <p className="mb-4">
        <Link href="/admin/reads/import" className="underline">
          Import from Goodreads
        </Link>
      </p>

      {reads.length === 0 ? (
        <p>No reads yet. Import from Goodreads to add some.</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-400 text-left">
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
              <tr key={r.id} className="border-b border-gray-200">
                <td className="p-2">{r.title}</td>
                <td className="p-2">{r.author}</td>
                <td className="p-2">{r.genre ?? ""}</td>
                <td className="p-2">{r.rating ?? ""}</td>
                <td className="p-2">{r.dateRead ?? ""}</td>
                <td className="p-2">{r.source ?? ""}</td>
                <td className="p-2">{r.bookIdCode ?? "(not linked)"}</td>
                <td className="p-2 flex gap-2">
                  <Link
                    href={`/admin/reads/${r.id}/edit`}
                    className="underline"
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