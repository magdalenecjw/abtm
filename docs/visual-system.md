# Automated Book Teller Machine — Visual System

**Document status:** Complete — typography, color palette, spacing, borders/corners, buttons, modal treatment, book spines, mobile behaviour, catalogue hero, genre chips, and hover card all defined.
**Date:** 12 September 2026 · **Revised:** 14 October 2026 (catalogue redesign; teller touches; header; colour contrast)

This document defines the concrete visual language implementing the design direction set out in §31 of `Technical_Specifications.md` (classical, refined, quiet, clean, contemporary, typography-led, generous whitespace, thin rules, restrained borders — explicitly avoiding parchment, sepia, distressed textures, Victorian ornament, and generic SaaS aesthetics).

## Revision history

**11 October 2026 — catalogue redesign.** Prompted by a reference "bookshelf" catalogue the owner liked; adapted to keep this project's fonts, palette discipline and §14 "generic spines" rule. Agreed via a clickable mockup before any code changed.

- **§1** — added a Display size (italic Libre Caslon Text, hero headline only) and a spaced-capitals Label style.
- **§2.5** (new) — spine palette widened from two alternating neutrals to thirteen neutral shades.
- **§4 / §5** — buttons, chips, status badges and the help icon become pills; modal, hover card, cards and inputs keep 3px corners.
- **§7** — spines reversed from horizontal to **vertical** titles; width now varies as well as height; typographic and bindery-detail variety added; layout becomes **stacked shelves** (wrapping rows resting on shelf ledges). Follow-ups the same day: the all-capitals title style was removed so spine titles always match the catalogue; the spine's author name now honours a capitalised family name ("Haruki MURAKAMI").
- **§8** — mobile notes updated for the above.
- **§9** (new) — catalogue header, hero and search line.
- **§10** (new) — genre chips (All + top five + More).
- **§11** (new) — spine hover card (desktop pointer and keyboard focus only).

**11 October 2026 — teller touches.** The site's name is a play on a bank's teller machine; this pass lets that show in the *words* and one contained visual, while the look stays a classic library. Rule of thumb: **wit in the copy, restraint in the visuals** — instructions and error messages always stay plain. Agreed via a clickable mockup.

- **§12** (new) — My Reads becomes **"Transaction history"**: matching hero, reads as catalogue cards, rating dots, source pills, drawn covers for books without one.
- **§13** (new) — borrowing-flow wording ("Please enter your passcode", "Continue", "Complete withdrawal") and the **receipt slip** used for the confirmation and the request page.
- Considered and not adopted: "Available balance: 97 volumes" in the catalogue hero — the count stays "97 volumes".

**12 October 2026 — header.** The public header was the last part still in the old plain-link style. Agreed via a clickable mockup comparing a single hairline with a double rule, two current-page styles, and Admin in the header or footer.

- **§9.1** — nav links in the label style; the current page as a filled pill; a small Admin link kept at the far right; a **double rule** under the header; the help card restyled to match the hover card.
- **§4** — the header's double rule added as the second exception to the single-hairline rule.

**14 October 2026 — colour contrast.** The live stylesheet had already darkened the sage accent and two status colours so they're readable as text on the cream background; this spec hadn't caught up. §2.2, §2.3 and §5 now list the values actually in use, with their contrast ratios. Rule going forward: any colour used for **text** must reach at least **4.5 : 1** against the background (WCAG AA).

---

## 1. Typography

### 1.1 Typefaces

| Role | Typeface | Source |
|---|---|---|
| Headings / identity / titles | **Libre Caslon Text** | Google Fonts |
| Body / UI / functional text | **Inter** | Google Fonts |

**Rationale:** Libre Caslon Text is genuinely rooted in traditional book/print typesetting — it supplies the "classical library catalogue card" character the brief calls for. Inter is clean, neutral, and highly legible at small UI sizes. The deliberate contrast between a historically-rooted serif and a contemporary neutral sans is itself the intended "classical interpreted through a contemporary system" effect — rather than picking two fonts from the same era/mood.

### 1.2 Usage rules

- **Libre Caslon Text** is used for: top-level page headings, the catalogue hero headline, and **book titles everywhere** — including book spines, the spine hover card, the book details modal, and My Reads entries. One consistent weight throughout (its regular cut) — no bold Caslon anywhere, keeping headings quiet rather than shouty.
  - **Italic Caslon** is used sparingly: the catalogue hero headline (§9.2), the search line placeholder (§9.3), and as one of the two spine title treatments (§7.2).
