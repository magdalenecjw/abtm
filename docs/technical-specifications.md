# Automated Book Teller Machine — Formal Technical Specification

**Document status:** Development-ready specification  
**Version:** 1.2  
**Date:** 12 September 2026

## Changelog

**v1.0 → v1.1** — after the borrowing/management/admin workflow design pass:
- **§5.3** (`loan_requests`) — two new columns: `approved_at`, `email_delivery_failed`.
- **§7** (Loan State Machine) — added `APPROVED → CANCELLED` as a valid admin-only transition (e.g. borrower no-show after approval).
- **§10** (Public Borrowing Request) — fully detailed: passcode gate mechanics, rate limiting, verification-token handoff, field constraints, duplicate-submission guard, server-side submission order.
- **§11** (Borrower Management Link) — fully detailed: link expiry policy, per-status views, cancel action behaviour.
- **§12** (Admin Borrowing Workflow) — fully detailed: dashboard scope/filters, and precise behaviour for approve, cancel, mark collected, mark returned, and regenerate-link actions.
- **§13** (Long-Loan Attention) — split into two independent flagging systems ("not yet collected" and graduated loan-duration labels), replacing the single 30-day flag.

**v1.1 → v1.2** — after the spreadsheet sync and Goodreads import workflow design pass:
- **§16** (Spreadsheet Synchronisation) — fully detailed: manual XLSX upload, validation rules, preview categories (new/updated-with-diff/unchanged/missing), atomic apply. See `docs/workflows.md` §6.
- **§18–19** (Goodreads Import / My Reads) — fully detailed: shelf filtering, duplicate detection via `goodreads_id`, title+author catalogue matching, editable preview, atomic apply. See `docs/workflows.md` §7.
- **§5.4** (`reads`) — `source_detail` column dropped entirely; `source` converted from free-text to a native enum (`public.read_source`: `Owned`, `NLB`, nullable for "other/unknown").

Full step-by-step reasoning for all workflow decisions lives in `docs/workflows.md`, which this document points to rather than duplicates.

## 1. Purpose

Automated Book Teller Machine is a personal online library catalogue for a physical collection of books.

The application has two primary functions:

1. **Public Library Catalogue** — friends can browse and search books owned by the library owner, view availability, and request to borrow books.
2. **My Reads** — the owner can maintain a reading history and recommendation section containing both owned and non-owned books.

This document defines the functional requirements, data model, application behaviour, permissions, workflows, and technical architecture required for development.

The application should remain intentionally lightweight. It is a personal/friends-only lending system rather than a general-purpose library management platform.

## 2. Scope

### 2.1 In scope

**Public**
- Browse library catalogue
- Search books by title, author, and genre
- View book details in a modal
- View current availability
- View current borrower nickname and loan start date when a book is on loan
- Submit borrowing requests
- View request position
- Receive a private request-management link by email
- Cancel a pending request through the management link
- View current queue status through the management link

**Admin**
- Authenticated admin login
- View catalogue
- Synchronise catalogue metadata from the library spreadsheet
- Upload/change book covers
- View borrowing requests
- Approve pending requests
- Cancel pending requests
- Record collection dates
- Record return dates
- View loan history
- Identify loans exceeding the 30-day attention threshold
- Import Goodreads CSV
- Review ambiguous Goodreads matches
- Manage reading history

### 2.2 Explicitly out of scope

Version 1 will NOT include:
- Borrower accounts or passwords
- Supabase Auth for borrowers
- Collection deadlines
- Return deadlines
- Automated overdue status
- Automated borrower reminders
- Automated approval of the next queue member
- Rejection state
- Separate `loans` table
- Multiple physical copies of the same catalogue book
- Individual public book pages/URLs
- Semantic search
- Social features, comments, or friend reviews
- Public email addresses
- Storing borrower email addresses in the application database

## 3. Technical Architecture

| Component | Technology |
|---|---|
| Frontend / application | Next.js |
| Hosting / deployment | Vercel |
| Database | Supabase PostgreSQL |
| Admin authentication | Supabase Auth |
| File storage | Supabase Storage |
| Catalogue source | Library spreadsheet |
| Reading-history import | Goodreads CSV |
| Email delivery | Transactional email provider |

The application should be a single Next.js application containing both the public experience and protected admin interface.

## 4. User Roles

### Public user

