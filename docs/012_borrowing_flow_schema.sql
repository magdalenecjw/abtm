-- ============================================================
-- Automated Book Teller Machine
-- Borrowing flow schema: management token hashing, verification
-- tokens, and passcode rate limiting
-- ============================================================

-- 1. Replace plain-text management_token with a hash, per
-- workflows.md §5.5 / technical-specifications.md §21-22: raw
-- management tokens must never be persisted — only a hash, so a
-- database compromise can't expose working borrower credentials.
-- This is a destructive column drop; safe only because no
-- loan_requests rows exist yet (the borrowing flow was never
-- functional before this point). Verify with
-- `select count(*) from public.loan_requests;` returns 0 before
-- running this.

alter table public.loan_requests
  drop column if exists management_token;

alter table public.loan_requests
  add column management_token_hash text not null default '';

-- Drop the default now that it's served its purpose (only needed to
-- satisfy NOT NULL while the column had no real values) — every row
-- created from now on sets a real hash explicitly.
alter table public.loan_requests
  alter column management_token_hash drop default;


-- 2. Verification tokens (workflows.md §3.2): short-lived,
-- single-use, issued after correct passcode entry. Stored hashed,
-- consistent with management tokens — the spec doesn't explicitly
-- require hashing this one, but the same defense-in-depth reasoning
-- applies at negligible extra cost.
create table public.verification_tokens (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.verification_tokens enable row level security;
-- No anon/authenticated policies — only the service role can touch
-- this table, same pattern as public.admins
-- (003_admin_authorization.sql §1). The public borrowing flow reads/
-- writes this via the service-role client from server actions
-- (technical-specifications.md §23: request creation should go
-- through controlled server-side logic, not direct RLS-gated access).


-- 3. Passcode attempt tracking, for rate limiting (workflows.md
-- §3.2: 5 incorrect attempts per IP -> 24h lockout).
create table public.passcode_attempts (
  id uuid primary key default gen_random_uuid(),
  ip_address text not null,
  attempted_at timestamptz not null default now()
);

create index passcode_attempts_ip_time_idx
  on public.passcode_attempts (ip_address, attempted_at);

alter table public.passcode_attempts enable row level security;
-- No anon/authenticated policies — service-role only, same reasoning
-- as verification_tokens above.

-- ------------------------------------------------------------
-- End
-- ------------------------------------------------------------