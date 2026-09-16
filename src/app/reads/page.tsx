import Link from "next/link";
import { getPublicReads } from "@/lib/reads/public-reads";

// Visual treatment intentionally deferred — see docs/visual-system.md,
// which is not yet applied here (Phase 6 of the build).
export default async function ReadsPage() {
  const reads = await getPublicReads();

  return (
    <main className="p-8">
      <nav className="mb-4">
        <Link href="/" className="mr-4 underline">
          Catalogue
        </Link>
        <Link href="/reads" className="underline">
          My Reads
        </Link>
      </nav>
      <h1 className="text-2xl mb-6">My Reads</h1>

      {reads.length === 0 ? (
        <p>No reads yet.</p>
      ) : (
        <ul className="flex flex-col gap-6 list-none p-0">
          {reads.map((r) => (
            <li key={r.id} className="flex gap-4">
              {r.coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL / user-supplied cover URL, not a local/optimizable asset
                <img
                  src={r.coverUrl}
                  alt={`Cover of ${r.title}`}
                  className="w-16 h-24 object-cover"
                />
              )}
              <div>
                {/* "Owned" links through to the same catalogue details
                    modal via navigation, not a distinct URL, per
                    ui-specification.md §1.2. */}
                {r.source === "Owned" && r.bookId ? (
                  <Link href={`/?openBook=${r.bookId}`} className="underline">
                    <span className="text-lg">{r.title}</span>
                  </Link>
                ) : (
                  <span className="text-lg">{r.title}</span>
                )}

                <p>{r.author}</p>
                {r.genre && <p className="text-sm">{r.genre}</p>}
                {r.rating !== null && <p className="text-sm">Rating: {r.rating}</p>}
                {r.notes && <p className="text-sm mt-1">{r.notes}</p>}

                {r.source === "NLB" && (
                  <p className="text-sm italic">Available via NLB</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}