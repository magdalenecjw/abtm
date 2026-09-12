# Automated Book Teller Machine — Formal Technical Specification

**Document status:** Development-ready specification  
**Version:** 1.0  
**Date:** 12 September 2026

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
| `source` | TEXT | NULL | Source category |
| `source_detail` | TEXT | NULL | Additional source information |
| `goodreads_id` | TEXT | NULL | Goodreads identifier |
| `created_at` | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update |

Rules:
- `book_id` is nullable.
- Multiple rows may reference the same `book_id`, supporting rereads.
- A read may exist without a corresponding owned book.

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
   │
   └───► CANCELLED
```

Valid transitions:

| Current | Action | New |
|---|---|---|
| PENDING | Admin approves | APPROVED |
| PENDING | Borrower cancels | CANCELLED |
| PENDING | Admin cancels | CANCELLED |
| APPROVED | Admin records return | RETURNED |

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

The request form asks for:
- Borrow passcode
- Real name
- Nickname
- Email

Server-side processing:

1. Validate borrow passcode.
2. Validate required fields.
3. Confirm the book exists and is active.
4. Create a `PENDING` request.
5. Generate a cryptographically secure management token.
6. Store only its hash.
7. Email the management link to the supplied email.
8. Show confirmation.

The email address must not be persisted to PostgreSQL.

## 11. Borrower Management Link

Conceptually:

`/request/manage/{token}`

The token is the credential. Do not put email addresses in the URL.

The management page shows:
- Book title
- Request status
- Request date
- Number of requests ahead
- Queue position / "You are next in line"
- Relevant current status
- Cancel action while pending

It must not expose:
- Other borrowers' real names
- Email addresses
- Internal database details
- Administrative information

Pending borrowers can cancel their own request:

`PENDING → CANCELLED`

Queue position recalculates automatically.

## 12. Admin Borrowing Workflow

The Requests dashboard should show:

| Book | Requester | Requested | Action |
|---|---|---|---|
| Dune | Alex | 12 Sep | Approve |
| Piranesi | Sarah | 10 Sep | Approve |

### Approve

`PENDING → APPROVED`

The book becomes **On loan**. The request's original `requested_at` remains unchanged.

### Cancel

`PENDING → CANCELLED`

The request leaves the queue.

### Collection

Admin records the actual collection date.

### Return

`APPROVED → RETURNED`

Admin records the actual return date.

The next pending request is NOT automatically approved.

## 13. Long-Loan Attention

There is no formal overdue state.

A loan is flagged for admin attention when:

`current_date - collection_date > 30 days`

If collection date is missing, use approval date as the fallback.

Display:

**Needs attention**

not "Overdue".

Configuration:

`loan_attention_threshold_days = 30`

No automated borrower notification is required.

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
