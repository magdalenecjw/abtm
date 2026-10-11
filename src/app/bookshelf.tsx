"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { CatalogueBook } from "@/lib/catalogue/books";
import { splitGenres } from "@/lib/catalogue/genres";
import {
  getAuthorSurname,
  getSpineStyle,
  getSpineTitle,
} from "@/lib/catalogue/spine-title";

/** Gap between spine and hover card, and minimum distance from window edges (px). */
const CARD_GAP = 16;
const CARD_EDGE = 12;

type Hovered = { book: CatalogueBook; anchor: HTMLElement };

/**
 * The catalogue shelves, per visual-system.md §7.2–7.3 and §11:
 * vertical-title spines on stacked shelves, plus a hover card.
 *
 * Every spine's look (size, fill, title style, bindery detail) comes
 * from getSpineStyle, derived from the book's id — so it's stable
 * across visits and never taken from the real cover
 * (technical-specifications.md §14).
 *
 * Clicking a spine calls `onOpen` (the details modal lives in
 * CatalogueGrid).
 */
export function Bookshelf({
  books,
  onOpen,
}: {
  books: CatalogueBook[];
  onOpen: (id: string, trigger: HTMLElement) => void;
}) {
  const [hovered, setHovered] = useState<Hovered | null>(null);
  const [canHover, setCanHover] = useState(false);

  // Hover card only for devices with a real hovering pointer
  // (visual-system.md §11) — on touch, a tap goes straight to the modal.
  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Hide on any scroll (page or otherwise) — the card is fixed-position
  // and would otherwise drift away from its spine.
  useEffect(() => {
    if (!hovered) return;
    const hide = () => setHovered(null);
    window.addEventListener("scroll", hide, { capture: true, passive: true });
    window.addEventListener("resize", hide);
    return () => {
      window.removeEventListener("scroll", hide, { capture: true });
      window.removeEventListener("resize", hide);
    };
  }, [hovered]);

  function open(book: CatalogueBook, trigger: HTMLElement) {
    setHovered(null);
    onOpen(book.id, trigger);
  }

  return (
    <>
      <ul className="shelf" aria-label="Books">
        {books.map((book) => {
          const style = getSpineStyle(book.id, book.title);
          return (
            <li key={book.id}>
              <button
                type="button"
                className="book-spine"
                aria-label={`${book.title} by ${book.author}`}
                onClick={(e) => open(book, e.currentTarget)}
                onMouseEnter={(e) => {
                  if (canHover) setHovered({ book, anchor: e.currentTarget });
                }}
                onMouseLeave={() => setHovered(null)}
                onFocus={(e) => {
                  // Keyboard focus only — not the focus a mouse click gives.
                  if (e.currentTarget.matches(":focus-visible")) {
                    setHovered({ book, anchor: e.currentTarget });
                  }
                }}
                onBlur={() => setHovered(null)}
                style={
                  {
                    height: `${style.height}px`,
                    width: `${style.width}px`,
                    "--spine-fill": style.fill,
                    "--spine-ink": style.ink,
                  } as CSSProperties
                }
              >
                {style.decoration === "rules" && (
                  <>
                    <span
                      className="spine-rules spine-rules-top"
                      aria-hidden="true"
                    />
                    <span
                      className="spine-rules spine-rules-bottom"
                      aria-hidden="true"
                    />
                  </>
                )}
                {style.decoration === "band" && (
                  <span className="spine-band" aria-hidden="true" />
                )}
                <span
                  className={`spine-title spine-title-${style.titleTreatment}`}
                  style={{ fontSize: `${style.titleSize}px` }}
                  aria-hidden="true"
                >
                  {getSpineTitle(book.title)}
                </span>
                <span className="spine-author" aria-hidden="true">
                  {getAuthorSurname(book.author)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {hovered && <HoverCard book={hovered.book} anchor={hovered.anchor} />}
    </>
  );
}

/**
 * Preview card for one spine (visual-system.md §11). Purely visual — it
 * repeats what the details modal shows, takes no pointer events, and is
 * hidden from assistive tech (the spine's own label already says the
 * title and author).
 *
 * Shows no availability: status loads per book when the modal opens,
 * not for the whole shelf (technical-specifications.md §14.4, §33).
 */
function HoverCard({
  book,
  anchor,
}: {
  book: CatalogueBook;
  anchor: HTMLElement;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Position before paint: centred above the spine, flipped below if
  // there's no room above, and kept inside the window's edges.
  useLayoutEffect(() => {
    const card = ref.current;
    if (!card) return;
    const spine = anchor.getBoundingClientRect();
    const { offsetWidth: w, offsetHeight: h } = card;

    let left = spine.left + spine.width / 2 - w / 2;
    left = Math.max(
      CARD_EDGE,
      Math.min(left, window.innerWidth - w - CARD_EDGE),
    );

    let top = spine.top - h - CARD_GAP;
    if (top < CARD_EDGE) top = spine.bottom + CARD_GAP;

    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
    card.dataset.ready = "true";
  }, [anchor, book]);

  const genres = splitGenres(book.genre).join(" · ");

  return (
    <div ref={ref} className="hover-card" aria-hidden="true">
      <p className="hover-card-title">{book.title}</p>
      <p className="hover-card-author">{book.author}</p>
      {genres && <p className="hover-card-genre">{genres}</p>}
      <p className="hover-card-hint">Click for availability</p>
    </div>
  );
}
