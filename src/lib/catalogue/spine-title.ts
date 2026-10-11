/**
 * Derives the text shown on a book spine, per visual-system.md §7.1.
 *
 * Rule 1: a title containing a subtitle marker (colon) is truncated to
 * just the main title — e.g. "Sapiens: A Brief History of Humankind"
 * becomes "Sapiens". The full title remains available elsewhere (the
 * hover card and details modal); this function is only for the spine's
 * short label.
 *
 * Rules 2-3 (a single vertical line that ends in an ellipsis if it runs
 * past the spine's height; short titles fitting naturally) are CSS
 * concerns, not a text transformation — see .book-spine in globals.css.
 */
export function getSpineTitle(title: string): string {
  const colonIndex = title.indexOf(":");
  if (colonIndex === -1) return title;
  return title.slice(0, colonIndex).trim();
}

/**
 * Simple, stable string hash (Java-style 31 multiplier). Used so each
 * book's spine looks the same on every render and every visit, rather
 * than being randomised — visual-system.md §7.2. Not for security.
 *
 * A `salt` gives independent-looking values for different properties
 * of the same book (so, e.g., tall spines aren't always dark).
 */
export function hashString(value: string, salt = ""): number {
  const input = value + salt;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * @deprecated Superseded by getSpineStyle (visual-system.md §7.2, October
 * 2026 redesign). Kept only so the current horizontal-spine grid keeps
 * working until catalogue-grid.tsx switches over in the next stage;
 * remove it then.
 */
export function getSpineHeight(bookId: string): number {
  const MIN = 150;
  const MAX = 210;
  return MIN + (hashString(bookId) % (MAX - MIN));
}

/**
 * The thirteen spine fills, paper to ink plus a greyed sage and a greyed
 * clay — must match visual-system.md §2.5.
 */
export const SPINE_PALETTE = [
  "#F2EDE4",
  "#EBE4D7",
  "#E2DACB",
  "#D6CDBC",
  "#C9BFAD",
  "#B8AE9C",
  "#A39A8A",
  "#8B8476",
  "#6F695F",
  "#4E4A43",
  "#3A3733",
  "#C3C7B8",
  "#D3C2B4",
] as const;

/** Spine text colours (visual-system.md §2.5). */
export const SPINE_INK_DARK = "#2B2925";
export const SPINE_INK_LIGHT = "#F6F1E8";

/**
 * Picks readable text for a spine fill: cream on fills whose relative
 * luminance is below 0.55, otherwise the primary near-black.
 * Expects a 6-digit hex colour like "#A39A8A".
 */
export function getSpineInk(fillHex: string): string {
  const n = parseInt(fillHex.replace("#", ""), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance < 0.55 ? SPINE_INK_LIGHT : SPINE_INK_DARK;
}

export type SpineTitleTreatment = "regular" | "italic" | "caps";
export type SpineDecoration = "none" | "rules" | "band";

export type SpineStyle = {
  /** px, 190–259 */
  height: number;
  /** px, 30–53 */
  width: number;
  /** One of SPINE_PALETTE */
  fill: string;
  /** Text colour chosen for contrast against `fill` */
  ink: string;
  titleTreatment: SpineTitleTreatment;
  decoration: SpineDecoration;
  /** Title font size in px, 11–15 */
  titleSize: number;
};

const HEIGHT_MIN = 190;
const HEIGHT_RANGE = 70; // → 190–259
const WIDTH_MIN = 30;
const WIDTH_RANGE = 24; // → 30–53
const MIN_TITLE_SIZE = 11;
const TREATMENTS: SpineTitleTreatment[] = ["regular", "italic", "caps"];
// "rules" appears twice on purpose: thin double rules are the most
// book-like detail, so roughly half the spines get them.
const DECORATIONS: SpineDecoration[] = ["none", "rules", "band", "rules"];

/**
 * Everything that makes one spine look different from its neighbours,
 * derived deterministically from the book's `id` (visual-system.md §7.2).
 * All variation is generic — size, neutral fill, type style, simple
 * bindery rules or a band — never anything taken from the real cover
 * (technical-specifications.md §14).
 */
export function getSpineStyle(bookId: string, title: string): SpineStyle {
  const h = hashString(bookId);
  const hWidth = hashString(bookId, "w");
  const hFill = hashString(bookId, "s");

  const height = HEIGHT_MIN + (h % HEIGHT_RANGE);
  const width = WIDTH_MIN + (hWidth % WIDTH_RANGE);
  const fill = SPINE_PALETTE[hFill % SPINE_PALETTE.length];
  const titleTreatment = TREATMENTS[h % TREATMENTS.length];
  const decoration = DECORATIONS[hWidth % DECORATIONS.length];

  // 15px on wide spines, 13px on medium, 12px on narrow; caps are 2px
  // smaller to offset their letter-spacing; long titles drop 1px more.
  // Never below 11px (visual-system.md §1.3) — narrow + caps + long
  // would otherwise reach an unreadable 9px.
  let titleSize = width > 44 ? 15 : width > 36 ? 13 : 12;
  if (titleTreatment === "caps") titleSize -= 2;
  if (getSpineTitle(title).length > 22) titleSize -= 1;
  titleSize = Math.max(MIN_TITLE_SIZE, titleSize);

  return {
    height,
    width,
    fill,
    ink: getSpineInk(fill),
    titleTreatment,
    decoration,
    titleSize,
  };
}

/** Name particles that belong with the surname ("Le Guin", "du Maurier"). */
const SURNAME_PARTICLES = new Set([
  "da", "de", "del", "della", "der", "di", "du", "la", "le", "st", "st.",
  "van", "von",
]);
const NAME_SUFFIXES = new Set(["jr", "jr.", "sr", "sr.", "ii", "iii", "iv"]);

/**
 * The author's surname for the foot of the spine (visual-system.md §7.2).
 *
 * Assumes "First Last" order. If several authors are listed (separated
 * by ";", "&" or " and "), uses the first. Keeps surname particles
 * ("Ursula K. Le Guin" → "Le Guin", "Daphne du Maurier" → "du Maurier")
 * and skips suffixes ("Martin Luther King Jr." → "King").
 */
export function getAuthorSurname(author: string): string {
  const firstAuthor = author.split(/;|&|\band\b/i)[0]?.trim() ?? "";
  const words = firstAuthor.split(/\s+/).filter(Boolean);
  while (
    words.length > 1 &&
    NAME_SUFFIXES.has(words[words.length - 1].replace(/,$/, "").toLowerCase())
  ) {
    words.pop();
  }
  if (words.length === 0) return "";

  let start = words.length - 1;
  while (start > 0 && SURNAME_PARTICLES.has(words[start - 1].toLowerCase())) {
    start--;
  }
  return words.slice(start).join(" ").replace(/,$/, "");
}
