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
 * concerns, not a text transformation — see .spine-title in globals.css.
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

export type SpineTitleTreatment = "regular" | "italic";
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
// Titles always show exactly as written in the catalogue — no case
// changes (the earlier all-capitals style was removed, October 2026).
const TREATMENTS: SpineTitleTreatment[] = ["regular", "italic"];
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
  const hTreatment = hashString(bookId, "t");

  const height = HEIGHT_MIN + (h % HEIGHT_RANGE);
  const width = WIDTH_MIN + (hWidth % WIDTH_RANGE);
  const fill = SPINE_PALETTE[hFill % SPINE_PALETTE.length];
  const titleTreatment = TREATMENTS[hTreatment % TREATMENTS.length];
  const decoration = DECORATIONS[hWidth % DECORATIONS.length];

  // 15px on wide spines, 13px on medium, 12px on narrow; titles over
  // 22 characters drop 1px so more of them fit. Never below 11px
  // (visual-system.md §1.3).
  let titleSize = width > 44 ? 15 : width > 36 ? 13 : 12;
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
  "da",
  "de",
  "del",
  "della",
  "der",
  "di",
  "du",
  "la",
  "le",
  "st",
  "st.",
  "van",
  "von",
]);
const NAME_SUFFIXES = new Set(["jr", "jr.", "sr", "sr.", "ii", "iii", "iv"]);

/**
 * True for a word written entirely in capitals with at least two
 * letters and no full stops — the convention for marking the family
 * name ("Haruki MURAKAMI", "MO Yan"). Initials with full stops ("R.F.",
 * "J.R.R.") never count; a trailing comma is ignored.
 */
function isCapitalisedName(word: string): boolean {
  const core = word.replace(/,$/, "");
  if (core.includes(".")) return false;
  const letters = core.match(/\p{L}/gu) ?? [];
  return letters.length >= 2 && letters.every((ch) => /\p{Lu}/u.test(ch));
}

/**
 * The author's family name for the foot of the spine (visual-system.md
 * §7.2, technical-specifications.md §16).
 *
 * If several authors are listed (separated by ";", "&" or " and "),
 * uses the first. Suffixes are dropped first ("Martin Luther King Jr."
 * → "King", "… III" never counts as a name).
 *
 * 1. **Capitalised family name wins.** If the name mixes capitalised and
 *    ordinary words, the longest run of capitalised words is the family
 *    name, wherever it sits — so family-name-first and Asian names work
 *    when typed that way: "MO Yan" → "MO", "Haruki MURAKAMI" →
 *    "MURAKAMI", "R.F. KUANG" → "KUANG", "Ursula K. LE GUIN" →
 *    "LE GUIN". Particles just before it are kept ("Daphne du MAURIER"
 *    → "du MAURIER").
 * 2. **Otherwise, the last word** (with any particles before it):
 *    "Kazuo Ishiguro" → "Ishiguro", "Daphne du Maurier" → "du Maurier".
 *    This also covers names typed entirely in capitals, where there's
 *    nothing to tell the family name apart.
 *
 * Initials need full stops ("A.A. Milne"); "AA Milne" would read "AA"
 * as a capitalised family name.
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

  // Rule 1: longest run of capitalised words, if the name isn't all caps.
  const flags = words.map(isCapitalisedName);
  if (flags.some(Boolean) && !flags.every(Boolean)) {
    let bestStart = -1;
    let bestLength = 0;
    for (let i = 0; i < words.length;) {
      if (!flags[i]) {
        i++;
        continue;
      }
      let j = i;
      while (j < words.length && flags[j]) j++;
      if (j - i > bestLength) {
        bestStart = i;
        bestLength = j - i;
      }
      i = j;
    }
    return withParticles(words, bestStart, bestStart + bestLength);
  }

  // Rule 2: last word.
  return withParticles(words, words.length - 1, words.length);
}

/** Joins words[start..end), extended left over any surname particles. */
function withParticles(words: string[], start: number, end: number): string {
  let from = start;
  while (from > 0 && SURNAME_PARTICLES.has(words[from - 1].toLowerCase())) {
    from--;
  }
  return words
    .slice(from, end)
    .map((w) => w.replace(/,$/, ""))
    .join(" ");
}
