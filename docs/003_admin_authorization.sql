-- ============================================================
-- Automated Book Teller Machine
-- Admin authorization layer
-- ============================================================

-- ------------------------------------------------------------
-- 1. Admins table
-- ------------------------------------------------------------

create table public.admins (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- No policies = no access via anon/authenticated roles at all.
-- Only the service role (which bypasses RLS) or a SECURITY DEFINER
-- function can read this table. This is intentional.


-- ------------------------------------------------------------
-- 2. is_admin() helper
-- ------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admins where id = auth.uid()
  );
$$;

-- Let authenticated clients call the function itself (they still
-- can't read the admins table directly, since the function runs
-- with the owner's privileges, not the caller's).
grant execute on function public.is_admin() to authenticated;


-- ------------------------------------------------------------
-- 3. Books — admin write access
-- ------------------------------------------------------------

create policy "Admin can insert books"
on public.books
for insert
to authenticated
with check (is_admin());

create policy "Admin can update books"
on public.books
for update
to authenticated
using (is_admin())
with check (is_admin());

create policy "Admin can delete books"
on public.books
for delete
to authenticated
using (is_admin());


-- ------------------------------------------------------------
-- 4. Book covers — admin write access
-- ------------------------------------------------------------

create policy "Admin can insert covers"
on public.book_covers
for insert
to authenticated
with check (is_admin());

create policy "Admin can update covers"
on public.book_covers
for update
to authenticated
using (is_admin())
with check (is_admin());

create policy "Admin can delete covers"
on public.book_covers
for delete
to authenticated
using (is_admin());


-- ------------------------------------------------------------
-- 5. Reads — admin write access
-- ------------------------------------------------------------

create policy "Admin can insert reads"
on public.reads
for insert
to authenticated
with check (is_admin());

create policy "Admin can update reads"
on public.reads
for update
to authenticated
using (is_admin())
with check (is_admin());

create policy "Admin can delete reads"
on public.reads
for delete
to authenticated
using (is_admin());


-- ------------------------------------------------------------
-- 6. Loan requests — admin read/write
-- (Only add these if you decide NOT to route loan_requests
-- exclusively through the service role — see notes above.)
-- ------------------------------------------------------------

create policy "Admin can view all requests"
on public.loan_requests
for select
to authenticated
using (is_admin());

create policy "Admin can update requests"
on public.loan_requests
for update
to authenticated
using (is_admin())
with check (is_admin());


-- ------------------------------------------------------------
-- End of admin authorization layer
-- ------------------------------------------------------------