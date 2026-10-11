import Link from "next/link";
import {
  genreKey,
  partitionGenres,
  type RankedGenre,
} from "@/lib/catalogue/genres";

/**
 * Builds a catalogue URL that keeps the current search term. Exported
 * so the search form and chips agree on parameter names.
 */
export function catalogueHref({
  q,
  genre,
  more,
}: {
  q?: string;
  genre?: string | null;
  more?: boolean;
}): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (genre) params.set("genre", genre);
  if (more) params.set("more", "1");
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

/**
 * Genre filter chips, per visual-system.md §10: "All", the five most
 * common genres, and "More (n)" to reveal the rest (then "Less").
 *
 * Deliberately a Server Component made of plain links rather than
 * client-side buttons: the selected genre and the More/Less state both
 * live in the URL (?genre=…&more=1), so the chips work without
 * JavaScript, a filtered view can be shared or refreshed, and the back
 * button behaves as expected (technical-specifications.md §14.3).
 *
 * `scroll={false}` keeps the reader's place on the page when a chip is
 * clicked, instead of jumping back to the top.
 */
export function GenreChips({
  genres,
  selectedGenre,
  q,
  expanded,
}: {
  genres: RankedGenre[];
  selectedGenre: string | null;
  q: string;
  expanded: boolean;
}) {
  if (genres.length === 0) return null;

  const { top, more } = partitionGenres(genres);
  const selectedKey = selectedGenre ? genreKey(selectedGenre) : null;
  const selectedIsHidden =
    selectedKey !== null && more.some((g) => genreKey(g.name) === selectedKey);

  // Shown chips: top five, then either every hidden genre (expanded) or
  // just the selected one if it lives under More — so the active
  // filter is never out of sight.
  const shown: RankedGenre[] = expanded
    ? [...top, ...more]
    : selectedIsHidden
      ? [...top, ...more.filter((g) => genreKey(g.name) === selectedKey)]
      : top;

  return (
    <ul
      aria-label="Filter by genre"
      className="flex flex-wrap justify-center gap-2 list-none p-0 m-0"
    >
      <li>
        <Link
          href={catalogueHref({ q })}
          scroll={false}
          className="chip"
          aria-current={selectedKey === null ? "true" : undefined}
        >
          All
        </Link>
      </li>

      {shown.map((g) => {
        const isSelected = genreKey(g.name) === selectedKey;
        return (
          <li key={g.name}>
            {/* Selecting a genre closes the More list (no `more` param). */}
            <Link
              href={catalogueHref({ q, genre: g.name })}
              scroll={false}
              className="chip"
              aria-current={isSelected ? "true" : undefined}
            >
              {g.name}
            </Link>
          </li>
        );
      })}

      {more.length > 0 && (
        <li>
          <Link
            href={catalogueHref({ q, genre: selectedGenre, more: !expanded })}
            scroll={false}
            className="chip chip-more"
          >
            {expanded ? "Less" : `More (${more.length})`}
          </Link>
        </li>
      )}
    </ul>
  );
}