- **Inter** is used for everything else: body text, descriptions, notes/review text, form fields, buttons, nav links, table cells, status labels, timestamps. Regular weight for body/UI text; a medium weight (not full bold) is available for elements needing slight emphasis (button labels, active nav state), keeping emphasis restrained rather than high-contrast.
  - **Label style** — Inter in uppercase with wide letter-spacing, used for short identifying labels: the library name and volume count in the hero (§9.2), genre chips (§10), authors on the hover card (§11), and the author surname at the foot of each spine (§7.2).

### 1.3 Type scale

Five core sizes plus one display size reserved for the catalogue hero:

| Role | Typeface | Size | Used for |
|---|---|---|---|
| Display | Libre Caslon Text, italic | `clamp(40px, 8.5vw, 92px)` | Catalogue hero headline only (§9.2) |
| Page heading | Libre Caslon Text | 2rem (32px) | Top-level page titles ("My Reads," "Requests," admin section headers) |
| Card / book title | Libre Caslon Text | 1.25rem (20px) | Book titles — details modal, hover card, My Reads entries |
| Body | Inter | 1rem (16px) | Descriptions, notes, review text, form field values, general reading content |
| UI text | Inter | 0.875rem (14px) | Buttons, nav links, form labels, table cells |
| Small / caption | Inter | 0.75rem (12px) | Status labels ("Available," "Needs attention"), timestamps, queue position text, helper/meta text |

**Label style tracking:** hero labels 12px at `0.28em` letter-spacing; chips 11px at `0.14em`; hover-card author 12px at `0.14em`; spine surname 8px at `0.16em`.

**Spine titles** sit outside the scale: 11–15px depending on spine width and title length (§7.2), because they have to fit a narrow vertical strip.

*Note: core sizes were a starting proposal; the Display size and label tracking were validated against the October 2026 catalogue mockup.*

---

## 2. Color palette

Direction: a neutral, ink-and-paper-inspired base (not warm/aged — closer to a well-printed book page than an antique document), with a sage/forest green + terracotta accent family, evoking a mid-century-adjacent but still restrained, classical feel. Deliberately avoids browns/sepia/parchment tones that would read as "faux-aged."

### 2.1 Base / neutral

| Role | Color | Hex |
|---|---|---|
| Background | Cream | `#FAF6EF` |
| Primary text | Warm near-black | `#2B2925` |
| Muted text (placeholders, captions) | Warm grey | `#7D786F` |
| Borders / rules | Soft warm grey | `#D9D3C7` |
| Shelf ledge | Pale stone | `#E4DDCF` |

### 2.2 Accent (interactive elements)

| Role | Color | Hex |
|---|---|---|
| Links, buttons, active nav state | Sage green | `#697560` (hover/pressed: `#596352`) |

Contrast against the cream background: **4.5 : 1**. *(Originally `#8A9A7E`, which only reached 2.8 : 1 — too faint for link and button text; darkened in the build and recorded here in October 2026.)*

Deliberately distinct from the "Available" status green below, even though both sit in the green family — different roles (interactive vs. status) that shouldn't be visually conflated, but the shared family keeps them feeling related rather than arbitrary.

### 2.3 Book status colors (Technical_Specifications.md §14–15)

| Status | Color | Hex | Contrast on cream |
|---|---|---|---|
| Available | Forest green | `#3B5D45` | 6.9 : 1 |
| Checked out | Amber / ochre | `#92692F` | 4.6 : 1 |
| On loan | Soft terracotta | `#A45F43` | 4.5 : 1 |

*Checked out and On loan were originally `#C08A3E` (2.8 : 1) and `#C1704F` (3.4 : 1); both were darkened in the build so the status text is readable, and are recorded here as of October 2026.*

### 2.4 Loan-duration flag colors (`docs/workflows.md` §5.3)

Terracotta family, graduated by intensity. No reinforcement beyond color shade (no icons/weight changes) — judged unnecessary for a small, low-volume private library.

| Flag | Color | Hex |
|---|---|---|
| Not yet collected | Light terracotta / clay | `#D9A98A` |
| Needs attention (30–89 days) | Soft terracotta | `#C1704F` |
| Long loan (90–179 days) | Medium terracotta | `#A85838` |
| Very long loan (180+ days) | Deep terracotta / rust | `#7A3E26` |

