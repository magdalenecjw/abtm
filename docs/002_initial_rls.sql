-- ============================================================
-- Automated Book Teller Machine
-- Initial RLS policies
-- ============================================================


-- ------------------------------------------------------------
-- Books
-- ------------------------------------------------------------

create policy "Public can view active books"
on public.books
for select
to anon, authenticated
using (active = true);


-- ------------------------------------------------------------
-- Book covers
-- ------------------------------------------------------------

create policy "Public can view book covers"
on public.book_covers
for select
to anon, authenticated
using (true);


-- ------------------------------------------------------------
-- Reading history
-- ------------------------------------------------------------

create policy "Public can view reads"
on public.reads
for select
to anon, authenticated
using (true);


-- ------------------------------------------------------------
-- Loan requests
-- ------------------------------------------------------------

-- Intentionally no public policies here.
--
-- Borrower access will be implemented through a controlled
-- mechanism using the management token.
--
-- Admin access will be added separately.