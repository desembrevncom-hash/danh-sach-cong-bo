-- 1. Create product_identities table
CREATE TABLE IF NOT EXISTS public.product_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  legacy_no bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand, legacy_no)
);

-- 2. Backfill from product_overrides (for existing edited products)
-- We assume the current database state might only have overrides.
-- Products not in product_overrides must be backfilled manually or via another script.
INSERT INTO public.product_identities (id, brand, legacy_no)
SELECT 
  id, 
  COALESCE(brand, 'desembre'), -- default to desembre if missing
  no
FROM public.product_overrides
WHERE no IS NOT NULL
ON CONFLICT (brand, legacy_no) DO NOTHING;

-- 3. Validation views/queries for the user
-- SELECT * FROM search_products_catalog(NULL, NULL, 1, 50, 'desembre') WHERE id IS NULL;
-- SELECT id, count(*) FROM public.product_identities GROUP BY id HAVING count(*) > 1;

-- 4. RPC Skeleton for the user to fill in:
/*
CREATE OR REPLACE FUNCTION search_products_catalog(
  p_search_term text DEFAULT NULL,
  p_cat_id text DEFAULT NULL,
  p_page_num integer DEFAULT 1,
  p_page_size integer DEFAULT 20,
  p_brand_id text DEFAULT 'desembre'
)
RETURNS TABLE (
  id text,
  legacy_no bigint,
  display_no bigint,
  name text,
  "desc" text,
  image_url text,
  link_url text,
  link_url_2 text,
  section text,
  brand text,
  is_custom boolean,
  sort_order integer,
  total_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pi.id::text as id,
    source.no as legacy_no,
    row_number() over(...) as display_no,
    source.name,
    ...
  FROM your_static_catalog_source source
  LEFT JOIN public.product_identities pi 
    ON pi.brand = source.brand AND pi.legacy_no = source.no
  -- ... JOIN overrides etc.
  WHERE (pi.id IS NOT NULL); -- Make sure to not return NULL ids!
END;
$$ LANGUAGE plpgsql;
*/
