-- 010_items_text_image_hybrid.sql
-- Allow hybrid content for text/image items.

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
);
