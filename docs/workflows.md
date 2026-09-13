# Automated Book Teller Machine — Workflows

**Document status:** Supplements `Technical_Specifications.md` v1.0
**Date:** 12 September 2026

This document specifies the detailed, step-by-step behavior of the borrowing lifecycle, catalogue sync, and reading-history import workflows, at a level of precision suitable for implementation. It supersedes or extends the following sections of `Technical_Specifications.md`:

- §7 (Loan State Machine) — extended with a new transition
- §10 (Public Borrowing Request) — fully detailed
- §11 (Borrower Management Link) — fully detailed
- §12 (Admin Borrowing Workflow) — fully detailed
- §13 (Long-Loan Attention) — extended into two independent flagging systems
- §16 (Spreadsheet Synchronisation) — fully detailed
- §18–19 (Goodreads Import / My Reads) — fully detailed
- §17 (Cover Management) — fully detailed
- §5.3 (`loan_requests` table) — two new columns required
- §5.4 (`reads` table) — `source_detail` dropped, `source` converted to enum

Where this document conflicts with `Technical_Specifications.md`, this document takes precedence.

---

## 1. Schema changes required

Two columns must be added to `loan_requests` beyond what is defined in `001_initial_schema.sql`:

| Field | Type | Constraints | Description |
|---|---|---|---|
| `approved_at` | TIMESTAMPTZ | NULL | Set when status transitions to `APPROVED`. Used as the anchor for the "not yet collected" flag. |
| `email_delivery_failed` | BOOLEAN | NOT NULL, default FALSE | Set if the management-link email fails to send at request creation. Surfaced to admin; does not block request creation. |

These should be added via a new migration (e.g. `004_workflow_columns.sql`) before implementation begins.

---

## 2. Updated Loan State Machine

The state machine in §7 is extended with a new admin-only transition, to handle the case where an approved borrower never collects the book (e.g. changed plans, no-show):

```text
PENDING
   │
   ├───► APPROVED ───► RETURNED
   │         │
   │         └───► CANCELLED   (admin-only)
   │
   └───► CANCELLED   (borrower or admin)
```

| Current | Action | New | Who |
|---|---|---|---|
| PENDING | Admin approves | APPROVED | Admin |
| PENDING | Borrower cancels | CANCELLED | Borrower |
| PENDING | Admin cancels | CANCELLED | Admin |
| APPROVED | Admin records return | RETURNED | Admin |
| APPROVED | Admin cancels (e.g. no-show) | CANCELLED | Admin |

No distinction is made in the `status` field between "cancelled while pending" and "cancelled after approval" — both are represented identically as `CANCELLED`. The cause is not recorded.

All other transitions remain invalid.

---

## 3. Public Borrowing Request Workflow

### 3.1 Entry point

Visitor browses the catalogue → opens a book's details modal → book shows **Available** → clicks **"Request to borrow."**

The click immediately opens the passcode popup (see 3.2). No availability re-check happens at this point — the form opens optimistically. Availability (and all other state) is authoritatively re-validated only at final submission (3.4).

### 3.2 Passcode gate

A popup appears every time "Request to borrow" is clicked — there is no session-wide unlock. The passcode is re-entered fresh for every request.

**Behavior:**
- Explicit "Submit" button; no validate-as-you-type.
- Incorrect passcode → inline error ("The borrow passcode is incorrect."), retry allowed immediately.
- **Rate limiting:** 5 incorrect attempts (tracked by IP address) within a rolling window → locked out for 24 hours. Lockout message is intentionally vague ("Too many incorrect attempts. Please try again later.") — does not reveal remaining lockout time.
- Correct passcode → server issues a short-lived, single-use, opaque **verification token**:
  - Expires 30 minutes after issuance.
  - Client stores only this token (in memory), never the raw passcode.
  - The raw passcode value never persists in browser storage.

### 3.3 Request form (step two)

Shown after successful passcode verification. The token from 3.2 is carried invisibly with the form and submitted alongside it.

**Fields:**

| Field | Rules | Validation timing |
|---|---|---|
| Real name | 3–25 characters, letters and spaces only (no punctuation) | On submit |
| Nickname | 3–25 characters, letters and spaces only (no punctuation); publicly displayed while book is on loan | On submit |
| Email | Valid email format | On blur |

**Token expiry while filling the form:** If the verification token expires (30 min) or is otherwise invalid by the time the visitor submits, the server rejects the submission and the client returns to the passcode popup (3.2). Whatever the visitor had already typed into real name / nickname / email is **preserved client-side** so they don't need to retype it after re-verifying the passcode.

