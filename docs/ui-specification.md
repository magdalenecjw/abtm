# Automated Book Teller Machine — UI Specification (Screens & Information Architecture)

**Document status:** Supplements `Technical_Specifications.md` v1.2 and `docs/workflows.md`
**Date:** 12 September 2026

This document defines the complete screen inventory, navigation structure, and screen-level content for both the public and admin experiences. Detailed step-by-step *behaviour* for each workflow (form validation, state transitions, server logic) lives in `docs/workflows.md` — this document focuses on *what exists* and *how it's organised*, not the mechanics of each action.

---

## 1. Public screens

| # | Screen | Type | Reached via |
|---|---|---|---|
| 1 | Catalogue (home) | Full page | Landing page / "Catalogue" nav link |
| 2 | Book details modal | Modal, overlays catalogue | Click a book spine |
| 3 | Passcode popup | Popup, overlays details modal | Click "Request to borrow" |
| 4 | Request form | Full page / step | After passcode verified |
| 5 | Request status view | Full page (shared component) | Post-submission redirect (the only time the raw management link is shown), or via that saved link (`/request/manage/{token}`) later |
| 6 | My Reads (public feed) | Full page | "My Reads" nav link |

There are **no individual book pages** (per §14 of the technical spec) — book detail is always a modal over the catalogue, never its own URL.

### 1.1 Public navigation

- **Header:** two nav items — **Catalogue** and **My Reads** — plus a persistent **"?" help icon**.
- **Help icon:** click-to-open (not hover — hover has no reliable mobile equivalent), shows **one combined static popup** covering both "how borrowing works" (passcode → request → approval → management link) and a brief note on My Reads / NLB tagging. Not a separate route.
- Screens 2–5 are reached only through interaction on the Catalogue (or directly via an emailed link for screen 5) — none has its own nav entry.

### 1.2 My Reads (public feed) — content

- **Layout:** reverse-chronological feed, no search/filter (browsing/discovery, not lookup).
- **Per entry, shown:** cover, title, author, genre, rating, notes (all treated as public-appropriate content — no private/public distinction on notes).
- **`date_read`:** not shown.
- **`source` label:**
  - `Owned` → entry links through to the same book details modal used on the catalogue (via catalogue navigation, not a distinct URL), so a friend can see live availability/borrow status.
  - `NLB` → shown as an informational label only (e.g. "Available via NLB") — no live link or integration with the actual NLB system.
  - Blank/other → no label shown.

---

## 2. Admin screens

| # | Screen | Reached via |
|---|---|---|
| 1 | Login | Direct URL |
| 2 | Dashboard | Landing page after login |
| 3 | Requests | Nav |
| 4 | Books list | Nav → Catalogue |
| 5 | Book detail | Click a book in Books list |
| 6 | Covers (bulk upload) | Nav → Catalogue |
| 7 | Spreadsheet sync | Nav → Catalogue |
| 8 | My Reads (admin) — list, edit, delete | Nav → My Reads |
| 9 | Goodreads import | Nav → My Reads |

### 2.1 Admin navigation (sidebar)

```text
Dashboard          (landing page after login)
Requests
Catalogue
  ├─ Books
  ├─ Sync spreadsheet
  └─ Covers
My Reads
  ├─ Reading list
  └─ Import Goodreads
```

### 2.2 Dashboard — content

Eight clickable stat boxes, laid out two rows of four. Each box is both a number and a navigation shortcut into the relevant filtered screen — there are no separate content sections beyond these eight boxes (a deliberate simplification versus the original §20 sketch, which proposed a stat grid *plus* separate list sections).

| # | Box | Links to |
|---|---|---|
| 1 | Total books | Books list |
| 2 | Checked out | Books list, filtered to checked out |
| 3 | On loan | Books list, filtered to on loan |
| 4 | Pending requests | Requests, filtered to Pending |
| 5 | Not yet collected | Requests, filtered to that flag |
| 6 | Long loan *(combines the "Needs attention," "Long loan," and "Very long loan" tiers from `docs/workflows.md` §5.3 into one dashboard count — the three-tier breakdown with its own colour grading still exists on the Requests screen itself)* | Requests, filtered to any of the three flags |
| 7 | Email delivery failures | Requests, filtered to `email_delivery_failed = TRUE` |
| 8 | Total reads | My Reads admin list |

Note: "Available" was deliberately excluded from the dashboard — not important enough for an at-a-glance box, browsable via the Books list instead.

### 2.3 Requests — content

Fully specified in `docs/workflows.md` §5. Summary: filterable dashboard (status checkboxes + "Show history" toggle; independent flag checkboxes; basic title search), with one-click admin actions (approve, cancel, mark collected, mark returned, regenerate management link) — see that document for full behaviour.

### 2.4 Books list — content

- Searchable/filterable table of **all** books, including inactive ones (unlike the public catalogue, which only shows active books).
- Click a row → Book detail screen.

### 2.5 Book detail — content

**Read-only for all catalogue metadata** (`title`, `author`, `genre`, `notes`, `active`) — the spreadsheet is the sole source of truth for these fields (per `docs/workflows.md` §6); there is no manual edit form for them here. Correcting metadata always means: edit the spreadsheet, re-sync.

What this screen *does* provide:
- Display of all metadata, for reference/verification.
- **Cover upload** for this specific book (single-file case of the unified upload mechanism — `docs/workflows.md` §8).
- **Loan history** for this book — past and current requests, giving context without needing to cross-reference the Requests screen separately.

### 2.6 Covers (bulk upload) — content

Fully specified in `docs/workflows.md` §8. One unified upload mechanism (usable here for many files at once, or from Book Detail for a single file) — filename-matched to `book_id`, validated, previewed (new / replacement / unmatched, with thumbnails), applied per-file independently.

### 2.7 Spreadsheet sync — content

Fully specified in `docs/workflows.md` §6. Manual `.xlsx` upload → validation (blocks on failure, all errors shown at once) → preview (new / updated-with-diff / unchanged-count / missing-warning) → atomic apply.

### 2.8 My Reads (admin) — content

- **List view** — all reads, full admin-facing detail (title, author, genre, rating, notes, `date_read`, `source`, `book_id` link status).
- **No "add new" entry point.** Goodreads import (2.9) is the only way rows are created — this reflects the real workflow: export from Goodreads, import, then curate.
- **Edit** — every field editable post-import (expected to be the main workflow: trimming/revising ratings and review text after the raw import).
- **Delete** — hard delete, no restrictions (nothing references `reads` as a foreign key), for removing unwanted or mismatched imports entirely.

### 2.9 Goodreads import — content

Fully specified in `docs/workflows.md` §7. Manual CSV upload → shelf filtering (silent) → duplicate detection (`goodreads_id`) → catalogue matching (title+author) → editable preview (source/book_id/rating/notes editable; title/author/date_read locked) → atomic apply.

---

## 3. Full screen count

**Public:** 6 screens (1 full catalogue page, 1 feed page, 1 shared status page, 3 modal/popup steps within the borrowing flow)
**Admin:** 9 screens (login, dashboard, requests, books list, book detail, covers, sync, my reads list, goodreads import)

**Total: 15 screens**, deliberately kept lightweight — several are steps/overlays rather than independent full pages, consistent with the project's "avoid unnecessary complexity" principle.

---

## 4. Open items not covered by this document

- Exact visual treatment for each screen (typography, colour, spacing, borders) — deferred to the visual design step.
- Detailed field-by-field layout/wireframes for each screen — this document defines *what* exists and *where it lives*, not pixel-level layout.
