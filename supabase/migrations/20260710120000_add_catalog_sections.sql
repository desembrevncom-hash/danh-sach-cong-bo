-- Round 9B: Catalog Sections

-- 1. Helper function for RLS
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
      and role = 'admin'
  );
$$;

-- 2. Create catalog_sections table
create table if not exists public.catalog_sections (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  value text not null,
  label text not null,
  description text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_sections_brand_value_key unique (brand, value)
);

create index if not exists catalog_sections_brand_idx on public.catalog_sections(brand);
create index if not exists catalog_sections_sort_order_idx on public.catalog_sections(sort_order);

alter table public.catalog_sections enable row level security;

-- Admin can do anything
create policy "Admin full access to catalog_sections"
on public.catalog_sections
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Public can read active sections
create policy "Public can read active catalog_sections"
on public.catalog_sections
for select
to public
using (active = true);

-- 3. Backfill from product_overrides
insert into public.catalog_sections (brand, value, label, sort_order)
select distinct
  brand,
  section as value,
  section as label, -- Initially just use section value as label
  0 as sort_order
from public.product_overrides
where brand is not null
  and section is not null
  and section <> ''
on conflict (brand, value) do nothing;
