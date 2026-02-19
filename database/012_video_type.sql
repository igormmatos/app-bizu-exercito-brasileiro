-- 012_video_type.sql
-- Add support for `video` items with mandatory YouTube link.
-- Execute manually in Supabase SQL Editor.
-- Constraints are recreated with NOT VALID and validated after creation.

alter table public.items
add column if not exists link text null;

alter table public.items
drop constraint if exists items_type_chk;

alter table public.items
add constraint items_type_chk check (
  type in ('pdf', 'audio', 'image', 'text', 'video')
) not valid;

alter table public.items
validate constraint items_type_chk;

alter table public.items
drop constraint if exists items_content_chk;

alter table public.items
add constraint items_content_chk check (
  (
    type = 'pdf'
    and storage_path is not null
    and nullif(trim(storage_path), '') is not null
    and storage_path like 'pdf/%'
    and text_body is null
  )
  or
  (
    type = 'audio'
    and storage_path is not null
    and nullif(trim(storage_path), '') is not null
    and storage_path like 'audio/%'
    and text_body is null
  )
  or
  (
    type = 'image'
    and storage_path is not null
    and nullif(trim(storage_path), '') is not null
    and storage_path like 'image/%'
    and (
      text_body is null
      or nullif(trim(text_body), '') is not null
    )
  )
  or
  (
    type = 'text'
    and text_body is not null
    and nullif(trim(text_body), '') is not null
    and (
      storage_path is null
      or (
        nullif(trim(storage_path), '') is not null
        and storage_path like 'image/%'
      )
    )
  )
  or
  (
    type = 'video'
    and storage_path is null
    and link is not null
    and nullif(trim(link), '') is not null
    and trim(link) ~* '^https?://([a-z0-9-]+\.)?(youtube\.com|youtu\.be)/.+'
    and (
      text_body is null
      or nullif(trim(text_body), '') is not null
    )
  )
) not valid;

alter table public.items
validate constraint items_content_chk;