**Duplicate submissions are allowed** — the same visitor may hold multiple pending requests for the same book (each counted independently in the queue). To prevent accidental rapid double-submission specifically (double-clicks, page refresh, back-button resubmits):

- **Duplicate guard:** if a request for the same `book_id` + `email` was created within the last **5 minutes**, reject the new submission with a message such as "You've just submitted a request for this book. Please check your email."
- Beyond this 5-minute window, a second genuine request for the same book/email is permitted. The borrower can cancel any accidental extras via their management link.

### 3.4 Server-side submission sequence

Executed in this exact order on final form submission:

1. Receive: verification token, real name, nickname, email, book reference.
2. Validate verification token — exists, unexpired, unused. If invalid → reject; client bounces to passcode popup (3.2), form fields preserved.
3. Validate field formats (3.3 table). If invalid → reject with field-level errors.
4. Duplicate guard check (same `book_id` + `email` within last 5 minutes) → reject if matched.
5. Confirm the book still exists and `active = TRUE` → if not, reject with **"This book is no longer available in the catalogue."**
6. **Consume the verification token** (mark used) — only now, after all validation has passed. This means a visitor who fails on field validation or the duplicate guard does not need to re-enter the passcode; they can fix the issue and resubmit with the same still-valid token.
7. Create the `loan_requests` row with `status = PENDING`.
8. Generate a cryptographically secure management token; store only its hash (`management_token_hash`). The raw value is never persisted.
9. Send the management-link email to the supplied address.
   - **If email delivery fails:** this is non-fatal. The request stands as created. Set `email_delivery_failed = TRUE` on the row so it is surfaced to admin (see 5.1). The borrower is not shown any error related to this — their confirmation screen (3.5) still displays normally, since they reach it via redirect, not via the email.
10. Return confirmation data (queue position, cancel action) to the client.

### 3.5 Confirmation screen

Shown immediately after successful submission. This is the **same view/component** used for the borrower management link (Section 4) — see 4.3 for its exact content by state. At the moment of first display, the request is always `PENDING`, so it shows queue position and a cancel action.

---

## 4. Borrower Management Link Workflow

### 4.1 The link

- URL: `/request/manage/{token}`
- **No expiry.** Remains valid as long as the underlying `loan_requests` row exists and the token has not been superseded by an admin-triggered regeneration (5.5).
- **Lost email:** there is no borrower-initiated recovery mechanism, since the raw email address is never stored (§29). If a borrower loses access to the email containing their link, their only recourse is to contact the admin directly (outside the system), who can regenerate a new link and send it manually (5.5).

### 4.2 Page load behavior

On every load:
1. Hash the supplied token and look up a matching `management_token_hash`.
2. If no match → show the generic invalid-link message: **"This request link is invalid or no longer available."**
3. If matched → fetch current request state and render the appropriate view (4.3). State is always read fresh from the server; the client never assumes or caches state across visits.

### 4.3 View by state

| Status | Content shown | Actions available |
|---|---|---|
| `PENDING` | Queue position ("You are Nth in line" / "0 ahead — you're next") | Cancel |
| `APPROVED` | "Approved" — no collection date, no further messaging | None |
| `RETURNED` | "This request is no longer active" | None |
| `CANCELLED` | "This request is no longer active" | None |

