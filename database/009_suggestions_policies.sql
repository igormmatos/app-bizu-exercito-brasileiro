-- 009_suggestions_policies.sql
-- Policies for anonymous submit and authenticated triage.

drop policy if exists suggestions_anon_insert on public.suggestions;
drop policy if exists suggestions_authenticated_read_all on public.suggestions;
drop policy if exists suggestions_authenticated_update_status on public.suggestions;

create policy suggestions_anon_insert
on public.suggestions
for insert
to anon
with check (true);

create policy suggestions_authenticated_read_all
on public.suggestions
for select
to authenticated
using (true);

create policy suggestions_authenticated_update_status
on public.suggestions
for update
to authenticated
using (true)
with check (status in ('new', 'triaged', 'done'));

-- Keep authenticated updates limited to the "status" column.
revoke update on public.suggestions from authenticated;
grant update (status) on public.suggestions to authenticated;
