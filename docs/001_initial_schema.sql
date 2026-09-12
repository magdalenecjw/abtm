-- ============================================================
-- Automated Book Teller Machine
-- Initial database schema
-- ============================================================

-- ------------------------------------------------------------
-- 1. Extensions
-- ------------------------------------------------------------

create extension if not exists pgcrypto;


-- ------------------------------------------------------------
-- 2. Loan request status
-- ------------------------------------------------------------

create type public.loan_request_status as enum (
  'pending',
  'approved',
  'returned',
  'cancelled'
);


-- ------------------------------------------------------------
-- 3. Books
-- ------------------------------------------------------------

create table public.books (
  id uuid primary key default gen_random_uuid(),

  book_id text not null unique,
  title text not null,
  author text not null,
  genre text not null,
  notes text,

  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ------------------------------------------------------------
-- 4. Book covers
-- ------------------------------------------------------------

create table public.book_covers (
  id uuid primary key default gen_random_uuid(),

  book_id uuid not null
    references public.books(id)
    on delete restrict,

  storage_path text not null,

  uploaded_at timestamptz not null default now(),

  constraint book_covers_one_cover_per_book
    unique (book_id)
);


-- ------------------------------------------------------------
-- 5. Loan requests
-- ------------------------------------------------------------

create table public.loan_requests (
  id uuid primary key default gen_random_uuid(),

  book_id uuid not null
    references public.books(id)
    on delete restrict,

  real_name text not null,
  nickname text not null,

  requested_at timestamptz not null default now(),

  status public.loan_request_status not null default 'pending',

  collection_date date,
  return_date date,

  management_token text not null unique,

  constraint loan_requests_valid_dates
    check (
      return_date is null
      or collection_date is null
      or return_date >= collection_date
    )
);


-- ------------------------------------------------------------
-- 6. Reading history
-- ------------------------------------------------------------

create table public.reads (
  id uuid primary key default gen_random_uuid(),

  book_id uuid
    references public.books(id)
    on delete set null,

  title text not null,
  author text not null,
  cover_url text,
  genre text,

  rating numeric(2,1),
  notes text,

  date_read date,
  source text,
  source_detail text,

  goodreads_id text
);


-- ------------------------------------------------------------
-- 7. Constraints
-- ------------------------------------------------------------

-- Ratings are optional, but if supplied must be between 0 and 5.
alter table public.reads
add constraint reads_rating_range
check (
  rating is null
  or (rating >= 0 and rating <= 5)
);


-- Goodreads IDs should be unique when supplied.
create unique index reads_goodreads_id_unique
on public.reads (goodreads_id)
where goodreads_id is not null;


-- ------------------------------------------------------------
-- 8. Indexes
-- ------------------------------------------------------------

-- Catalogue queries
create index books_active_idx
on public.books (active);

create index books_title_idx
on public.books (title);

create index books_author_idx
on public.books (author);

create index books_genre_idx
on public.books (genre);


-- Loan queue queries
create index loan_requests_book_status_requested_idx
on public.loan_requests (book_id, status, requested_at);

create index loan_requests_management_token_idx
on public.loan_requests (management_token);


-- Reading history
create index reads_book_id_idx
on public.reads (book_id);

create index reads_date_read_idx
on public.reads (date_read);


-- ------------------------------------------------------------
-- End of initial schema
-- ------------------------------------------------------------