`RETURNED` and `CANCELLED` are visually and textually identical to the borrower — both are simply terminal, inactive states. No cause of cancellation is shown or recorded. Collection date and return date are admin-only details (used for the admin's own record-keeping and future loan-duration statistics), never displayed to the borrower.

### 4.4 Cancel action (PENDING only)

- Triggered immediately on click — no confirmation step.
- Server re-validates the token and re-checks that the request is **still `PENDING`** at the moment of the click (it may have changed since page load — e.g. admin approved it in the meantime).
- **If still `PENDING`:** set `status = CANCELLED`. Re-render the page from fresh server state (now showing the terminal view).
- **If no longer `PENDING`:** reject the cancel attempt. Re-render the page from fresh server state, reflecting whatever the current true status now is (e.g. if now `APPROVED`, show the `APPROVED` view). No error page, no dead end.

This "always re-fetch and re-render from server truth" approach avoids optimistic client-side state and cleanly handles the race condition without special-casing it.

---

## 5. Admin Requests Dashboard & Actions

### 5.1 Dashboard scope

Default view shows **all active requests** — both `PENDING` and `APPROVED`. Terminal requests (`RETURNED`, `CANCELLED`) are hidden by default but can be revealed via a **"Show history"** toggle on the same dashboard (no separate history page).

Requests with `email_delivery_failed = TRUE` should be visually flagged on this dashboard so the admin notices and can follow up manually (e.g. resend the link another way).

### 5.2 Filters

- **Status filter:** checkboxes for Pending / Approved, plus the "Show history" toggle described above.
- **Flag filter:** independent checkboxes (any combination selectable), described in 5.3.
- **Book/title search:** basic text match against title. Lower priority; implement as simple as convenient.

### 5.3 Flag systems

Two independent systems, both applicable only to `APPROVED` requests, and mutually exclusive by construction:

**System A — Not yet collected**
- Condition: `status = APPROVED` AND `collection_date IS NULL`
- Threshold: 14+ days since `approved_at`
- Label: **"Not yet collected"**

**System B — Loan duration**
- Condition: `status = APPROVED` AND `collection_date IS NOT NULL`
- Anchored to days elapsed since `collection_date`:

| Days since collection | Label | Notes |
|---|---|---|
| 0–29 | *(none)* | Normal, no flag shown |
| 30–89 | **Needs attention** | |
| 90–179 | **Long loan** | |
| 180+ | **Very long loan** | |

Visual distinction between these levels is via color intensity (exact colors to be defined in the visual design step); no numeric "tier" terminology should appear anywhere in the UI.

`loan_attention_threshold_days = 30` (§30 configuration) remains the anchor for the "Needs attention" threshold; 90 and 180 are additional fixed thresholds for the two more severe labels.

### 5.4 Actions

All actions below are **immediate on click — no confirmation dialogs**, consistent with this being a low-stakes, single-admin tool. Each action re-checks the request's current status server-side before applying, to guard against races (e.g. dashboard left open in a stale tab).

**Approve** (`PENDING → APPROVED`)
1. Re-check request is still `PENDING`.
2. Re-check the book has no other `APPROVED` request (a database constraint — §25 — is the final safety net regardless).
3. On success: set `status = APPROVED`, `approved_at = now()`.
4. On failure (either check fails): reject with **"This request could not be approved because the book's status has changed. Please refresh the requests list."**

**Cancel** (`PENDING → CANCELLED` or `APPROVED → CANCELLED`)
1. Re-check current status is `PENDING` or `APPROVED` (i.e. not already terminal).
2. Set `status = CANCELLED`.
3. On failure (already terminal): reject with a relevant message reflecting current state.

**Mark collected** (`APPROVED`, `collection_date` currently NULL)
- Admin selects a date via date picker (not restricted to "today" — supports backdating for late logging).
- Sets `collection_date`.
- **Editable after being set** — admin can correct it later if entered in error.

**Mark returned** (`APPROVED → RETURNED`)
- Single action, no date picker.
- Sets `status = RETURNED` and `return_date = now()` together, in one step.
- **Not editable after being set** (fixed stamp — acceptable since, per project decision, the next pending request's approval remains manual regardless of exact return timing, so precision here has no downstream effect).

**Regenerate management link** (`PENDING` or `APPROVED` only — hidden/unavailable for terminal requests)
1. Generate a new raw management token.
2. Hash it and overwrite `management_token_hash`, discarding the old hash. The old link becomes invalid immediately.
3. Display the new raw link once on screen for the admin to copy and send manually (e.g. text message). It is not emailed automatically and is not retrievable again after this screen is dismissed.
4. If the old (now-invalidated) link is visited afterward, it is treated identically to any other unrecognized token — the generic message from 4.2 ("This request link is invalid or no longer available.") — no special-casing required.

### 5.5 Why the management token cannot simply be "looked up" by admin

`management_token_hash` stores a one-way hash, not the raw token (per §21/§22's security requirements — a database compromise must not expose working borrower credentials). This means even admin cannot retrieve a lost link directly; **regenerate** (5.4) is the supported path for admin to issue a fresh, working link when a borrower has lost their original email.

---

## 6. Spreadsheet Synchronisation Workflow

This extends §16 of `Technical_Specifications.md` with precise, decided behaviour.

### 6.1 Trigger and input

- **Manual only.** No scheduled/automatic sync. Admin explicitly clicks "Sync" from the admin dashboard.
- **Input:** a single `.xlsx` file, uploaded through the admin UI. Where the admin maintains this file (Excel, Google Sheets exported to XLSX, Numbers, etc.) is irrelevant to the system — there is no live API connection to any spreadsheet tool.
- **Expected columns:** `book_id`, `title`, `author`, `genre`, `notes` (optional), `active` (required). `active` values must be the literal text `TRUE`/`FALSE` (case-insensitive on parse) — chosen over `1`/`0` because it's self-documenting and matches Excel's native boolean cell type.

### 6.2 Validation (runs before anything else)

All of the following checks run across the **entire file**, and **all failures are collected and shown together** — not just the first one encountered:

1. Required columns (`book_id`, `title`, `author`, `genre`, `active`) must all be present in the file. Missing → *"Missing required column: `{column}`."*
2. Every row must have a non-empty value for each required field. Blank → *"Row {N} is missing a value for `{field}`."*
3. `active` must parse as `TRUE`/`FALSE`. Invalid → *"Row {N}: `active` must be TRUE or FALSE."*
4. No `book_id` may appear more than once in the file. Duplicate → *"Duplicate `book_id` found: `{book_id}` appears on rows {N} and {M}."*

**If any validation failure exists, the sync is blocked entirely** — no preview is generated, nothing is applied, and the full list of problems is shown so the admin can fix them all in one pass before re-uploading.

### 6.3 Preview (shown only once validation passes)

Rows are classified into four categories by comparing the file against the current `books` table:

| Category | Condition | What's shown |
|---|---|---|
| **New** | `book_id` not in DB | `book_id`, title, author, genre |
| **Updated** | `book_id` exists, one or more fields differ | Field-level diff, old value → new value, for each changed field |
| **Unchanged** | `book_id` exists, all fields identical | Count only, no per-row detail |
| **Missing from spreadsheet** | `book_id` exists in DB but not in this upload | List of `book_id`s — **informational warning only, no action attached** |

**Handling "sold" or otherwise removed books:** there is no hard-delete path (the schema's `on delete restrict` foreign keys from `book_covers` and `loan_requests` intentionally prevent it, preserving lending history per §28). A book that is no longer part of the collection is deactivated by setting `active = FALSE` **in the spreadsheet row** and re-uploading — this surfaces as a normal entry in the **Updated** diff (`active: TRUE → FALSE`), not as a "missing" row. The "missing" category is reserved purely for `book_id`s that unexpectedly disappeared from the file (e.g. an accidentally deleted spreadsheet row) — it exists to catch mistakes, not to represent an intended action.

### 6.4 Apply

- One click from the preview screen. **No separate confirmation step** — the preview itself serves that purpose, consistent with the one-click, no-confirmation pattern used throughout the admin workflows (§5.4).
- Server re-validates the same file server-side before applying (a formality/safety net given this is a single-admin, same-session action, not a real concurrency concern).
- All changes (creates and updates) are applied in a **single atomic database transaction** — either everything succeeds, or nothing is applied and the catalogue is left untouched.
- On success: a summary is shown (counts of new / updated / unchanged / missing), then returns to the dashboard.
- The "missing from spreadsheet" warning is **transient** — shown once on this result screen and not persisted or surfaced again later (e.g. not revisited on next login or next sync).

---

## 7. Goodreads Import Workflow

This extends §18–19 of `Technical_Specifications.md` with precise, decided behaviour.

### 7.1 Trigger and input

- **Manual only.** `Admin → My Reads → Import Goodreads`, CSV file upload.
- **Row filtering (silent):** only rows where `Exclusive Shelf = read` are considered. All other rows (want-to-read, currently-reading, etc.) are silently excluded before preview — no count shown for these.

### 7.2 Duplicate-import detection

- Keyed on `goodreads_id` (unique in `reads` per the existing index).
- If a row's `goodreads_id` already exists in `reads` → excluded from the actionable/editable list, shown only as a count under **"Already imported"** in the preview (mirrors the "Unchanged" pattern from spreadsheet sync — informational only, not itself editable or re-appliable).

### 7.3 Catalogue matching

- **Only mechanism:** normalized title + author (lowercase, trim, strip punctuation — no prefix-stripping, no subtitle/edition tolerance; kept deliberately simple since anything uncertain falls through to manual review anyway).
- **Exactly one match** in `books` → row is auto-linked: `book_id` set, `source = 'Owned'`. Displayed (and eventually stored) `title`/`author` for this row switch to the **`books` table values**, not the Goodreads CSV values.
- **Zero or multiple matches** → no auto-link. Treated identically (no separate "ambiguous" state) — falls to manual editing in preview (7.4).
- ISBN/ISBN13 and Goodreads-ID matching against `books` were considered and dropped: `books` does not store ISBN, and Goodreads IDs have no meaning for physical catalogue records. `goodreads_id` is used only for duplicate-import detection (7.2), not catalogue matching.

### 7.4 Preview screen

Two categories shown:

- **To import** — every row that isn't a duplicate, whether auto-matched or not. Each row is individually editable before Apply:
  - `source`: **Owned / NLB / blank.** Selecting **Owned** (whether it was auto-matched or chosen manually) surfaces a book picker (search by title/author) to link/confirm `book_id` — Owned always requires a linked book, whether reached automatically or manually. Linking a book also switches the row's displayed/stored `title`/`author` to the `books` values.
  - `rating`: editable (e.g. to revise to a decimal value Goodreads itself wouldn't export).
  - `notes`: editable; defaults to the Goodreads review text (`My Review`), but can be revised or cleared.
  - `title`, `author`, `date_read`: **not editable.** Sourced either from the CSV (unmatched/unlinked rows) or from `books` (matched/linked rows).
- **Already imported** — count only (7.2).

**No draft persistence.** All edits exist only in the browser session for that preview. Navigating away or closing the tab before clicking Apply discards all edits; a fresh CSV upload and re-edit is required to retry. This is an accepted trade-off for a single-sitting workflow.

### 7.5 Apply

- Single click from the preview screen — no separate confirmation (consistent with the one-click pattern used elsewhere).
- Applies the **current edited state** of each "to import" row (not the raw parsed CSV values) in a single atomic database transaction — all or nothing.
- On success: summary shown (counts: imported, already imported), returns to the dashboard.

---

## 8. Cover Upload Workflow

This extends §17 of `Technical_Specifications.md` with precise, decided behaviour.

### 8.1 Trigger and mechanism

There is **one unified upload mechanism**, not two separate "single" and "bulk" flows:

- Usable from a specific book's edit page (drop a single file), or from a general admin "Covers" screen (drop any number of files at once).
- Both cases go through the identical matching, validation, preview, and apply logic below — a single-file upload is simply the one-file case of the general flow.

### 8.2 File matching

- The filename (excluding extension) must **exactly match** an existing `book_id` (case-sensitive) — e.g. `BK0001.jpg` matches `book_id = 'BK0001'`.
- No fuzzy or case-insensitive matching.

### 8.3 Validation (per file)

- **Accepted input formats:** JPEG, PNG, WebP, HEIC.
- **Max upload size:** 5MB per file.
- HEIC is accepted as input despite inconsistent browser support for *display*, because the raw upload is never what gets stored or served (see 8.5) — it's always decoded and re-processed first.

### 8.4 Preview (before anything is applied)

Uploaded files are classified into three categories, each shown with a thumbnail of the incoming image:

| Category | Condition |
|---|---|
| **Matched — new cover** | `book_id` found, book currently has no cover |
| **Matched — replacement** | `book_id` found, book already has a cover — will overwrite the existing image. Called out distinctly since this is destructive. |
| **Unmatched** | Filename doesn't correspond to any existing `book_id` — flagged, not applied, no action taken |

### 8.5 Apply

- Single click from the preview screen — no separate confirmation.
- Every accepted file is **resized** (longest edge capped at ~1200px) and **re-encoded to a consistent web format** (e.g. WebP) before storage — the raw uploaded file is never what's persisted to Supabase Storage or served publicly.
- **Per-file independence** — each file's Storage upload + `book_covers` insert/update succeeds or fails on its own. A failure partway through a batch does not roll back or block the remaining files. (This is a deliberate departure from the atomic-transaction pattern used for spreadsheet sync and Goodreads import: those are pure database writes wrappable in a single Postgres transaction, whereas cover upload also involves external Storage writes that can't be rolled back the same way — and a failed cover is low-stakes compared to a bad catalogue sync.)
- Result screen shows a per-file outcome: succeeded, or failed with a reason (e.g. "file too large," "unsupported format").

---

## 9. Schema changes from this session (supplementing §1 of this document)

In addition to `approved_at` and `email_delivery_failed` on `loan_requests` (§1), the following changes to `reads` were made during Goodreads-import design and should be reflected in `Technical_Specifications.md`'s data model (§5.4):

- **`reads.source_detail` dropped entirely** (migration 005). On reflection, no manual or imported use case needed anything beyond the three-value `source` distinction below — an always-empty column added complexity with no benefit.
- **`reads.source` converted to a native Postgres enum**, `public.read_source`, with values `'Owned'` and `'NLB'` (migration 006), consistent with the existing `loan_request_status` enum pattern. Column remains nullable — `NULL` represents the third, unlabeled "other/unknown" bucket (e.g. borrowed from a friend), which was deliberately judged not to need its own value or detail field.
- Applied migrations so far this session: `004_workflow_columns.sql` (loan_requests columns), `005_drop_source_detail.sql`, `006_read_source_enum.sql`.

---

## 10. Open items not covered by this document

The following remain to be specified separately:

- Exact visual treatment (colors, spacing) for flag labels and status indicators — deferred to the visual design step
