-- 013_items_audio_video_separate_constraints.sql
-- Split audio/video validation into dedicated constraints.
-- Execute manually in Supabase SQL Editor.

alter table public.items
add column if not exists link text null;

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
  )
) not valid;

alter table public.items
validate constraint items_content_chk;

alter table public.items
drop constraint if exists items_audio_text_body_chk;

alter table public.items
add constraint items_audio_text_body_chk check (
  type <> 'audio'
  or text_body is null
  or nullif(trim(text_body), '') is not null
) not valid;

alter table public.items
validate constraint items_audio_text_body_chk;

alter table public.items
drop constraint if exists items_video_link_chk;

alter table public.items
add constraint items_video_link_chk check (
  type <> 'video'
  or (
    link is not null
    and nullif(trim(link), '') is not null
    and trim(link) ~* '^https?://([a-z0-9-]+\.)?(youtube\.com|youtu\.be)/.+'
  )
) not valid;

alter table public.items
validate constraint items_video_link_chk;

alter table public.items
drop constraint if exists items_video_storage_path_chk;

alter table public.items
add constraint items_video_storage_path_chk check (
  type <> 'video'
  or storage_path is null
) not valid;

alter table public.items
validate constraint items_video_storage_path_chk;

alter table public.items
drop constraint if exists items_video_text_body_chk;

alter table public.items
add constraint items_video_text_body_chk check (
  type <> 'video'
  or text_body is null
  or nullif(trim(text_body), '') is not null
) not valid;

alter table public.items
validate constraint items_video_text_body_chk;
