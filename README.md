# Automated Book Teller Machine

A personal online library catalogue for sharing a physical book collection with friends.

## Overview

**Automated Book Teller Machine** is a small, private-library-inspired web application designed to make a personal book collection browsable, lendable, and easy to maintain.

The project has two main functions:

1. **Library Catalogue** — a public-facing catalogue of books physically owned by the library owner, with availability and borrowing requests.
2. **My Reads** — a reading-history and recommendation space where the owner can record books they have read, including books they do not personally own.

The design aims to combine the clarity of a contemporary web application with the character of a traditional library catalogue: refined, restrained, and classical rather than vintage or ornate.

## Core Features

### Catalogue

Each catalogue entry represents one physical book.

Book metadata includes:

- Title
- Author
- Genre
- Notes
- Cover
- Active/inactive status

The catalogue uses a permanent `book_id` for each physical copy.

Books are presented as **generic book spines** rather than miniature cover images. Selecting a spine opens a details modal containing the book's actual cover and information.

The catalogue supports searching by:

- Title
- Author
- Genre

Semantic search is intentionally deferred until there is enough user-generated reading information for it to be useful.

### Borrowing

Friends can request books without creating accounts.

The borrowing flow is:

1. Enter a borrow passcode.
2. Provide a real name.
3. Provide a nickname for public display.
4. Provide an email address.
5. Submit a borrowing request.
6. Receive a private management link by email.

The email address is used to deliver the management link but is **not stored in the application's database**.

Borrowing is manually managed by the library owner. Requests move through:

`PENDING → APPROVED → RETURNED`

or:

`PENDING → CANCELLED`

The public catalogue derives its displayed status from these records:

- **Available** — no pending requests and no active loan
- **Checked out** — one or more pending requests, but no active loan
- **On loan** — the current request has been approved

Requests are handled in chronological order. A borrower can see how many pending requests are ahead of them.

The owner manually approves requests, records collection and return dates, and can cancel requests when necessary.

There are deliberately no formal collection or return deadlines. Loans that have lasted more than **30 days** are flagged on the admin dashboard for the owner's attention.

### My Reads

The reading-history section records one row per reading event, allowing the same book to be read multiple times.

A reading record can include:

- Title
- Author
- Genre
- Rating
- Notes
- Date read
- Source
- Source details
- Goodreads ID
- Link to an owned catalogue book, where applicable

Books that are not owned by the library can still appear in the reading history.

Goodreads CSV exports can be imported and matched against the catalogue using ISBN/ISBN13, Goodreads ID, or normalised title and author. Ambiguous matches are flagged rather than automatically assumed.

## Technical Architecture

The application is planned around:

- **Next.js** — web application framework
- **Vercel** — hosting and deployment
- **Supabase PostgreSQL** — application database
- **Supabase Auth** — administrator authentication
- **Supabase Storage** — book cover storage

The catalogue metadata is maintained through a library spreadsheet and synchronised into the application database.

Book covers are managed through the application's admin interface rather than through the spreadsheet.

Borrowers do not have application accounts. Administrative access is protected by proper authentication.

## Data Model

The core entities are:

- `books`
- `book_covers`
- `loan_requests`
- `reads`

The lending lifecycle is intentionally kept simple: `loan_requests` records the complete history of requests, approvals, returns, and cancellations without introducing a separate loans table.

The catalogue and lending system are separated conceptually:

- **Spreadsheet** → catalogue metadata source
- **Database** → application state and lending history
- **Storage** → cover image files

This allows catalogue maintenance without allowing spreadsheet edits to overwrite transactional information such as availability or borrowing history.

## Design Direction

The visual direction is inspired by **traditional library catalogue cards and private libraries**, but interpreted through a contemporary web design system.

The intended aesthetic is:

- Classical
- Refined
- Quiet
- Clean
- Contemporary
- Typography-led
- Generous whitespace
- Thin rules and restrained borders

It intentionally avoids:

- Faux-aged paper
- Parchment
- Sepia
- Distressed textures
- Overly ornate Victorian styling
- Generic SaaS aesthetics

The goal is to make the site feel like a modern digital interface for a well-kept private library.

## Project Status

**Design and requirements phase.**

The application is intentionally not yet implemented. Product requirements, workflows, data structures, and UI direction are being defined before development begins.

## Project Principles

- Keep the borrowing experience simple.
- Minimise personal data collection.
- Keep administrative workflows manual where human judgement is useful.
- Preserve lending history even when catalogue metadata changes.
- Treat the physical book as the primary catalogue unit.
- Prefer clear derived states over duplicated status fields.
- Keep the public experience elegant and lightweight.
- Avoid unnecessary accounts, deadlines, notifications, and complexity.

---

*A small digital library for a real collection of books.*
