# Automated Book Teller Machine — Visual System

**Document status:** Complete — typography, color palette, spacing, borders/corners, buttons, modal treatment, book spines, and mobile behaviour all defined.
**Date:** 12 September 2026

This document defines the concrete visual language implementing the design direction set out in §31 of `Technical_Specifications.md` (classical, refined, quiet, clean, contemporary, typography-led, generous whitespace, thin rules, restrained borders — explicitly avoiding parchment, sepia, distressed textures, Victorian ornament, and generic SaaS aesthetics).

---

## 1. Typography

### 1.1 Typefaces

| Role | Typeface | Source |
|---|---|---|
| Headings / identity / titles | **Libre Caslon Text** | Google Fonts |
| Body / UI / functional text | **Inter** | Google Fonts |

**Rationale:** Libre Caslon Text is genuinely rooted in traditional book/print typesetting — it supplies the "classical library catalogue card" character the brief calls for. Inter is clean, neutral, and highly legible at small UI sizes. The deliberate contrast between a historically-rooted serif and a contemporary neutral sans is itself the intended "classical interpreted through a contemporary system" effect — rather than picking two fonts from the same era/mood.

### 1.2 Usage rules

- **Libre Caslon Text** is used for: site title/logo, top-level page headings, and **book titles everywhere** — including book spines in the catalogue grid, the book details modal, and My Reads entries. One consistent weight throughout (its regular cut) — no bold Caslon anywhere, keeping headings quiet rather than shouty.
- **Inter** is used for everything else: body text, descriptions, notes/review text, form fields, buttons, nav links, table cells, status labels, timestamps. Regular weight for body/UI text; a medium weight (not full bold) is available for elements needing slight emphasis (button labels, active nav state), keeping emphasis restrained rather than high-contrast.

### 1.3 Type scale

Five sizes, deliberately minimal for an app of this scope:

| Role | Typeface | Size | Used for |
|---|---|---|---|
| Page heading | Libre Caslon Text | 2rem (32px) | Site title/logo, top-level page titles ("Catalogue," "My Reads," "Requests," admin section headers) |
| Card / book title | Libre Caslon Text | 1.25rem (20px) | Book titles — spines, details modal, My Reads entries |
| Body | Inter | 1rem (16px) | Descriptions, notes, review text, form field values, general reading content |
| UI text | Inter | 0.875rem (14px) | Buttons, nav links, form labels, table cells |
| Small / caption | Inter | 0.75rem (12px) | Status labels ("Available," "Needs attention"), timestamps, queue position text, helper/meta text |

*Note: exact sizes are a starting proposal, not yet validated against an actual rendered mockup — expect to revisit once screens are built out.*

---

## 2. Color palette

Direction: a neutral, ink-and-paper-inspired base (not warm/aged — closer to a well-printed book page than an antique document), with a sage/forest green + terracotta accent family, evoking a mid-century-adjacent but still restrained, classical feel. Deliberately avoids browns/sepia/parchment tones that would read as "faux-aged."

### 2.1 Base / neutral

| Role | Color | Hex |
|---|---|---|
| Background | Cream | `#FAF6EF` |
| Primary text | Warm near-black | `#2B2925` |
| Borders / rules | Soft warm grey | `#D9D3C7` |

### 2.2 Accent (interactive elements)

| Role | Color | Hex |
|---|---|---|
| Links, buttons, active nav state | Sage green | `#8A9A7E` |

Deliberately distinct from the "Available" status green below, even though both sit in the green family — different roles (interactive vs. status) that shouldn't be visually conflated, but the shared family keeps them feeling related rather than arbitrary.

### 2.3 Book status colors (Technical_Specifications.md §14–15)

| Status | Color | Hex |
|---|---|---|
| Available | Forest green | `#3B5D45` |
| Checked out | Amber / ochre | `#C08A3E` |
| On loan | Soft terracotta | `#C1704F` |

### 2.4 Loan-duration flag colors (`docs/workflows.md` §5.3)

Terracotta family, graduated by intensity. No reinforcement beyond color shade (no icons/weight changes) — judged unnecessary for a small, low-volume private library.

| Flag | Color | Hex |
|---|---|---|
| Not yet collected | Light terracotta / clay | `#D9A98A` |
| Needs attention (30–89 days) | Soft terracotta | `#C1704F` |
| Long loan (90–179 days) | Medium terracotta | `#A85838` |
| Very long loan (180+ days) | Deep terracotta / rust | `#7A3E26` |

*Note: "On loan" (book status) and "Needs attention" (loan-duration flag) intentionally share the same shade (`#C1704F`) — they appear in different contexts (public book status vs. admin dashboard flag) and are not expected to be seen side-by-side, so the overlap was judged acceptable rather than worth a further palette expansion.*

---

## 3. Spacing scale

Five steps, 8px base unit — matching the same "keep it minimal" philosophy as the type scale, rather than a sprawling numeric scale meant for a much larger design system. Same scale used across both public and admin screens (no separate denser admin scale).

