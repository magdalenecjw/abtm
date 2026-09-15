/**
 * Derives the text shown on a book spine, per visual-system.md §7.1.
 *
 * Rule 1: a title containing a subtitle marker (colon) is truncated to
 * just the main title — e.g. "Sapiens: A Brief History of Humankind"
 * becomes "Sapiens". The full title remains available elsewhere (the
 * details modal); this function is only for the spine's short label.
 *
 * Rules 2-3 (wrapping long titles with no colon up to a max height,
 * then ellipsis; short titles fitting naturally) are pure CSS
 * concerns (line-clamp etc.), not a text transformation — handled in
 * the visual design pass (Phase 6), not here.
 */
export function getSpineTitle(title: string): string {
  const colonIndex = title.indexOf(":");
  if (colonIndex === -1) return title;
  return title.slice(0, colonIndex).trim();
}