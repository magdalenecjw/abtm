# Automated Book Teller Machine — UI Specification (Screens & Information Architecture)

**Document status:** Supplements `Technical_Specifications.md` v1.2 and `docs/workflows.md`
**Date:** 12 September 2026 · **Revised:** 11 October 2026 (catalogue redesign — §1.1 header and hover rule, new §1.3 Catalogue content; teller touches — §1.2 My Reads as "Transaction history", new §1.4 borrowing screens) · 12 October 2026 (§1.1 header: current-page marker, Admin link)

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

- **Header:** the logo icon on the left (links home), then two nav items — **Catalogue** and **My Reads** — with the **current page highlighted**, a persistent **"?" help icon**, and a small, muted **Admin** link at the far right (for the owner; it leads to the admin login). The library's name is not shown in the header; it appears once, in the catalogue hero (§1.3). See `visual-system.md` §9.1.
- **Help icon:** click-to-open (not hover — hover has no reliable mobile equivalent), shows **one combined static popup** covering both "how borrowing works" (passcode → request → approval → receipt link) and a brief note on My Reads ("On my shelf" / NLB labels). Not a separate route. Closes with "×", a click outside, or Escape.
- **Hover in general:** hover may *preview* information (e.g. the spine hover card, §1.3) but must never be the only way to reach something or perform an action, because it has no reliable mobile equivalent.
- Screens 2–5 are reached only through interaction on the Catalogue (or directly via the saved management link for screen 5) — none has its own nav entry.

### 1.2 My Reads (public feed) — content

Presented as **"Transaction history"** (visual treatment: `visual-system.md` §12). The nav link stays "My Reads".

- **Hero:** library name label, the headline "Transaction history", and a count ("42 books read" — one per entry, so re-reads count again).
- **Layout:** reverse-chronological feed of read cards, no search/filter (browsing/discovery, not lookup).
- **Per entry, shown:** cover (or a drawn cover in the spine style when there isn't one), title, author, genres (as label pills — not filters), rating (five dots), notes (clamped to 4 lines with "Read more"). All treated as public-appropriate content — no private/public distinction on notes.
- **`date_read`:** not shown (used only for ordering). No year headings, for the same reason.
- **`source` label:**
  - `Owned` → an "On my shelf" pill, and the whole entry links through to the same book details modal used on the catalogue (via catalogue navigation, not a distinct URL), so a friend can see live availability/borrow status. Shows "See availability →".
  - `NLB` → an "NLB" pill, informational only — no live link or integration with the actual NLB system.
  - Blank/other → no label shown.

### 1.3 Catalogue (home) — content

Top to bottom (visual treatment in `visual-system.md` §7, §9–11):

1. **Hero** — the library name "(automated) book teller machine" as a small label; the headline **"Please make a withdrawal"**; and the volume count ("97 volumes", or "12 of 97 volumes" while a search or genre filter is active).
2. **Search line** — one field searching title, author and genre.
3. **Genre chips** — **All**, the five most common genres, and **More (n)** to reveal the rest. One genre selected at a time. A book whose genre field lists several genres separated by semicolons appears under each of them.
4. **Shelves** — every matching active book as a spine, on stacked shelves.
   - **Hover / keyboard focus** on a spine (desktop pointer or keyboard only) shows a **hover card**: full title, author, genres, "Click for availability".
   - **Click / tap** a spine → Book details modal (screen 2).
5. **Empty result** — if nothing matches, the shelves are replaced with "Nothing on the shelf matches that."

Search text and the selected genre live in the page address (`?q=…&genre=…`), so a filtered view can be refreshed, shared, or reached with the back button, and works without JavaScript.


### 1.4 Borrowing screens — content

Behaviour is unchanged (`docs/workflows.md` §3–4); this pass changes wording and the confirmation/status presentation (`visual-system.md` §13).

- **Passcode (screen 3):** heading "Please enter your passcode", a one-line hint ("Friends of the library get the passcode from the owner."), buttons **Continue** and **Cancel**. Error messages unchanged.
- **Request form (screen 4):** fields and rules unchanged; primary button **Complete withdrawal**.
- **Confirmation and request status (screen 5):** shown as a **receipt slip**, with line items — transaction ("Borrow request"), book title, date and time requested, status, and queue position while pending.
  - Confirmation: heading "Please take your receipt", plus the receipt link box (link, Copy link, the save-it-now warning) and Cancel request.
  - Saved-link page: heading "Your request", the same line items, and Cancel request while pending.
  - Never shows any borrower's real name or nickname, or collection/return dates (Technical_Specifications.md §11).

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

Eight clickable stat boxes, laid out two rows of four. Each box is both a number and a navigation shortcut into the relevant filtered screen — there are no separate content sections beyond these eight boxes (a deliberate simplification versus the original §20 sketch, which proposed a stat grid plus separate list sections).

| # | Box                                                                                                                                                                                                                                            | Links to                                                   |
| - | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 1 | Total books                                                                                                                                                                                                                                    | Books list                                                 |
| 2 | Available                                                                                                                                                                                                                                      | Books list, filtered to Available                          |
| 3 | Checked out                                                                                                                                                                                                                                    | Books list, filtered to Checked out                        |
| 4 | On loan                                                                                                                                                                                                                                        | Books list, filtered to On loan                            |
| 5 | Pending requests                                                                                                                                                                                                                               | Requests, filtered to Pending                              |
| 6 | Not yet collected                                                                                                                                                                                                                              | Requests, filtered to that flag                            |
| 7 | Long loan *(combines the "Needs attention," "Long loan," and "Very long loan" tiers from `docs/workflows.md` §5.3 into one dashboard count — the three-tier breakdown with its own colour grading still exists on the Requests screen itself)* | Requests, filtered to any of the three loan-duration flags |
| 8 | Total reads                                                                                                                                                                                                                                    | My Reads admin list                                        |

**Note:** "Available" is included as a dashboard stat because it provides a useful at-a-glance view of the catalogue's current availability. The dashboard does not include any email-delivery statistic because email delivery is no longer part of version 1. The borrowing flow does not collect email addresses, and no transactional email service is used.

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

- Exact visual treatment for the remaining screens (typography, colour, spacing, borders) — see `visual-system.md`; the catalogue page is fully specified there (§7, §9–11).
- Detailed field-by-field layout/wireframes for each screen — this document defines *what* exists and *where it lives*, not pixel-level layout.
