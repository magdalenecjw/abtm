import Link from "next/link";
import { getPublicReads } from "@/lib/reads/public-reads";
import { SiteHeader } from "../site-header";

export default async function ReadsPage() {
  const reads = await getPublicReads();

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 md:px-8">
      <SiteHeader />
      <h1 className="page-heading mb-6">My Reads</h1>

      {reads.length === 0 ? (
        <p>No reads yet.</p>
      ) : (
        <ul className="flex flex-col gap-8 list-none p-0 max-w-2xl">
          {reads.map((r) => (
            <li key={r.id} className="flex gap-4 border-b border-[var(--rule)] pb-8">
              {r.coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL / user-supplied cover URL, not a local/optimizable asset
                <img
                  src={r.coverUrl}
                  alt={`Cover of ${r.title}`}
                  className="w-16 h-24 object-cover rounded-[3px] border border-[var(--rule)] flex-shrink-0"
                />
              )}
              <div>
                {/* "Owned" links through to the same catalogue details
                    modal via navigation, not a distinct URL, per
                    ui-specification.md §1.2. */}
                {r.source === "Owned" && r.bookId ? (
                  <Link href={`/?openBook=${r.bookId}`} className="text-link">
                    <span className="book-title text-lg">{r.title}</span>
                  </Link>
                ) : (
                  <span className="book-title text-lg">{r.title}</span>
                )}

                <p className="text-sm mt-1">{r.author}</p>
                {r.genre && <p className="text-sm">{r.genre}</p>}
                {r.rating !== null && (
                  <p className="text-sm">Rating: {r.rating}</p>
                )}
                {r.notes && <p className="text-sm mt-2">{r.notes}</p>}

                {r.source === "NLB" && (
                  <p className="text-sm italic mt-1">Available via NLB</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}