*Note: these flag colours are **not yet used** in the build (the admin Requests screen currently shows flags as plain text). They'll be revisited — and checked against the 4.5 : 1 text rule — when the admin screens are restyled. The original note that "Needs attention" shares the "On loan" shade no longer holds, since "On loan" was darkened to `#A45F43`.*

### 2.5 Spine palette

Thirteen neutrals running from paper to ink, plus two greyed-down tints that echo the sage and terracotta accents without reading as colour. Replaces the earlier two alternating shades, which made a full shelf look flat. Kept strictly neutral so the shelf never competes with the status colours or starts to resemble real covers.

| # | Hex | | # | Hex |
|---|---|---|---|---|
| 1 | `#F2EDE4` | | 8 | `#8B8476` |
| 2 | `#EBE4D7` | | 9 | `#6F695F` |
| 3 | `#E2DACB` | | 10 | `#4E4A43` |
| 4 | `#D6CDBC` | | 11 | `#3A3733` |
| 5 | `#C9BFAD` | | 12 | `#C3C7B8` (greyed sage) |
| 6 | `#B8AE9C` | | 13 | `#D3C2B4` (greyed clay) |
| 7 | `#A39A8A` | | | |

**Spine text colour** is chosen per spine for contrast: primary text (`#2B2925`) on light fills, cream (`#F6F1E8`) when the fill's relative luminance is below 0.55.

---

## 3. Spacing scale

Five steps, 8px base unit — matching the same "keep it minimal" philosophy as the type scale, rather than a sprawling numeric scale meant for a much larger design system. Same scale used across both public and admin screens (no separate denser admin scale).

| Token | Value | Typical use |
|---|---|---|
| xs | 8px | Tight gaps — icon-to-label spacing, small internal padding, gap between chips |
| sm | 16px | Form field spacing, button padding |
| md | 24px | Card padding, spacing between related elements |
| lg | 40px | Spacing between distinct sections on a page; space below the chips; vertical gap between shelves (48px = lg + xs) |
| xl | 64px | Page-level margins, spacing around major content blocks (e.g. above the hero headline) |

---

## 4. Borders, rules, and corners

- **Rule weight:** 1px hairline throughout, using the border color (`#D9D3C7`) — never a heavier "divider" style. Two exceptions: the shelf ledge (§7.3), a 10px solid band because it represents a physical shelf; and the public header's **double rule** (§9.1) — two hairlines 4px apart, echoing the double rules on spines and drawn covers.
- **Where rules appear:** under the site header; under the search line (a single bottom rule, no box — §9.3); between rows in table-style admin screens (Requests, Books list, My Reads list) — hairline row dividers, not zebra-striping; framing the book details modal and the hover card.
- **Corner radius — two shapes, by role:**
  - **Pill (fully rounded, `999px`):** anything you press or that labels a state — all buttons (§5), genre chips (§10), status badges in the details modal, and the "?" help icon (circular).
  - **3px:** containers — the details modal, the hover card, admin cards, form inputs, cover images.
  - **Spines:** 2px on the top corners only, so they sit flush on the shelf ledge.

  *History:* 3px was originally applied everywhere, after sharp corners read too ledger-like. Pills were adopted in October 2026 from the reference catalogue; limiting them to pressable/state elements keeps containers feeling quiet and classical.

---

## 5. Buttons

| Type | Treatment | Used for |
|---|---|---|
| Primary | Sage green fill (`#697560`; hover `#596352`), cream text, pill shape | Main call-to-action per screen — "Request to borrow," "Submit," "Apply" |
| Secondary | Outline — sage border, no fill, sage text, pill shape | Lower-emphasis actions — "Cancel" (borrower-side), "Regenerate link" |
| Destructive | Terracotta/rust fill (`#A85838`), cream text, pill shape | Actions that undo or remove something — admin "Cancel request," "Delete" on My Reads |

All buttons use Inter medium weight for labels, consistent with the rest of the UI-text scale. Minimum height 40px; horizontal padding 20px (slightly wider than before, as pills need more side room to look balanced).

---

## 6. Modal treatment

Applies to the book details modal and the passcode/request-form flow that replaces its content in place (not a separate stacked modal — see below).

