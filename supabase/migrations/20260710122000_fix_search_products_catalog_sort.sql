-- Round 9B: Update search_products_catalog to remove legacy_no dependency and use catalog_sections sort

drop function if exists public.search_products_catalog(text, text, text, integer, integer);

create or replace function public.search_products_catalog(
    search_term text default null::text, 
    cat_id text default null::text, 
    brand_id text default 'desembre'::text, 
    page_num integer default 1, 
    page_size integer default 20
)
returns table (
    id text,
    legacy_no bigint,
    display_no bigint,
    brand text,
    section text,
    name text,
    "desc" text,
    image_url text,
    link_url text,
    link_url_2 text,
    is_custom boolean,
    sort_order integer,
    total_count bigint
)
language plpgsql
security definer
as $function$
begin
    return query
    with filtered_data as (
        select 
            p.id,
            0::bigint as legacy_no, 
            p.name, 
            p."desc", 
            p.image_url, 
            p.link_url, 
            p.link_url_2, 
            p.section, 
            p.brand, 
            p.is_custom, 
            p.sort_order,
            p.updated_at
        from public.product_overrides p
        where (p.deleted is not true)
        and (p.brand = brand_id)
        and (cat_id is null or cat_id = '' or p.section = cat_id)
        and (search_term is null or search_term = '' or p.search_vector @@ plainto_tsquery('simple', search_term))
    ),
    joined_data as (
        select 
            fd.*,
            coalesce(cs.sort_order, 9999) as section_sort_order
        from filtered_data fd
        left join public.catalog_sections cs on cs.value = fd.section and cs.brand = fd.brand
    ),
    count_total as (
        select count(*) as total from joined_data
    )
    select 
        jd.id::text as id,
        jd.legacy_no,
        (row_number() over (order by jd.section_sort_order asc, jd.sort_order asc, jd.updated_at desc))::bigint as display_no,
        jd.brand,
        jd.section,
        jd.name,
        jd."desc",
        jd.image_url,
        jd.link_url,
        jd.link_url_2,
        jd.is_custom,
        jd.sort_order,
        ct.total as total_count
    from joined_data jd
    cross join count_total ct
    order by jd.section_sort_order asc, jd.sort_order asc, jd.updated_at desc
    limit page_size offset (greatest(page_num, 1) - 1) * page_size;
end;
$function$;
