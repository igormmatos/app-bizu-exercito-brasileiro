-- 001_tables.sql
-- Core catalog tables compatible with packages/shared domain contract.

create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0,
  published boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text null,
  type text not null,
  category_id uuid not null references public.categories(id) on delete restrict,
  tags text[] null,
  published boolean not null default false,
  storage_path text null,
  text_body text null,
  updated_at timestamptz not null default now(),
  constraint items_type_chk check (type in ('pdf', 'audio', 'image', 'text')),
  constraint items_content_chk check (
    (
      type = 'text'
      and text_body is not null
      and nullif(trim(text_body), '') is not null
      and storage_path is null
    )
    or
    (
      type in ('pdf', 'audio', 'image')
      and storage_path is not null
      and nullif(trim(storage_path), '') is not null
      and text_body is null
    )
  )
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_categories_set_updated_at on public.categories;
create trigger trg_categories_set_updated_at
before update on public.categories
for each row
execute function public.set_updated_at();

drop trigger if exists trg_items_set_updated_at on public.items;
create trigger trg_items_set_updated_at
before update on public.items
for each row
execute function public.set_updated_at();
