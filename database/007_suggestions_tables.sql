-- 007_suggestions_tables.sql
-- Suggestions table for anonymous feedback.

create extension if not exists pgcrypto;

create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  message text not null,
  category text null,
  contact text null,
  app_version text null,
  device text null,
  status text not null default 'new',
  constraint suggestions_message_chk check (
    nullif(trim(message), '') is not null
    and char_length(message) <= 2000
  ),
  constraint suggestions_category_chk check (
    category is null or char_length(category) <= 50
  ),
  constraint suggestions_contact_chk check (
    contact is null or char_length(contact) <= 200
  ),
  constraint suggestions_app_version_chk check (
    app_version is null or char_length(app_version) <= 50
  ),
  constraint suggestions_device_chk check (
    device is null or char_length(device) <= 200
  ),
  constraint suggestions_status_chk check (
    status in ('new', 'triaged', 'done')
  )
);
