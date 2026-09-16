import Link from "next/link";
import { getActiveBooks } from "@/lib/catalogue/books";
import { CatalogueGrid } from "./catalogue-grid";
import { SiteHeader } from "./site-header";

// Search is a plain GET form (?q=...) rather than client-side JS
// filtering — matches technical-specifications.md §33's requirement
// for server-side/database-driven search, and works without
// JavaScript. searchParams is a Promise in Next.js 16 and must be
// awaited (confirmed against the installed Next.js version's own
// docs, since this API shape has changed across versions).
export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; openBook?: string }>;
}) {
  const { q, openBook } = await searchParams;
  const books = await getActiveBooks(q);

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 md:px-8">
      <SiteHeader />

      <form action="/" method="get" className="mb-10 flex gap-2 max-w-md">
        <label htmlFor="q" className="sr-only">
          Search by title, author, or genre
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q ?? ""}
          placeholder="Search by title, author, or genre"
          className="search-input"
        />
        <button type="submit" className="secondary-button whitespace-nowrap">
          Search
        </button>
        {q && (
          <Link href="/" className="text-link self-center text-sm">
            Clear
          </Link>
        )}
      </form>

      {books.length === 0 ? (
        <p>{q ? `No books match "${q}".` : "No books in the catalogue yet."}</p>
      ) : (
        <CatalogueGrid books={books} initialOpenBookId={openBook} />
      )}
    </main>
  );
}