Can browse/search the catalogue, view book details, submit a borrowing request, and manage their own pending request through its secret link.

Cannot access admin functionality or another borrower's private information.

### Admin

The library owner. Can authenticate through Supabase Auth and manage borrowing requests, covers, catalogue synchronisation, Goodreads imports, and reading history.

Version 1 requires only one administrative role.

## 5. Database Schema

### 5.1 `books`

One row represents one physical book.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Internal database identifier |
| `book_id` | TEXT | UNIQUE, NOT NULL | Permanent identifier, e.g. `BK0001` |
| `title` | TEXT | NOT NULL | Book title |
| `author` | TEXT | NOT NULL | Author |
| `genre` | TEXT | NOT NULL | Genre |
| `notes` | TEXT | NULL | Condition, signed copy, miscellaneous information |
| `active` | BOOLEAN | NOT NULL, default TRUE | Whether shown publicly |
| `created_at` | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update |

Rules:
- `book_id` is permanent, unique, stable, and never reused.
- One row represents one physical copy.
- Setting `active = FALSE` hides a book without deleting its history.
- Normal catalogue removal should use deactivation rather than deletion.

### 5.2 `book_covers`

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Cover record |
| `book_id` | UUID | FK → books.id | Associated book |
| `storage_path` | TEXT | NOT NULL | Supabase Storage object path |
| `uploaded_at` | TIMESTAMPTZ | NOT NULL | Upload timestamp |

Normally one active cover exists per book.

Recommended storage convention:

`covers/{book_id}.{extension}`

Actual image files live in Supabase Storage; PostgreSQL stores the path.

### 5.3 `loan_requests`

Represents the complete borrowing-request lifecycle.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Request identifier |
| `book_id` | UUID | FK → books.id, NOT NULL | Requested book |
| `real_name` | TEXT | NOT NULL | Private borrower name |
| `nickname` | TEXT | NOT NULL | Public display name |
| `requested_at` | TIMESTAMPTZ | NOT NULL | Queue ordering timestamp |
| `status` | ENUM | NOT NULL | `PENDING`, `APPROVED`, `RETURNED`, `CANCELLED` |
| `collection_date` | DATE | NULL | Actual collection date |
| `return_date` | DATE | NULL | Actual return date |
| `management_token_hash` | TEXT | NOT NULL | Hash of secret management token |
| `approved_at` | TIMESTAMPTZ | NULL | Set when status transitions to `APPROVED`. Anchors the "not yet collected" attention flag (§13). |
| `email_delivery_failed` | BOOLEAN | NOT NULL, default FALSE | Set if the management-link email fails to send at request creation. Surfaced to admin; does not block request creation. |
| `created_at` | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update |

**Privacy requirement:** borrower email MUST NOT be stored in this table.

The email is used transiently to send the management link. The raw management token should not be stored; store a cryptographic hash.

### 5.4 `reads`

One row represents one reading event.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Reading event |
| `book_id` | UUID | FK → books.id, NULL | Owned book if applicable |
| `title` | TEXT | NOT NULL | Title |
| `author` | TEXT | NULL | Author |
| `cover_url` | TEXT | NULL | Cover for non-owned book if needed |
| `genre` | TEXT | NULL | Genre |
| `rating` | NUMERIC | NULL | User rating |
| `notes` | TEXT | NULL | Reading notes |
| `date_read` | DATE | NULL | Date read |
| `source` | ENUM (`public.read_source`: `Owned`, `NLB`) | NULL | Distinguishes owned-library reads from NLB (public library) reads; `NULL` covers any other/unknown source (e.g. borrowed from a friend), which does not need finer detail |
| `goodreads_id` | TEXT | NULL | Goodreads identifier |
| `created_at` | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update |

Rules:
- `book_id` is nullable.
- Multiple rows may reference the same `book_id`, supporting rereads.
- A read may exist without a corresponding owned book.
- When `book_id` is set, `title`/`author` are sourced from `books`, not from any import source, keeping catalogue and reading-history data consistent (see `docs/workflows.md` §7.3).
- `source_detail` (present in v1.0) was removed — no manual or imported use case required detail beyond the two-value distinction above.

## 6. Relationships

```text
books
  ├──────────────< book_covers
  ├──────────────< loan_requests
  └──────────────< reads

reads.book_id is nullable
```

There is intentionally no separate `loans` table. `loan_requests` records the complete request/loan lifecycle.

