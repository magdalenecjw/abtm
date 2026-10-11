import Link from "next/link";
import type { CSSProperties } from "react";
import type { PublicRead } from "@/lib/reads/public-reads";
import { splitGenres } from "@/lib/catalogue/genres";
import {
  SPINE_PALETTE,
  getAuthorSurname,
  getSpineInk,
  getSpineTitle,
  hashString,
} from "@/lib/catalogue/spine-title";
import { ratingDots, ratingLabel } from "@/lib/reads/presentation";
import { ReadNotes } from "./read-notes";

/**
 * One entry in "Transaction history" (visual-system.md §12.2).
 *
 * "On my shelf" (Owned + linked) entries are a single link to the
 * book's catalogue modal (ui-specification.md §1.2). It's done as a
 * "stretched" link — the title link's ::after covers the whole card —
 * rather than wrapping the card in <a>, because the card also contains
 * the "Read more" toggle, and interactive elements can't be nested
 * inside a link.
 */
export function ReadCard({ read }: { read: PublicRead }) {
  const isOnShelf = read.source === "Owned" && read.bookId !== null;
  const genres = splitGenres(read.genre);

  return (
    <article className={isOnShelf ? "read-card read-card-linked" : "read-card"}>
      {read.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL / user-supplied cover URL, not a local/optimizable asset
        <img
          src={read.coverUrl}
          alt={`Cover of ${read.title}`}
          className="read-cover"
          loading="lazy"
        />
      ) : (
        <DrawnCover id={read.id} title={read.title} author={read.author} />
      )}

      <div className="read-body">
        <div className="read-top">
          <h2 className="read-title">
            {isOnShelf ? (
              <Link href={`/?openBook=${read.bookId}`} className="read-link">
                {read.title}
              </Link>
            ) : (
              read.title
            )}
          </h2>
          {read.rating !== null && <RatingDots rating={read.rating} />}
        </div>

        {read.author && <p className="read-author">{read.author}</p>}

        {(read.source || genres.length > 0) && (
          <ul className="read-labels" aria-label="Labels">
            {read.source === "Owned" && (
              <li className="source-pill source-owned">On my shelf</li>
            )}
            {read.source === "NLB" && (
              <li className="source-pill source-nlb">NLB</li>
            )}
            {genres.map((g) => (
              <li key={g} className="genre-pill">
                {g}
              </li>
            ))}
          </ul>
        )}

        {read.notes && <ReadNotes notes={read.notes} />}

        {isOnShelf && (
          <p className="read-availability" aria-hidden="true">
            See availability →
          </p>
        )}
      </div>
    </article>
  );
}

/** Five dots, half-points supported (visual-system.md §12.2). */
function RatingDots({ rating }: { rating: number }) {
  return (
    <span className="rating-dots" role="img" aria-label={ratingLabel(rating)}>
      {ratingDots(rating).map((dot, i) => (
        <span key={i} className={`rating-dot rating-dot-${dot}`} />
      ))}
    </span>
  );
}

/**
 * Placeholder cover for reads without one, drawn in the spine style
 * (visual-system.md §12.3) — never an imitation of the real cover.
 * Colour comes from a hash of the read's id, so it's stable.
 */
function DrawnCover({
  id,
  title,
  author,
}: {
  id: string;
  title: string;
  author: string | null;
}) {
  const fill = SPINE_PALETTE[hashString(id, "s") % SPINE_PALETTE.length];
  return (
    <div
      className="read-cover read-cover-drawn"
      style={
        {
          "--cover-fill": fill,
          "--cover-ink": getSpineInk(fill),
        } as CSSProperties
      }
      aria-hidden="true"
    >
      <span className="read-cover-title">{getSpineTitle(title)}</span>
      {author && (
        <span className="read-cover-author">{getAuthorSurname(author)}</span>
      )}
    </div>
  );
}
