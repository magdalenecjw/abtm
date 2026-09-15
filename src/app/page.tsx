import { getActiveBooks } from "@/lib/catalogue/books";
import { CatalogueGrid } from "./catalogue-grid";

// Visual treatment intentionally deferred — see docs/visual-system.md,
// which is not yet applied here (Phase 6 of the build). Search is a
// separate, later step.
export default async function CataloguePage() {
  const books = await getActiveBooks();

  return (
    <main className="p-8">
      <h1 className="text-2xl mb-6">Catalogue</h1>

      {books.length === 0 ? (
        <p>No books in the catalogue yet.</p>
      ) : (
        <CatalogueGrid books={books} />
      )}
    </main>
  );
}