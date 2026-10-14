import Link from "next/link";
import { getCatalogue } from "@/lib/catalogue/books";
import { formatVolumeCount } from "@/lib/catalogue/genres";
import { CatalogueGrid } from "./catalogue-grid";
import { CatalogueHero } from "./catalogue-hero";
import { GenreChips, catalogueHref } from "./genre-chips";
import { SiteHeader } from "./site-header";

type SearchParams = Promise<{
  q?: string | string[];
  genre?: string | string[];
  more?: string | string[];
  openBook?: string | string[];
}>;

/** A repeated query parameter (?q=a&q=b) arrives as an array — use the first. */
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// Catalogue (home), per ui-specification.md §1.3 and visual-system.md §9:
// header → hero → search line → genre chips → shelves.
//
// Search and genre filtering are driven by plain GET parameters
// (?q=…&genre=…) and done on the server — technical-specifications.md
// §14.2–14.3, §33 — so everything works without JavaScript.
// searchParams is a Promise in Next.js 16 and must be awaited.
export default async function CataloguePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = first(params.q)?.trim() ?? "";
  const openBook = first(params.openBook);
  const expanded = first(params.more) === "1";

  const { books, totalVolumes, genres, selectedGenre, isFiltered } =
    await getCatalogue({ q, genre: first(params.genre) });

  return (
    <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12 md:px-8">
      <SiteHeader current="catalogue" />

      <CatalogueHero
        volumeCount={formatVolumeCount(books.length, totalVolumes, isFiltered)}
      />

      <section
        aria-label="Find a book"
        className="mx-auto mb-10 flex max-w-[720px] flex-col gap-6"
      >
        <form action="/" method="get" role="search" className="flex flex-col items-center gap-2">
          <label htmlFor="q" className="sr-only">
            Search by title, author, or genre
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="What are you looking for?"
            autoComplete="off"
            className="search-line"
          />
          {/* Keep the selected genre when a search is submitted. */}
          {selectedGenre && (
            <input type="hidden" name="genre" value={selectedGenre} />
          )}
          <button type="submit" className="sr-only">
            Search
          </button>
          {q && (
            <Link
              href={catalogueHref({ genre: selectedGenre })}
              scroll={false}
              className="text-link text-xs text-[var(--muted)]"
            >
              Clear search
            </Link>
          )}
        </form>

        <GenreChips
          genres={genres}
          selectedGenre={selectedGenre}
          q={q}
          expanded={expanded}
        />
      </section>

      {totalVolumes === 0 ? (
        <p className="shelf-empty">No books in the catalogue yet.</p>
      ) : books.length === 0 ? (
        <p className="shelf-empty">Nothing on the shelf matches that.</p>
      ) : (
        <CatalogueGrid books={books} initialOpenBookId={openBook} />
      )}
    </main>
  );
}
