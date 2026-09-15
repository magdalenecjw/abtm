-- ============================================================
-- Automated Book Teller Machine
-- One approved request per book (database-level safety net)
-- ============================================================
--
-- technical-specifications.md §25 requires this constraint to exist
-- as the final safety net beneath the application-level check in the
-- approve action (workflows.md §5.4) — confirmed missing from
-- 001_initial_schema.sql. A partial unique index enforces it: only
-- one row per book_id can have status = 'approved' at any time.

create unique index loan_requests_one_approved_per_book
on public.loan_requests (book_id)
where status = 'approved';

-- ------------------------------------------------------------
-- End
-- ------------------------------------------------------------