## 7. Loan State Machine

```text
PENDING
   │
   ├───► APPROVED ───► RETURNED
   │         │
   │         └───► CANCELLED   (admin-only)
   │
   └───► CANCELLED   (borrower or admin)
```

Valid transitions:

| Current | Action | New |
|---|---|---|
| PENDING | Admin approves | APPROVED |
| PENDING | Borrower cancels | CANCELLED |
| PENDING | Admin cancels | CANCELLED |
| APPROVED | Admin records return | RETURNED |
| APPROVED | Admin cancels (e.g. borrower no-show after approval) | CANCELLED |

`CANCELLED` does not distinguish whether it was reached from `PENDING` or `APPROVED`, nor who initiated it — the cause is not recorded.

Other transitions are invalid.

## 8. Derived Book Availability

Availability MUST NOT be stored as an editable field.

It is derived from `loan_requests`.

- **Available:** no `PENDING` and no `APPROVED` request
- **Checked out:** one or more `PENDING` requests and no `APPROVED` request
- **On loan:** an `APPROVED` request exists

At most one `APPROVED` request may exist for a book. Enforce this with a database constraint or transaction-safe logic.

## 9. Borrowing Queue

Queue order is `requested_at ASC`.

Only `PENDING` requests count as requests ahead.

Example:

```text
A → PENDING   = 0 ahead
B → PENDING   = 1 ahead
C → PENDING   = 2 ahead
```

After A is approved:

```text
A → APPROVED
B → PENDING   = 0 ahead / You are next in line
C → PENDING   = 1 ahead
```

When A returns, B remains pending. The admin manually decides whether to approve B.

## 10. Public Borrowing Request

> Full step-by-step detail, including rationale for each decision, is in `docs/workflows.md` §3. This section summarizes the agreed behaviour.

**Entry point:** clicking "Request to borrow" on a book's details modal opens the passcode popup immediately. No availability re-check happens at click time — the book's true status is authoritatively re-validated only at final submission.

**Passcode gate (shown every time — no session-wide unlock):**
- Explicit submit button; passcode validated only on submit, not as-you-type.
- Incorrect passcode → inline error, retry allowed.
- Rate limiting: 5 incorrect attempts (tracked by IP) → 24-hour lockout, vague message (no countdown shown).
- Correct passcode → server issues a short-lived (30 minute), single-use, opaque verification token. The client stores only this token, never the raw passcode.

**Request form** (shown after passcode verification; the verification token rides along invisibly):
- Real name: 3–25 characters, letters and spaces only.
- Nickname: 3–25 characters, letters and spaces only; publicly displayed while the book is on loan.
- Email: valid format, validated on blur.
- If the verification token expires before submission, the visitor is bounced back to the passcode popup, but their already-typed field values are preserved client-side.

**Duplicate submissions are allowed** (the same visitor may hold multiple pending requests for the same book), but a **5-minute duplicate guard** (keyed on `book_id` + `email`) blocks accidental rapid double-submission specifically.

**Server-side submission order:**

