alter table public.loan_requests
add column approved_at timestamptz;

alter table public.loan_requests
add column email_delivery_failed boolean not null default false;