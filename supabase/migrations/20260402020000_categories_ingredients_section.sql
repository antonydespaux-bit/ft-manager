alter table public.categories_ingredients
  add column if not exists section text not null default 'cuisine'
  check (section in ('cuisine', 'bar'));
