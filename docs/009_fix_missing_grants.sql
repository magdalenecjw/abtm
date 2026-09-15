-- ============================================================
-- Automated Book Teller Machine
-- Fix missing base table grants + add missing admin SELECT policy
-- ============================================================
--
-- RLS policies filter ROWS, but Postgres also requires a base
-- GRANT before a role can touch a table at all — that base grant
-- was never applied to anon/authenticated on any table (confirmed
-- via information_schema.role_table_grants: only TRIGGER/
-- REFERENCES/TRUNCATE were present for those roles, none of which
-- allow normal reads/writes). Every RLS policy written so far has
-- therefore been silently inert. This migration adds the grants
-- each existing policy already assumes exist.

-- ------------------------------------------------------------
-- Public read access (matches 002_initial_rls.sql policies)
-- ------------------------------------------------------------
grant select on public.books to anon, authenticated;
grant select on public.book_covers to anon, authenticated;
grant select on public.reads to anon, authenticated;

-- ------------------------------------------------------------
-- Admin write access (matches 003_admin_authorization.sql policies)
-- ------------------------------------------------------------
grant insert, update, delete on public.books to authenticated;
grant insert, update, delete on public.book_covers to authenticated;
grant insert, update, delete on public.reads to authenticated;

-- loan_requests: admin can view + update only — no admin insert/delete
-- policy exists (matches 003_admin_authorization.sql §6; request
-- creation/cancellation is handled through the service role instead).
grant select, update on public.loan_requests to authenticated;

-- Note: public.admins intentionally receives NO grant here — it has
-- no anon/authenticated policies at all (003_admin_authorization.sql
-- §1), and that's deliberate. Leave it locked down.

-- ------------------------------------------------------------
-- Missing policy: admin needs to see ALL books, not just active
-- ones. The only existing SELECT policy on books
-- ("Public can view active books", 002_initial_rls.sql) filters to
-- active = true, and also applies to authenticated admins (it's
-- granted "to anon, authenticated"). But the spreadsheet sync
-- feature (docs/workflows.md §6.3) needs to see inactive books too,
-- to correctly detect "Missing from spreadsheet" rows and to
-- re-sync a previously-deactivated book. Multiple permissive SELECT
-- policies combine with OR, so this adds the missing case without
-- touching the existing public-facing policy.
-- ------------------------------------------------------------
create policy "Admin can view all books"
on public.books
for select
to authenticated
using (is_admin());

-- ------------------------------------------------------------
-- End
-- ------------------------------------------------------------