- **Overlay:** dimmed scrim behind any open modal.
- **Flow continuity:** the passcode popup and request form are **not** separate modals layered on top of the details modal — they replace its content within the same modal container, so the borrowing flow feels like one continuous interaction (details → passcode → form) rather than a stack of overlapping layers.
- **Desktop sizing:** fixed width, 560px, centered. Height grows/shrinks naturally with content — same width held across all three steps so the modal doesn't jump horizontally as content changes. Details view lays out as cover (112px wide) beside the text.
- **Mobile sizing:** full-screen takeover (not a floating centered box) — content reflows to full width with the same generous internal padding, visible "×" close control at the top. Cover stacks above the text.
- **Status:** shown as a pill badge (§4) in the status colour (§2.3) — outline and a small dot in the same colour, no fill.
- **Transition:** simple fade in/out — no scale/motion effects, consistent with the restrained, quiet brief.
- **Closing behaviour, state-dependent:**
  - **Details view** (browsing only, nothing to lose): click-outside, "×" button, and Escape key all close the modal.
  - **Passcode / request-form steps** (in-progress data at risk): click-outside and Escape are **disabled** — only the explicit "×" button (or completing the flow) closes the modal. This prevents an accidental stray click from silently discarding a half-filled form.

---

## 7. Book spines

Per §14 of `Technical_Specifications.md` — generic, must not resemble miniature covers, may vary in dimensions.

### 7.1 Long title handling

Spines are quick visual identifiers — full detail lives in the hover card and details modal, not on the spine itself:

1. **Titles containing a subtitle marker (a colon)** — truncate at the colon, showing only the main title (e.g. "Sapiens: A Brief History of Humankind" → "Sapiens"; "How to Read a Book: The Classic Guide to Intelligent Reading" → "How to Read a Book"). Unchanged from the original rule.
2. **Long titles with no colon** — set on a **single vertical line**; if it runs past the spine's height, it ends with an ellipsis (e.g. "The Brief Wondrous Life of Oscar Wao" → "The Brief Wondrous Life of Osca…" on a short spine). Font size also steps down by 1px for titles over 22 characters, which lets most fit without truncation.
3. **Short titles** — fit naturally, no truncation.

### 7.2 Spine appearance

- **Orientation:** title runs **vertically, top to bottom** (`writing-mode: vertical-rl`), the usual convention for English-language spines.
  *History:* originally horizontal, chosen for readability. Reversed in October 2026 — the hover card (§11) now carries readable detail on desktop, so the spine can prioritise looking like a real shelf.
- **Dimensions:** both vary per book — height 190–259px, width 30–53px. Each is derived from a hash of the book's `id`, so every book always gets the same size, and nothing jumps between page loads.
- **Fill:** one of the thirteen spine palette shades (§2.5), also chosen from the hash. A soft horizontal gradient (darker at both edges, a faint highlight just left of centre) and a 1px light inset at the top give each spine a slightly rounded, bound look — shading only, never texture or imagery.
- **Title treatment:** one of two, chosen from the hash, both in Libre Caslon Text:
  1. Regular
  2. Italic

  Titles always appear **exactly as written in the catalogue** — no change of case. *(An all-capitals third treatment was tried and removed in October 2026: it made a third of titles look different from the catalogue.)*

  Size: 15px on spines wider than 44px, 13px on spines wider than 36px, 12px otherwise; titles longer than 22 characters (after colon truncation) drop 1px; never below 11px.
