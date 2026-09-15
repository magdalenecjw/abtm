-- ============================================================
-- Automated Book Teller Machine
-- Covers Storage bucket + access policies
-- ============================================================
--
-- Public bucket: cover images are shown to any visitor in the book
-- details modal, no auth required (technical-specifications.md §15).
-- Only admins can write. Storage convention per §5.2:
-- covers/{book_id}.{extension} — {book_id} here is the internal UUID
-- (books.id), matching book_covers.book_id, NOT the human-readable
-- book_id TEXT code (books.book_id) — same naming ambiguity we
-- already hit once with book_loan_status (010), avoided here by
-- using the UUID consistently and not calling it "book_id" in code.

insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

-- Explicit SELECT policy as defense-in-depth (the bucket's own
-- "public" flag already allows direct-URL downloads regardless, but
-- this also covers any API-based read going through storage.objects
-- RLS) — mirrors the "Public can view book covers" pattern already
-- used for the book_covers table (002_initial_rls.sql).
create policy "Public can view covers in storage"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'covers');

create policy "Admin can upload covers"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'covers' and is_admin());

create policy "Admin can update covers in storage"
on storage.objects
for update
to authenticated
using (bucket_id = 'covers' and is_admin())
with check (bucket_id = 'covers' and is_admin());

create policy "Admin can delete covers in storage"
on storage.objects
for delete
to authenticated
using (bucket_id = 'covers' and is_admin());

-- ------------------------------------------------------------
-- End
-- ------------------------------------------------------------