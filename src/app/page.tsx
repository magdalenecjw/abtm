import Link from "next/link";
import { getActiveBooks } from "@/lib/catalogue/books";
import { CatalogueGrid } from "./catalogue-grid";

// Visual treatment intentionally deferred — see docs/visual-system.md,
// which is not yet applied here (Phase 6 of the build).
//
// Search is a plain GET form (?q=...) rather than client-side JS
// filtering — matches technical-specifications.md §33's requirement
// for server-side/database-driven search, and works without
// JavaScript. searchParams is a Promise in Next.js 16 and must be
// awaited (confirmed against the installed Next.js version's own
// docs, since this API shape has changed across versions).
export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const books = await getActiveBooks(q);

  return (
    <main className="p-8">
      <h1 className="text-2xl mb-6">Catalogue</h1>

      <form action="/" method="get" className="mb-6">
        <label htmlFor="q" className="sr-only">
          Search by title, author, or genre
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q ?? ""}
          placeholder="Search by title, author, or genre"
          className="border border-gray-400 px-2 py-1"
        />
        <button type="submit" className="ml-2 border border-gray-400 px-3 py-1">
          Search
        </button>
        {q && (
          <Link href="/" className="ml-2 underline text-sm">
            Clear
          </Link>
        )}
      </form>

      {books.length === 0 ? (
        <p>
          {q
            ? `No books match "${q}".`
            : "No books in the catalogue yet."}
        </p>
      ) : (
        <CatalogueGrid books={books} />
      )}
    </main>
  );
}