-- 003_rls.sql
-- Enable row level security.

alter table public.categories enable row level security;
alter table public.items enable row level security;
