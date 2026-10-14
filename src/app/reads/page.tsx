import { getPublicReads } from "@/lib/reads/public-reads";
import { formatReadCount } from "@/lib/reads/presentation";
import { SiteHeader } from "../site-header";
import { ReadCard } from "./read-card";

const LIBRARY_NAME = "(automated) book teller machine";

// Public My Reads, presented as "Transaction history"
// (ui-specification.md §1.2, visual-system.md §12): a newest-first feed
// with no search or filters. date_read orders the feed but is never
// shown (getPublicReads).
export default async function ReadsPage() {
  const reads = await getPublicReads();

  return (
    <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12 md:px-8">
      <SiteHeader current="reads" />

      <section className="flex flex-col items-center gap-4 pt-6 pb-10 text-center">
        <p className="hero-label">{LIBRARY_NAME}</p>
        <h1 className="hero-headline">Transaction history</h1>
        <p className="hero-label tabular-nums">
          {formatReadCount(reads.length)}
        </p>
      </section>

      {reads.length === 0 ? (
        <p className="shelf-empty">No transactions yet.</p>
      ) : (
        <ol className="reads-feed" aria-label="Books read, newest first">
          {reads.map((r) => (
            <li key={r.id}>
              <ReadCard read={r} />
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
