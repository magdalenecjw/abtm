create type public.read_source as enum (
  'Owned',
  'NLB'
);

alter table public.reads
alter column source type public.read_source
using source::public.read_source;