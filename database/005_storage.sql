-- 005_storage.sql
-- Create/update public bucket "content" and object policies.

insert into storage.buckets (id, name, public)
values ('content', 'content', true)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public;

-- storage.objects is managed by Supabase; enabling RLS here may fail with ownership errors.
-- In Supabase projects, this table already uses RLS semantics for storage policies.

drop policy if exists storage_content_public_read on storage.objects;
drop policy if exists storage_content_authenticated_read on storage.objects;
drop policy if exists storage_content_authenticated_insert on storage.objects;
drop policy if exists storage_content_authenticated_update on storage.objects;
drop policy if exists storage_content_authenticated_delete on storage.objects;

create policy storage_content_public_read
on storage.objects
for select
to anon
using (bucket_id = 'content');

create policy storage_content_authenticated_read
on storage.objects
for select
to authenticated
using (bucket_id = 'content');

create policy storage_content_authenticated_insert
on storage.objects
for insert
to authenticated
with check (bucket_id = 'content');

create policy storage_content_authenticated_update
on storage.objects
for update
to authenticated
using (bucket_id = 'content')
with check (bucket_id = 'content');

create policy storage_content_authenticated_delete
on storage.objects
for delete
to authenticated
using (bucket_id = 'content');