| Token | Value | Typical use |
|---|---|---|
| xs | 8px | Tight gaps — icon-to-label spacing, small internal padding |
| sm | 16px | Form field spacing, button padding |
| md | 24px | Card padding, spacing between related elements |
| lg | 40px | Spacing between distinct sections on a page |
| xl | 64px | Page-level margins, spacing around major content blocks (e.g. above/below the catalogue grid) |

---

## 4. Borders, rules, and corners

- **Rule weight:** 1px hairline throughout, using the border color (`#D9D3C7`) — never a heavier "divider" style.
- **Where rules appear:** under page headings (separating title from content); between rows in table-style admin screens (Requests, Books list, My Reads list) — hairline row dividers, not zebra-striping; framing the book details modal and individual book spines.
- **Corner radius:** 3px, applied consistently to cards, buttons, status badges, and the modal. Chosen over fully sharp corners after visual comparison — sharp read too severe/ledger-like, while 3px softens just enough to feel contemporary without tipping into a rounded "app card" look.

---

## 5. Buttons

| Type | Treatment | Used for |
|---|---|---|
| Primary | Sage green fill (`#8A9A7E`), cream text, 3px radius | Main call-to-action per screen — "Request to borrow," "Submit," "Apply" |
| Secondary | Outline — sage border, no fill, sage text, 3px radius | Lower-emphasis actions — "Cancel" (borrower-side), "Regenerate link" |
| Destructive | Terracotta/rust fill (`#A85838`), cream text, 3px radius | Actions that undo or remove something — admin "Cancel request," "Delete" on My Reads |

All buttons use Inter medium weight for labels, consistent with the rest of the UI-text scale.

---

## 6. Modal treatment

Applies to the book details modal and the passcode/request-form flow that replaces its content in place (not a separate stacked modal — see below).

- **Overlay:** dimmed scrim behind any open modal.
- **Flow continuity:** the passcode popup and request form are **not** separate modals layered on top of the details modal — they replace its content within the same modal container, so the borrowing flow feels like one continuous interaction (details → passcode → form) rather than a stack of overlapping layers.
- **Desktop sizing:** fixed width, 560px, centered. Height grows/shrinks naturally with content — same width held across all three steps so the modal doesn't jump horizontally as content changes.
- **Mobile sizing:** full-screen takeover (not a floating centered box) — content reflows to full width with the same generous internal padding, visible "×" close control at the top.
- **Transition:** simple fade in/out — no scale/motion effects, consistent with the restrained, quiet brief.
- **Closing behaviour, state-dependent:**
  - **Details view** (browsing only, nothing to lose): click-outside, "×" button, and Escape key all close the modal.
  - **Passcode / request-form steps** (in-progress data at risk): click-outside and Escape are **disabled** — only the explicit "×" button (or completing the flow) closes the modal. This prevents an accidental stray click from silently discarding a half-filled form.

---

## 7. Book spines

Per §14 of `Technical_Specifications.md` — generic, must not resemble miniature covers, may vary subtly in dimensions.

- **Shape:** uniform width, height varies per book (not the reverse) — horizontal title text (chosen over vertical spine-style text after visual comparison, prioritizing readability for what is effectively a discovery/browsing tool, at some cost to strict "spine" literalism).
- **Fill:** solid neutral color from the base palette (alternating subtly between two close neutral shades so spines don't read as identical clones), no cover imagery — this is what keeps spines from becoming "miniature covers" despite the card-like shape.
- **Layout:** horizontal wrapping grid — spines flow left-to-right and wrap to new rows as needed, matching the README's shelf illustration. Same grid pattern is used at all screen widths (see §8, Mobile) — no separate mobile-specific layout.

### 7.1 Long title handling

Spines are meant to be quick visual identifiers — full detail lives in the details modal, not on the spine itself:

1. **Titles containing a subtitle marker (a colon)** — truncate at the colon, showing only the main title (e.g. "Sapiens: A Brief History of Humankind" → "Sapiens" on the spine; "How to Read a Book: The Classic Guide to Intelligent Reading" → "How to Read a Book," wrapping across two lines as needed). The full title remains visible in the details modal.
2. **Long titles with no colon** — wrap across multiple lines up to a maximum spine height, then truncate with an ellipsis (e.g. "The Brief Wondrous Life of Oscar Wao" → "The Brief Wondrous Life…").
3. **Short titles** — fit naturally within the spine's minimum height, no truncation needed.

---

## 8. Mobile / responsive behaviour

Per §32 of `Technical_Specifications.md`.

- **Public catalogue / spine grid:** same wrapping-grid pattern at all screen sizes — narrower viewports simply fit fewer spines per row. No separate mobile-specific layout, keeping the "shelf" metaphor and implementation consistent across devices.
- **Book details modal:** full-screen takeover on mobile (§6), rather than a small floating box.
- **Admin tables/lists** (Requests, Books list, My Reads list): collapse to a **stacked card-per-row** format on narrow screens — each row's fields (e.g. a request's book, requester, date, action) stack vertically as a small card instead of horizontal table columns. Chosen over a simpler horizontally-scrollable table for a meaningfully better mobile experience, since admin usability on mobile (even as a secondary use case) was an explicit requirement.

