-- 002_indexes.sql
-- Essential indexes for catalog queries.

create index if not exists idx_items_category_id on public.items (category_id);
create index if not exists idx_items_published on public.items (published);
create index if not exists idx_categories_published on public.categories (published);

-- Optional but safe for array tag filtering.
create index if not exists idx_items_tags_gin on public.items using gin (tags);
