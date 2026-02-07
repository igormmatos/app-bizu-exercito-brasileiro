-- 004_policies.sql
-- Public read only published rows; authenticated users can write.

-- Categories
drop policy if exists categories_public_read_published on public.categories;
drop policy if exists categories_authenticated_read_all on public.categories;
drop policy if exists categories_authenticated_insert on public.categories;
drop policy if exists categories_authenticated_update on public.categories;
drop policy if exists categories_authenticated_delete on public.categories;

create policy categories_public_read_published
on public.categories
for select
to anon
using (published = true);

create policy categories_authenticated_read_all
on public.categories
for select
to authenticated
using (true);

create policy categories_authenticated_insert
on public.categories
for insert
to authenticated
with check (true);

create policy categories_authenticated_update
on public.categories
for update
to authenticated
using (true)
with check (true);

create policy categories_authenticated_delete
on public.categories
for delete
to authenticated
using (true);

-- Items
drop policy if exists items_public_read_published on public.items;
drop policy if exists items_authenticated_read_all on public.items;
drop policy if exists items_authenticated_insert on public.items;
drop policy if exists items_authenticated_update on public.items;
drop policy if exists items_authenticated_delete on public.items;

create policy items_public_read_published
on public.items
for select
to anon
using (published = true);

create policy items_authenticated_read_all
on public.items
for select
to authenticated
using (true);

create policy items_authenticated_insert
on public.items
for insert
to authenticated
with check (true);

create policy items_authenticated_update
on public.items
for update
to authenticated
using (true)
with check (true);

create policy items_authenticated_delete
on public.items
for delete
to authenticated
using (true);
