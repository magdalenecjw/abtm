-- ============================================================
-- Automated Book Teller Machine
-- Public-safe derived loan status view
-- ============================================================
--
-- loan_requests has no public RLS policy (002_initial_rls.sql) —
-- real_name must never be publicly queryable. But the public
-- catalogue needs derived availability (technical-specifications.md
-- §8) and, when on loan, the borrower's nickname + loan start date
-- (§14). This view exposes only those safe, aggregated fields.
--
-- Views are checked against the view OWNER's privileges for
-- underlying table access, not the querying role's — so this
-- view can read loan_requests (bypassing its RLS) while still
-- only ever returning the narrow set of columns defined below.
-- The public is granted access to the view, never to the table.

create view public.book_loan_status as
select
  b.id as book_id,
  bool_or(lr.status = 'pending') as has_pending_request,
  bool_or(lr.status = 'approved') as has_approved_request,
  max(lr.nickname) filter (where lr.status = 'approved')
    as current_borrower_nickname,
  max(lr.approved_at) filter (where lr.status = 'approved')
    as loan_started_at
from public.books b
left join public.loan_requests lr
  on lr.book_id = b.id
  and lr.status in ('pending', 'approved')
group by b.id;

grant select on public.book_loan_status to anon, authenticated;

-- ------------------------------------------------------------
-- End of public-safe derived loan status view
-- ------------------------------------------------------------