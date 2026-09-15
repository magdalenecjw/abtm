-- ============================================================
-- Automated Book Teller Machine
-- Fix missing base table grants for service_role
-- ============================================================
--
-- Same root cause as 009_fix_missing_grants.sql, but for
-- service_role this time: confirmed via
-- information_schema.role_table_grants that service_role has only
-- TRUNCATE/REFERENCES/TRIGGER on every table in this project — no
-- SELECT/INSERT/UPDATE/DELETE anywhere. This project evidently never
-- got Supabase's usual default-privilege bootstrap for ANY role
-- except the table owner.
--
-- service_role bypasses RLS by design (that's the whole point of
-- using it from src/lib/supabase/admin.ts for the public borrowing
-- flow — technical-specifications.md §23), but RLS-bypass and having
-- a base table GRANT are two separate things in Postgres; this fixes
-- the latter.

grant select, insert, update, delete
  on public.books
  to service_role;

grant select, insert, update, delete
  on public.book_covers
  to service_role;

grant select, insert, update, delete
  on public.loan_requests
  to service_role;

grant select, insert, update, delete
  on public.reads
  to service_role;

grant select, insert, update, delete
  on public.verification_tokens
  to service_role;

grant select, insert, update, delete
  on public.passcode_attempts
  to service_role;

grant select on public.book_loan_status to service_role;

-- Note: public.admins is deliberately left ungranted for
-- service_role — nothing in the current codebase needs the
-- service-role client to query it directly.

-- ------------------------------------------------------------
-- End
-- ------------------------------------------------------------