- **Bindery details** (generic, drawn in the spine's own text colour at low opacity), one of, chosen from the hash:
  - none
  - a pair of thin double rules near the top and bottom
  - a single translucent horizontal band about a fifth of the way down

  These are what make the shelf feel varied without reproducing any real cover (§14). Spines never show cover art, publisher logos or colours taken from the real book.
- **Author:** the author's family name at the foot of the spine, Inter label style (§1.2), 8px, 70% opacity — echoing where a publisher's mark or author name sits on a real spine.
  - **Which part is the family name:** if the author field marks it in capitals (e.g. "Haruki MURAKAMI", "MO Yan", "R.F. KUANG"), that part is used, wherever it sits in the name. Otherwise the last word is used, with particles like "du" or "Le" kept ("Daphne du Maurier" → "du Maurier"). The capitals convention is what makes family-name-first and many Asian names show correctly; see Technical_Specifications.md §16.
  - Only the spine uses this. The hover card, details modal and My Reads show the author exactly as typed.
- **Interaction:** on hover or keyboard focus the spine lifts 8px (`translateY(-8px)`, 180ms ease). Focus also shows the standard 2px sage focus ring. Click/tap opens the details modal (§6).

### 7.3 Shelf layout — stacked shelves

- Spines sit side by side with a 2px gap, bottom-aligned, wrapping onto new rows as the width runs out. Rows are centred.
- Each row rests on a **shelf ledge**: a 10px band in the ledge colour (`#E4DDCF`, §2.1) running under the spines, with a soft shadow below it.
- 48px vertical gap between shelves.
- Same pattern at all screen widths — narrower screens just fit fewer spines per shelf.

*Considered and rejected:* a single long horizontally-scrolling shelf (as in the reference). It looks striking, but with a full catalogue it means a lot of sideways scrolling to find anything.

---

## 8. Mobile / responsive behaviour

Per §32 of `Technical_Specifications.md`.

- **Public catalogue / shelves:** same stacked-shelf pattern at all screen sizes (§7.3) — narrower viewports simply fit fewer spines per shelf. No separate mobile-specific layout.
- **Hero:** the Display headline scales down with the viewport (`clamp`, §1.3); padding above it reduces from 64px to 40px below 600px wide. Page side gutter is 16px below 600px, 24px above.
- **Genre chips:** wrap onto as many centred rows as needed.
- **Hover card:** not shown on touch devices (§11) — a tap on a spine opens the details modal directly.
- **Book details modal:** full-screen takeover on mobile (§6), rather than a small floating box.
- **Admin tables/lists** (Requests, Books list, My Reads list): collapse to a **stacked card-per-row** format on narrow screens — each row's fields (e.g. a request's book, requester, date, action) stack vertically as a small card instead of horizontal table columns. Chosen over a simpler horizontally-scrollable table for a meaningfully better mobile experience, since admin usability on mobile (even as a secondary use case) was an explicit requirement.

---

## 9. Catalogue page — header, hero and search

The catalogue (home) page reads top to bottom: header → hero → search → genre chips → shelves.

### 9.1 Site header

- **Left:** the logo icon only (36×36px, 3px corners), linking home. Its accessible label is the library name.
- **Right**, in order:
  1. **Catalogue · My Reads** — Inter label style (11px, uppercase, `0.2em`), no underlines, each a pill-shaped hit area (9px × 14px padding, transparent border). Hover: a sage outline.
     - **Current page:** a **filled pill** in the primary text colour with cream text — the same treatment as the selected genre chip (§10). Marked with `aria-current="page"`.
  2. **"?" help icon** — 32px circle, hairline border, sage border on hover.
  3. **Admin** — a small link set apart by a short vertical hairline: Inter 10px label style, muted, 75% opacity; sage on hover. Kept deliberately quiet — friends don't need it.
- **Rule underneath:** a **double rule** — two 1px hairlines 4px apart (§4).
- The library's name is **not** repeated in the header — it appears once, in the hero (§9.2).
- **Help card** (opened by "?"): the same card style as the spine hover card (§11) — 300px wide, hairline border, 3px corners, 16px padding, soft shadow — aligned under the icon's right edge. Heading "How it works" in Libre Caslon Text 18px; two short sections ("Borrowing", "My Reads") with label-style headings. Closes with "×", a click outside, or Escape.
- **Phone:** the same row; link padding tightens to 8px × 10px and gaps shrink so everything fits at 360px wide.

### 9.2 Hero

Centred, with 64px above and 40px below. Three lines, 16px apart:

1. **Library name** — "(automated) book teller machine", Inter label style (12px, uppercase, `0.28em`), muted text colour.
2. **Headline** — "Please make a withdrawal", Display size (§1.3), italic Libre Caslon Text, primary text colour. A play on the library's teller-machine name (the ATM prompt) that doubles as an invitation to borrow.
   - **Typing effect:** on first load the headline types itself out once (about 55ms per character, starting after 250ms), followed by a thin blinking caret. The full text is in the page's HTML, so it reads correctly without JavaScript and to screen readers. With `prefers-reduced-motion`, the text appears at once and the caret is hidden.
3. **Volume count** — "97 volumes", Inter label style, muted. The number is the count of active books in the catalogue. While a search or genre filter is active, it reads "12 of 97 volumes".

### 9.3 Search line

