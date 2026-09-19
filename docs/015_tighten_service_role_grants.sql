-- ============================================================
-- Automated Book Teller Machine
-- Tighten service_role grants to least privilege
-- ============================================================
--
-- Security review (technical-specifications.md §35) found that
-- 013_fix_service_role_grants.sql granted service_role broader
-- access than the code actually uses. service_role bypasses RLS
-- entirely (src/lib/supabase/admin.ts, used only by
-- src/app/borrow-actions.ts) — if that key were ever leaked, it
-- currently has full read/write on tables it never touches at all.
--
-- Confirmed by auditing every .from(...) call in borrow-actions.ts
-- (the only consumer of the service-role client):
--   - books: SELECT only (checking a book is still active)
--   - book_covers: never touched at all
--   - reads: never touched at all
--   - loan_requests: SELECT, INSERT, UPDATE (never DELETE — completed
--     requests are preserved per §28, never removed)
--   - verification_tokens: SELECT, INSERT, UPDATE (never DELETE —
--     expired/used tokens are just left in place, not cleaned up)
--   - passcode_attempts: SELECT, INSERT only (never UPDATE/DELETE —
--     attempts are just accumulated and counted)

revoke insert, update, delete on public.books from service_role;

revoke all on public.book_covers from service_role;

revoke all on public.reads from service_role;

revoke delete on public.loan_requests from service_role;

revoke delete on public.verification_tokens from service_role;

revoke