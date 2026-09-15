import { getActiveBooks } from "@/lib/catalogue/books";
import { getSpineTitle } from "@/lib/catalogue/spine-title";

// Visual treatment intentionally deferred — see docs/visual-system.md,
// which is not yet applied here (Phase 6 of the build). This is
// structural layout only: a wrapping grid of generic spine shapes,
// per technical-specifications.md §14. No search or click-to-open
// details modal yet — those are separate, later steps.
export default async function CataloguePage() {
  const books = await getActiveBooks();

  return (
    <main className="p-8">
      <h1 className="text-2xl mb-6">Catalogue</h1>

      {books.length === 0 ? (
        <p>No books in the catalogue yet.</p>
      ) : (
        <ul className="flex flex-wrap gap-4 list-none p-0">
          {books.map((book) => (
            <li
              key={book.id}
              className="flex items-end justify-center w-24 h-40 border border-gray-400 p-2 text-center text-sm"
            >
              {getSpineTitle(book.title)}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}