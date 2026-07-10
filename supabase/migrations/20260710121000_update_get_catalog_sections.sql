-- Round 9B: Update get_catalog_sections RPC

drop function if exists public.get_catalog_sections(text, boolean);

create or replace function public.get_catalog_sections(
  brand_id text default 'desembre'::text,
  include_hidden boolean default false
)
returns table (
  section text,
  label text,
  sort_order integer,
  total_count bigint,
  visible_count bigint,
  active boolean
)
language sql
security definer
as $$
  with product_counts as (
    select
      p.section,
      count(*)::bigint as total_count,
      count(*) filter (where p.deleted is not true)::bigint as visible_count
    from public.product_overrides p
    where p.brand = brand_id
      and p.section is not null
      and p.section <> ''
    group by p.section
  ),
  all_sections as (
    select
      c.value as section,
      c.label,
      c.sort_order,
      coalesce(pc.total_count, 0) as total_count,
      coalesce(pc.visible_count, 0) as visible_count,
      c.active
    from public.catalog_sections c
    left join product_counts pc on pc.section = c.value
    where c.brand = brand_id
    
    union
    
    -- Fallback for sections in products that aren't in catalog_sections
    select
      pc.section as section,
      pc.section as label,
      9999 as sort_order,
      pc.total_count,
      pc.visible_count,
      true as active
    from product_counts pc
    left join public.catalog_sections c on c.value = pc.section and c.brand = brand_id
    where c.value is null
  )
  select * from all_sections
  where (include_hidden = true or (active = true and visible_count > 0))
  order by sort_order asc, section asc;
$$;

grant execute on function public.get_catalog_sections(text, boolean) to anon, authenticated;
