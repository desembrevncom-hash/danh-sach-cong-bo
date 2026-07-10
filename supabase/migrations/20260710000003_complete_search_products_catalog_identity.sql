-- Migration 4.2: Complete Search Products Catalog Identity

-- 1. Backfill identities from product_overrides
INSERT INTO public.product_identities (brand, legacy_no)
SELECT DISTINCT p.brand, p.no::bigint
FROM public.product_overrides p
WHERE p.brand IS NOT NULL
  AND p.no IS NOT NULL
ON CONFLICT (brand, legacy_no) DO NOTHING;

-- 2. Drop the old function because we are changing the return type
DROP FUNCTION IF EXISTS public.search_products_catalog(text, text, text, integer, integer);

-- 3. Create the new function returning the exact requested contract
CREATE OR REPLACE FUNCTION public.search_products_catalog(
    search_term text DEFAULT NULL::text, 
    cat_id text DEFAULT NULL::text, 
    brand_id text DEFAULT 'desembre'::text, 
    page_num integer DEFAULT 1, 
    page_size integer DEFAULT 20
)
RETURNS TABLE (
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
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    WITH filtered_data AS (
        SELECT 
            p.no as legacy_no, 
            p.name, 
            p."desc", 
            p.image_url, 
            p.link_url, 
            p.link_url_2, 
            p.section, 
            p.brand, 
            p.is_custom, 
            p.sort_order,
            cs.sort_order as section_sort_order
        FROM "product_overrides" p
        LEFT JOIN "catalog_sections" cs ON p.section = cs.value AND p.brand = cs.brand
        WHERE (p.deleted IS NOT TRUE)
        AND (p.brand = brand_id)
        AND (cat_id IS NULL OR cat_id = '' OR p.section = cat_id)
        AND (search_term IS NULL OR search_term = '' OR p.search_vector @@ plainto_tsquery('simple', search_term))
    ),
    count_total AS (
        SELECT COUNT(*) AS total FROM filtered_data
    )
    SELECT 
        pi.id::text as id,
        fd.legacy_no::bigint as legacy_no,
        (ROW_NUMBER() OVER (ORDER BY fd.section_sort_order ASC NULLS LAST, fd.sort_order ASC, fd.legacy_no ASC))::bigint as display_no,
        fd.brand,
        fd.section,
        fd.name,
        fd."desc",
        fd.image_url,
        fd.link_url,
        fd.link_url_2,
        fd.is_custom,
        fd.sort_order,
        ct.total as total_count
    FROM filtered_data fd
    JOIN public.product_identities pi
      ON pi.brand = fd.brand
     AND pi.legacy_no = fd.legacy_no::bigint
    CROSS JOIN count_total ct
    ORDER BY fd.section_sort_order ASC NULLS LAST, fd.sort_order ASC, fd.legacy_no ASC
    LIMIT page_size OFFSET (GREATEST(page_num, 1) - 1) * page_size;
END;
$function$;

-- 4. Validation queries for the developer to run after migration
/*
select * from public.search_products_catalog(null, null, 'desembre', 1, 50) where id is null;
select * from public.search_products_catalog(null, null, 'dermagarden', 1, 50) where id is null;
select brand, legacy_no, count(*) from public.product_identities group by brand, legacy_no having count(*) > 1;
select id, count(*) from public.product_identities group by id having count(*) > 1;
*/
