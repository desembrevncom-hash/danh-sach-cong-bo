create or replace function public.get_catalog_sections(
  brand_id text default 'desembre'::text,
  include_hidden boolean default false
)
returns table (
  section text,
  total_count bigint,
  visible_count bigint
)
language sql
security definer
as $$
  select
    p.section,
    count(*)::bigint as total_count,
    count(*) filter (where p.deleted is not true)::bigint as visible_count
  from public.product_overrides p
  where p.brand = brand_id
    and p.section is not null
    and p.section <> ''
    and (
      include_hidden = true
      or p.deleted is not true
    )
  group by p.section
  order by p.section asc;
$$;

grant execute on function public.get_catalog_sections(text, boolean) to anon, authenticated;