1. Validate verification token (exists, unexpired, unused) → if invalid, reject and return to passcode popup.
2. Validate field formats.
3. Check the 5-minute duplicate guard.
4. Confirm the book exists and `active = TRUE` → if not: *"This book is no longer available in the catalogue."*
5. Consume the verification token (only now — so a validation failure in steps 2–4 doesn't cost the visitor their passcode verification).
6. Create the `PENDING` request.
7. Generate a cryptographically secure management token; store only its hash.
8. Email the management link. **Delivery failure is non-fatal** — the request stands; set `email_delivery_failed = TRUE` on the row so admin can follow up (§12).
9. Show confirmation (queue position + cancel action — same view as §11).

The email address must not be persisted to PostgreSQL.

## 11. Borrower Management Link

> Full detail in `docs/workflows.md` §4.

Conceptually:

`/request/manage/{token}`

The token is the credential. Do not put email addresses in the URL. **The link does not expire** — it remains valid as long as the request exists and the token hasn't been superseded by an admin regeneration (§12). There is no borrower-initiated recovery if the email is lost; admin can regenerate a link and send it manually (e.g. by text).

The page always re-fetches current state on load and after any action — it never trusts cached or optimistic client-side state, which cleanly handles races where status changes between page load and an action.

**Content shown, by status:**

| Status | Content | Actions |
|---|---|---|
| PENDING | Queue position / "You are next in line" | Cancel |
| APPROVED | "Approved" (no further detail) | None |
| RETURNED | "This request is no longer active" | None |
| CANCELLED | "This request is no longer active" | None |

It must not expose:
- Other borrowers' real names
- Email addresses
- Internal database details
- Administrative information (including collection/return dates, which are admin-only)

**Cancel** (PENDING only): immediate on click, no confirmation. Server re-checks the request is still `PENDING` at the moment of the click before applying; if it's changed in the meantime, the page re-renders showing the current true status rather than erroring.

`PENDING → CANCELLED`

Queue position recalculates automatically for remaining pending requests.

## 12. Admin Borrowing Workflow

> Full detail in `docs/workflows.md` §5.

**Dashboard:** shows all active requests (`PENDING` + `APPROVED`) by default, with a "Show history" toggle to reveal `RETURNED`/`CANCELLED`. Filterable by status (checkboxes) and by attention flag (independent checkboxes, §13). Basic title/book text search is supported. Requests with `email_delivery_failed = TRUE` are visually flagged for admin follow-up.

All actions below are **immediate on click — no confirmation dialogs** — and each re-checks the request's current status server-side before applying, to guard against stale-dashboard races.

### Approve

`PENDING → APPROVED`

Re-checks the request is still `PENDING` and that the book has no other `APPROVED` request (a database constraint is the final safety net regardless — §25). On success, sets `approved_at = now()` in addition to the status change. The request's original `requested_at` remains unchanged. On failure: *"This request could not be approved because the book's status has changed. Please refresh the requests list."*

### Cancel

`PENDING → CANCELLED` or `APPROVED → CANCELLED`

The `APPROVED → CANCELLED` transition is admin-only and intended for cases such as a borrower not collecting after approval. Neither the trigger state nor the cause is recorded — both collapse to the same `CANCELLED` status.

### Collection

Admin records the collection date via a date picker (not restricted to "today," to support backdated logging). **Editable after being set.**

### Return

`APPROVED → RETURNED`

Single action ("Mark returned") stamps both `status = RETURNED` and `return_date = now()` together. **Not editable after being set** — acceptable since exact return timing has no downstream effect (the next pending request's approval remains a manual admin decision regardless).

The next pending request is NOT automatically approved.

### Regenerate management link

Available for `PENDING`/`APPROVED` requests only (hidden for terminal states). Generates a new raw management token, stores only its hash (overwriting the old one — the old link becomes invalid immediately), and displays the new raw link once on screen for admin to copy and send manually. This exists because the stored token is a one-way hash — admin cannot retrieve a lost link directly, only issue a new one.

## 13. Attention Flags

> Full detail in `docs/workflows.md` §5.3. This replaces the single 30-day "Long-Loan Attention" flag from v1.0 with two independent systems.

There is no formal overdue state, and no automated borrower notification is sent for either flag below. Both apply only to `APPROVED` requests and are mutually exclusive by construction.

**Not yet collected** — `collection_date IS NULL` and 14+ days have passed since `approved_at`. Labelled **"Not yet collected."**

**Loan duration** — once `collection_date` is set, graduated by days elapsed since that date:

| Days since collection | Label |
|---|---|
| 0–29 | *(none — normal)* |
| 30–89 | **Needs attention** |
| 90–179 | **Long loan** |
| 180+ | **Very long loan** |

Distinction between levels is conveyed through colour intensity (defined in the visual design step), not numeric "tier" labels.

Configuration:

```text
loan_attention_threshold_days = 30      -- "Needs attention"
loan_long_threshold_days = 90           -- "Long loan"
loan_very_long_threshold_days = 180     -- "Very long loan"
loan_not_collected_threshold_days = 14  -- "Not yet collected"
```

## 14. Public Catalogue UI

The public experience is one searchable catalogue rather than individual book pages.

Books appear as generic book spines:

```text
║ Dune ║  ║ Piranesi ║  ║ The Night Circus ║
```

Spines:
- display the title
- are visually generic
- may vary subtly in dimensions
- must NOT reproduce the actual cover
- must NOT look like miniature book covers

Search supports:
- title
- author
- genre

The actual cover should be loaded/displayed when the user opens the book details modal rather than loading every full cover on the initial catalogue view.

## 15. Book Details Modal

Selecting a spine opens a modal containing:
- Cover
- Title
- Author
- Genre
- Notes
- Current status

Available:
- Shows **Available**
- Shows **Request to borrow**

Checked out:
- Shows **Checked out**
- Shows queue information as appropriate

On loan:
- Shows **On loan**
- Shows borrower nickname
- Shows loaned-since date

Never display the borrower's real name or email publicly.

## 16. Spreadsheet Synchronisation

The catalogue spreadsheet contains:

| Column | Required |
|---|---|
| `book_id` | Yes |
| `title` | Yes |
| `author` | Yes |
| `genre` | Yes |
| `notes` | No |
| `active` | Yes |

Synchronisation:

- New `book_id` → create `books` record
- Existing `book_id` → update metadata
- `active = FALSE` → hide publicly
- Missing spreadsheet row → do not silently delete the database record; report it for admin review

The spreadsheet does NOT contain:
- availability
- borrower
- loan date
- request status
- queue position
- collection date
- return date
- email
- cover image

## 17. Cover Management

Admin workflow:

```text
Admin → Books → Edit Book → Upload/Replace Cover
                     ↓
              Supabase Storage
                     ↓
               book_covers
```

Upload requirements:
- validate image type
- enforce reasonable maximum size
- optionally resize/compress for web use
- store the object in Supabase Storage
- update the cover record

## 18. Goodreads Import

Admin workflow:

`Admin → My Reads → Import Goodreads`

Process:
1. Parse Goodreads CSV.
2. Extract supported fields.
3. Match against owned books.
4. Create reading records.
5. Flag ambiguous matches for manual confirmation.

Matching priority:
1. ISBN / ISBN13
2. Goodreads ID
3. Normalised title + author

Unmatched books receive:

`book_id = NULL`

and remain valid reading records.

Use `goodreads_id` where available to prevent duplicate imports, while preserving legitimate rereads.

## 19. My Reads

One row equals one reading event.

Supported fields:
- Rating
- Notes
- Date read
- Source
- Source detail

The section can contain both owned and non-owned books.

When an owned book is linked via `book_id`, catalogue information can be reused. Non-owned books retain their own title/author/cover/genre data.

## 20. Admin Dashboard

Suggested overview:

```text
Total books
Available
Checked out
On loan
Pending requests
Loans > 30 days
```

Sections:
- Requests requiring action
- Long loans needing attention
- Catalogue
- Covers
- My Reads
- Goodreads import

## 21. Authentication and Authorisation

Admin access uses Supabase Auth.

Server-side authorisation is mandatory; hiding admin UI controls is insufficient.

Public catalogue browsing requires no login.

Borrowing requires the borrow passcode.

Management tokens are bearer credentials and must be:
- cryptographically random
- sufficiently long
- unpredictable
- preferably stored hashed
- excluded from application logs
- excluded from analytics

## 22. Security Requirements

The implementation must:
- Validate public input server-side.
- Use safe parameterised database access.
- Enforce admin authorisation server-side.
- Protect management tokens.
- Never persist borrower email.
- Never expose real names publicly.
- Restrict Supabase Storage access appropriately.
- Validate uploaded images.
- Apply reasonable rate limiting to passcode attempts, borrowing requests, and management-token endpoints.
- Avoid unnecessary sensitive logging.

The borrow passcode must not be exposed in client-side JavaScript.

## 23. Supabase Row-Level Security

RLS should be enabled where appropriate.

Public access should be limited to active catalogue data and public cover information.

Public users should NOT have unrestricted direct access to `loan_requests`. Request creation, management-token validation, and cancellation should preferably go through controlled server-side endpoints/actions.

Authenticated admin access may read/write required private data.

## 24. Logical API / Server Actions

Exact implementation may use Next.js Route Handlers or Server Actions.

### Public operations

```text
GET  /catalogue
GET  /catalogue/search
GET  /book/{id-or-book-id}       [logical operation; no public book page required]
POST /borrow/request
GET  /borrow/manage/{token}
POST /borrow/manage/{token}/cancel
```

### Admin operations

```text
POST /admin/books/sync
POST /admin/books/{id}/cover
GET  /admin/requests
POST /admin/requests/{id}/approve
POST /admin/requests/{id}/cancel
POST /admin/requests/{id}/return
POST /admin/goodreads/import
```

These are logical interfaces and may instead be implemented as Server Actions.

## 25. Concurrency and Transactions

Approval must be transaction-safe.

Before approving:
- request must still be `PENDING`
- book must not already have an `APPROVED` request
- state change must be atomic

Use a PostgreSQL partial unique index or equivalent constraint to enforce at most one approved request per book.

## 26. Recommended Indexes

### `books`
- unique index on `book_id`
- index on `active`
- appropriate indexes for title/author/genre search

### `loan_requests`
- `(book_id, status)`
- `(book_id, requested_at)`
- `(status, requested_at)`
- unique partial index for approved requests

### `reads`
- `book_id`
- `goodreads_id`
- `date_read`

## 27. Error Handling

Public errors should be friendly and should not expose database details.

Examples:

> The borrow passcode is incorrect.

> This book's borrowing status has changed. Please refresh and try again.

> This request has already been cancelled.

> This request link is invalid or no longer available.

> This request could not be approved because the book's status has changed. Please refresh the requests list.

## 28. Historical Data

Completed requests must remain in `loan_requests`.

Historical information should preserve:
- book
- borrower nickname
- real name
- requested date
- status
- collection date
- return date

A separate audit-log table is not required for version 1.

## 29. Data Privacy

Stored:
- Borrower real name
- Borrower nickname
- Borrowing request history
- Collection/return dates

Not stored:
- Borrower email address

The transactional email provider may nevertheless process or retain the email under its own policies.

## 30. Configuration

Initial business configuration:

```text
loan_attention_threshold_days = 30
```

Expected environment configuration includes values equivalent to:

```text
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY
BORROW_PASSCODE
EMAIL_PROVIDER_API_KEY
EMAIL_FROM_ADDRESS
```

Exact names may change during implementation.

Secrets must be stored in Vercel/environment-secret configuration and never committed to GitHub.

## 31. Visual Requirements

Design direction:

> A contemporary website designed to feel like an old private library.

Inspiration:
- traditional library catalogue cards
- private libraries
- refined book typography
- catalogue indexing systems

Avoid:
- parchment
- faux-aged paper
- sepia
- distressed textures
- excessive Victorian ornament
- generic SaaS styling

Desired language:
- classical
- contemporary
- restrained
- clean
- typography-led
- generous whitespace
- thin rules
- subtle borders
- refined serif typography for identity/headings
- functional sans-serif typography where appropriate

The site should feel like a modern digital interface for a well-kept private library.

## 32. Responsive Requirements

Public catalogue must work on:
- desktop
- tablet
- mobile

Book-spine layout must adapt to narrower screens.

The details modal should become a mobile-friendly full-screen or near-full-screen presentation where appropriate.

Admin should be usable on mobile, although desktop is the primary administrative environment.

## 33. Performance Requirements

- Do not load all full-size covers during initial catalogue render.
- Use appropriately sized/compressed cover images.
- Query only fields required for initial browsing.
- Search/filter using efficient server-side/database queries.
- Cache catalogue metadata where safe.
- Avoid unnecessary client-side hydration.
- Do not serve stale availability data where it could mislead a borrower.

## 34. Catalogue Removal

When a book should no longer appear publicly:

`active = FALSE`

Do not delete the record merely because the book is no longer catalogued.

Historical lending and reading data should remain intact.

Inactive books cannot receive new borrowing requests.

## 35. Acceptance Criteria

### Catalogue
- [ ] Spreadsheet can create books.
- [ ] Spreadsheet can update books using `book_id`.
- [ ] Inactive books disappear publicly.
- [ ] Historical data survives deactivation.
- [ ] Search works for title, author, and genre.
- [ ] Books appear as generic spines.
- [ ] Spines display titles.
- [ ] Clicking a spine opens the details modal.
- [ ] Actual cover loads in the modal.

### Borrowing
- [ ] Public user can submit a request using the borrow passcode.
- [ ] Real name is stored privately.
- [ ] Nickname is stored for public display.
- [ ] Email is not stored in PostgreSQL.
- [ ] Secure management link is emailed.
- [ ] Management link shows request status and queue position.
- [ ] Pending borrower can cancel.
- [ ] Admin can approve.
- [ ] Admin can cancel pending requests.
- [ ] Admin can record collection date.
- [ ] Admin can record return date.
- [ ] Returned books become available.
- [ ] Next pending borrower is not automatically approved.
- [ ] Queue positions recalculate correctly.
- [ ] Only one approved borrower can exist per book.
- [ ] Current borrower nickname and loan start are publicly visible when appropriate.
- [ ] Loans over 30 days appear in admin attention list.

### Reads
- [ ] Admin can manually create reading records.
- [ ] Same book can have multiple reading records.
- [ ] Non-owned books can be recorded.
- [ ] Goodreads CSV can be uploaded.
- [ ] ISBN/ISBN13 matching is attempted first.
- [ ] Goodreads ID matching is supported.
- [ ] Title/author matching is supported.
- [ ] Ambiguous matches require confirmation.
- [ ] Unmatched books remain valid reading records.
- [ ] Re-importing the same Goodreads data does not blindly create duplicates.

### Security
- [ ] Admin pages require authentication.
- [ ] Public users cannot access private borrower information.
- [ ] Borrower email is not persisted.
- [ ] Management tokens are securely generated.
- [ ] Raw tokens are not logged.
- [ ] Borrow passcode is not exposed client-side.
- [ ] Public request endpoints have reasonable rate limiting.
- [ ] RLS/server-side authorisation prevents unauthorised private-data access.

## 36. Recommended Development Order

### Phase 1 — Foundation
- Next.js project
- Vercel deployment
- Supabase project
- Database schema
- Supabase Auth
- Environment configuration
- Admin route protection

### Phase 2 — Catalogue
- Books table
- Spreadsheet sync
- Public catalogue
- Search
- Book-spine UI
- Details modal

### Phase 3 — Covers
- Supabase Storage
- Admin cover upload
- Cover replacement
- Modal cover display

### Phase 4 — Borrowing
- Request form
- Borrow passcode
- Loan request records
- Queue calculation
- Management tokens
- Email delivery
- Borrower management page
- Cancellation
- Admin requests dashboard
- Approval
- Collection
- Return
- Long-loan attention flag

### Phase 5 — My Reads
- Reading-history UI
- Manual read entry
- Goodreads import
- Matching
- Ambiguous-match review
- Duplicate protection

### Phase 6 — Polish
- Classical library visual design
- Responsive behaviour
- Performance optimisation
- Accessibility
- Error states
- Security review
- Privacy review

## 37. Non-Functional Principles

### Simplicity over feature volume
This is a personal library system. Do not introduce functionality merely because it exists in larger library-management systems.

### Human judgement over automation
Approval, cancellation, collection, and return are deliberately manual.

### Data integrity over convenience
Availability is derived from loan state rather than duplicated as editable data.

### Privacy by default
Do not store information the application does not need.

### Historical preservation
Catalogue changes must not destroy lending or reading history.

### Lightweight public experience
The catalogue should feel like browsing a digital private library, not operating enterprise software.

## 38. Deferred Future Extensions

Do not implement unless requirements change:
- Semantic search
- Automated recommendation engine
- Borrower accounts
- Push notifications
- Automated email reminders
- Return deadlines
- Collection deadlines
- Multiple copies of the same title
- Social reviews/comments
- Public profiles
- Advanced analytics
- Mobile application
- AI-generated recommendations
- Complex circulation rules

## 39. Final Implementation Model

```text
PUBLIC
  │
  ├── Browse catalogue
  ├── Search title / author / genre
  ├── Select book spine
  │      └── View details + actual cover
  │
  └── Request to borrow
         ├── Borrow passcode
         ├── Real name
         ├── Nickname
         ├── Email
         └── Receive secret management link
                    │
                    └── View queue / cancel pending request


ADMIN
  │
  ├── Authenticated dashboard
  ├── Manage requests
  │      ├── Approve
  │      ├── Cancel
  │      ├── Record collection
  │      └── Record return
  │
  ├── Manage covers
  ├── Sync catalogue spreadsheet
  │
  └── Manage / import My Reads
         └── Goodreads CSV


DATA
  │
  ├── books
  ├── book_covers
  ├── loan_requests
  └── reads

STORAGE
  │
  ├── PostgreSQL → application state
  ├── Supabase Storage → covers
  ├── Spreadsheet → catalogue source
  └── Goodreads CSV → reading-history import
```

The core architectural principle is:

**The catalogue describes what the owner owns.  
The database describes what is currently happening.  
The reading history describes what the owner has read.**