- Max width 720px, centred.
- A single text field with **no box** — only a 1px bottom rule (§4), which turns sage on focus. Text centred, 18px.
- Placeholder: "What are you looking for?" in italic Libre Caslon Text, muted colour.
- Searches title, author and genre, as before (Technical_Specifications.md §14). Submitting keeps any selected genre chip.

---

## 10. Genre chips

A row of filter chips between the search line and the shelves (24px below the search line).

- **Shape and type:** pill, 1px border in the rule colour, Inter label style (11px, uppercase, `0.14em`), 4px × 14px padding, 8px gap. Wrap onto centred rows.
- **Which chips show:**
  1. **All** — always first.
  2. The **five most common genres** — ranked by how many active books carry that genre; ties broken alphabetically.
  3. **More (n)** — only if there are more than five genres; *n* is how many are hidden. Dashed border and muted text, to read as a control rather than a genre. Clicking it shows the remaining genres inline (alphabetical) and the chip becomes **Less**.
- **Selected chip:** filled in primary text colour with cream text. Exactly one chip is selected at a time; "All" is selected by default.
- **Selecting a hidden genre:** choosing a genre from under "More" closes the list again, but that genre's chip stays visible after the top five so the active filter is never hidden.
- **Hover / focus:** border turns sage; keyboard focus shows the standard 2px sage focus ring.
- **Multiple genres per book:** a book's genre field can hold several genres separated by semicolons (e.g. "Fiction; Historical Fiction"). Each counts separately for ranking, and the book appears under every one of its genres (Technical_Specifications.md §14).

---

## 11. Spine hover card

A small card that previews a book when you point at its spine — an extra on desktop, never the only way to reach information.

- **When it shows:** on mouse hover over a spine, on devices with a fine pointer that can hover; and on keyboard focus of a spine (all devices). Hidden on mouse-leave, blur, and any scroll. Never on touch — a tap goes straight to the details modal.
- **Content:**
  1. Full title (not the truncated spine title) — Libre Caslon Text, 20px.
  2. Author — Inter label style (12px, uppercase, `0.14em`).
  3. Genres, joined with " · " — Inter 12px, muted.
  4. "Click for availability" — Inter 12px, sage.

  No status, cover, year or format: the catalogue only loads title/author/genre for the shelf, and availability is loaded when the details modal opens (Technical_Specifications.md §33).
- **Appearance:** 260px wide, cream background, 1px hairline border, 3px corners, 16px padding, a soft drop shadow so it lifts off the page.
- **Position:** centred above the spine with a 16px gap; flips below the spine if there's no room above; kept at least 12px inside the window edges.
- **Behaviour:** purely visual (it can't be clicked, and doesn't take pointer events); fades and rises 4px in over 120ms.
- **Reconciling with the "no hover" rule** in `ui-specification.md` §1.1: that rule stops hover being the *only* way to reach something. The hover card only previews what the details modal already shows, so touch users lose nothing.

---

## 12. My Reads — "Transaction history"

The public My Reads page (ui-specification.md §1.2). Same structure as the catalogue so the two pages read as a pair. The nav link stays "My Reads".

### 12.1 Hero

As §9.2, with:
1. **Library name** label — "(automated) book teller machine".
2. **Headline** — "Transaction history", Display size, italic Libre Caslon Text. No typing effect (that stays unique to the catalogue).
3. **Count** — "42 books read", Inter label style. Counts entries in the feed, so a re-read counts again. Singular: "1 book read".

### 12.2 Read cards

A single column, max 760px wide, centred. Cards are separated by hairline rules (above the first and below the last too), 32px vertical padding.

Each card: cover on the left (96px wide, 2:3), content on the right, 24px gap. Content, top to bottom:

1. **Title** (Libre Caslon Text, 22px) with the **rating** aligned to the right on the same line (wrapping below on narrow screens).
2. **Author** — Inter label style (12px, uppercase, `0.14em`), shown as typed.
3. **Labels row** — the source pill first, then one outline pill per genre (split on ";", technical-specifications.md §14.3). Genre pills are labels only, not links or filters.
4. **Notes** — Inter 15px, line-height 1.7, set off by a 1px rule on the left with 16px padding, like a margin note. Clamped to **4 lines**; if (and only if) the note is cut off, a "Read more" link appears below and expands it in place ("Show less" to collapse). Must work without JavaScript.
5. **"See availability →"** — Inter 12px, sage — only on "On my shelf" entries.

