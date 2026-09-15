-- ============================================================
-- Automated Book Teller Machine
-- Rename ambiguous column in book_loan_status
-- ============================================================
--
-- book_loan_status.book_id (008_public_book_status_view.sql) actually
-- holds books.id (the internal UUID), NOT books.book_id (the
-- human-readable code like "BK0001"). Same column name, different
-- meaning, in two tables about to be joined in application code — a
-- guaranteed source of confusion/bugs. Renaming to books_uuid makes
-- the join key unambiguous.

alter view public.book_loan_status rename column book_id to books_uuid;

-- ------------------------------------------------------------
-- End
-- ------------------------------------------------------------