**Rating** — five 9px circles, 4px apart, outlined in the primary text colour: filled for each whole point, half-filled (left half) for a half point. Accessible label "Rated 4.5 out of 5". No rating → nothing shown.

**Source pills** (11px Inter, pill shape):

| Source | Pill | Style |
|---|---|---|
| `Owned` | "On my shelf" | Pale sage tint fill (`#E9ECE4`), dark sage text, medium weight |
| `NLB` | "NLB" | Hairline outline, muted text |
| none | — | No pill |

**Linking** — an "On my shelf" card is one link (the whole card) to that book's details modal in the catalogue (ui-specification.md §1.2). Hover: a very faint sage wash and the title underlines. Other cards aren't links.

### 12.3 Covers

- The real cover where one exists, 3px corners, hairline border.
- **No cover → a drawn cover** in the spine style (§7.2): fill from the spine palette (§2.5) chosen from a hash of the read's id, the same gradient shading, thin double rules near top and bottom, the title in Libre Caslon Text (12px) near the top and the family name (§7.2's rule) in the 7px label style at the foot. It must not imitate the real cover — same rule as spines (Technical_Specifications.md §14).

### 12.4 Mobile

Cover shrinks to 72px with a 16px gap; title 19px; 24px card padding. Everything else as desktop.

---

## 13. Borrowing flow wording and the receipt

### 13.1 Wording

Layout, rules and behaviour are unchanged (§6, workflows.md §3) — only these strings change:

| Where | Before | After |
|---|---|---|
| Passcode step heading | "Enter the borrow passcode" | "Please enter your *passcode*" (the word *passcode* in italic) |
| Passcode step, under the heading (new) | — | "Friends of the library get the passcode from the owner." — Inter 14px, muted |
| Passcode step, primary button | "Submit" | "Continue" |
| Request form, primary button | "Submit request" | "Complete withdrawal" |
| Confirmation heading | "Request submitted" | "Please take your receipt" |

Error messages, field labels and validation text stay exactly as they are.

The passcode field becomes a larger, centred input: 48px tall, 22px text with `0.4em` letter-spacing, on the paper colour (`#FDFBF7`), 3px corners.

### 13.2 The receipt slip

The one visual nod to the teller machine. Used for **both** the confirmation (inside the details modal, right after a request is submitted) and the request page reached from the saved link (`/request/manage/{token}`).

- **Shape** — a narrow slip, max 380px wide, centred; paper colour `#FDFBF7`; 32px × 24px padding; a soft drop shadow; **zig-zag torn edges** top and bottom (8px teeth, drawn with a CSS mask — no images).
- **Head** (centred) — the library name in the label style (10px, `0.24em`), then the heading in italic Libre Caslon Text, 26px:
  - confirmation: "Please take your receipt"
  - request page: "Your request"
- **Dashed rules** (1px, rule colour) separate the head, the line items and the link box.
- **Line items** — label left (Inter 10px uppercase, `0.18em`, muted), value right (Inter 13px, tabular figures):

  | Label | Value |
  |---|---|
  | Transaction | "Borrow request" |
  | Book | Title, in Libre Caslon Text 15px |
  | Requested | Date and time of the request, e.g. "11 Oct 2026, 23:04" |
  | Status | Status pill (as §6): **Pending** in the checked-out amber, **Approved** in the available green, **No longer active** muted |
  | Queue | Pending only — the existing wording ("You are 2nd in line" / "0 ahead — you're next") |

  No names of any kind appear on the slip (Technical_Specifications.md §11).
- **Receipt link box** (confirmation only) — 1px *dashed* border in the primary text colour, 3px corners, 12px padding:
  - label "Your receipt link" (10px uppercase, medium);
  - the full link (12px, wraps anywhere);
  - "Copy link" as a small secondary pill ("Copied!" after copying);
  - the warning in terracotta: "Save this link now. It won't be shown again, and it's the only way to check or cancel your request. If you lose it, ask the library owner for a new one." This is the persistent banner required by workflows.md §3.5 — same meaning, new place.
- **Cancel request** — destructive pill, centred, smaller (36px tall); only while pending.
- **Request page, other states** — Approved: line items plus "Approved." below; Returned/Cancelled: line items with the "No longer active" pill and "This request is no longer active." below. Invalid link: no slip — just the existing plain message.
- **Foot** — "Thank you for borrowing", centred, 11px label style, muted.

