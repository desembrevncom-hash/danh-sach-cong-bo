-- =============================================================
-- Round 7B-1: Stop using product_overrides.no at runtime
--
-- Strategy:
--   1. Update RPC to join product_identities by id (not legacy_no match)
--   2. Update audit trigger to use product_overrides.id instead of .no
--   3. Drop unique index on no (writes stop → index serves no purpose)
--   4. Keep physical `no` column for rollback — will drop in 7B-2
--
-- After this migration:
--   - Edge Functions no longer send `no` in upsert payloads
--   - RPC resolves id from product_identities join on id column
--   - Audit history logs product_id (uuid) instead of product_no
--   - `no` column stays but is inert (not read, not written at runtime)
-- =============================================================

-- ── 1. Drop unique index on no (no longer enforced at runtime) ──────────────
-- The PK is now id. Unique on no is legacy.
DROP INDEX IF EXISTS public.product_overrides_no_key;
DROP INDEX IF EXISTS public.product_overrides_legacy_no_key;
-- Also drop any other index directly on no:
DO $$
DECLARE
  idx_name TEXT;
BEGIN
  FOR idx_name IN
    SELECT indexname FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'product_overrides'
      AND indexdef ILIKE '%( no)%'
      AND indexname NOT LIKE '%pkey%'
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS public.%I', idx_name);
    RAISE NOTICE 'Dropped index: %', idx_name;
  END LOOP;
END;
$$;

-- ── 2. Update RPC: join by id, not legacy_no ────────────────────────────────
-- Previous join: pi.legacy_no = fd.legacy_no (where fd.legacy_no = p.no)
-- New join:      pi.id = p.id  (direct, stable, no dependency on p.no)

DROP FUNCTION IF EXISTS public.search_products_catalog(text, text, text, integer, integer);

CREATE OR REPLACE FUNCTION public.search_products_catalog(
    search_term text DEFAULT NULL::text,
    cat_id      text DEFAULT NULL::text,
    brand_id    text DEFAULT 'desembre'::text,
    page_num    integer DEFAULT 1,
    page_size   integer DEFAULT 20
)
RETURNS TABLE (
    id          text,
    legacy_no   bigint,
    display_no  bigint,
    brand       text,
    section     text,
    name        text,
    "desc"      text,
    image_url   text,
    link_url    text,
    link_url_2  text,
    is_custom   boolean,
    sort_order  integer,
    total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    WITH filtered_data AS (
        SELECT
            p.id                AS product_id,
            pi.legacy_no        AS legacy_no,
            p.name,
            p."desc",
            p.image_url,
            p.link_url,
            p.link_url_2,
            p.section,
            p.brand,
            p.is_custom,
            p.sort_order
        FROM public.product_overrides p
        -- Round 7B-1: join by id directly, no dependency on p.no
        JOIN public.product_identities pi
          ON pi.id = p.id
        WHERE (p.deleted IS NOT TRUE)
          AND (p.brand = brand_id)
          AND (cat_id IS NULL OR cat_id = '' OR p.section = cat_id)
          AND (
            search_term IS NULL OR search_term = ''
            OR p.search_vector @@ plainto_tsquery('simple', search_term)
          )
    ),
    count_total AS (
        SELECT COUNT(*) AS total FROM filtered_data
    )
    SELECT
        fd.product_id::text                                                         AS id,
        fd.legacy_no::bigint                                                        AS legacy_no,
        (ROW_NUMBER() OVER (ORDER BY fd.sort_order ASC, fd.legacy_no ASC))::bigint AS display_no,
        fd.brand,
        fd.section,
        fd.name,
        fd."desc",
        fd.image_url,
        fd.link_url,
        fd.link_url_2,
        fd.is_custom,
        fd.sort_order,
        ct.total AS total_count
    FROM filtered_data fd
    CROSS JOIN count_total ct
    LIMIT page_size OFFSET (GREATEST(page_num, 1) - 1) * page_size;
END;
$function$;

-- ── 3. Update audit trigger to use id instead of no ─────────────────────────
-- product_overrides_history.product_no still exists for historical data.
-- New rows written with id (uuid cast to text) stored in a separate column.

-- Add product_id column to history if not exists (backward compat: keep product_no for old rows)
ALTER TABLE public.product_overrides_history
  ADD COLUMN IF NOT EXISTS product_id TEXT;

CREATE INDEX IF NOT EXISTS idx_alog_product_id ON public.product_overrides_history (product_id);

-- Update trigger function: write id into product_id, keep product_no = 0 sentinel for new rows
CREATE OR REPLACE FUNCTION public.fn_audit_product_overrides()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.product_overrides_history
      (action, product_no, product_id, old_data, new_data)
    VALUES
      -- product_no kept for schema compat; use product_id for new queries
      ('INSERT', COALESCE(NEW.no, 0), NEW.id::text, NULL, to_jsonb(NEW));

  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.product_overrides_history
      (action, product_no, product_id, old_data, new_data)
    VALUES
      ('UPDATE', COALESCE(NEW.no, 0), NEW.id::text, to_jsonb(OLD), to_jsonb(NEW));

  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO public.product_overrides_history
      (action, product_no, product_id, old_data, new_data)
    VALUES
      ('DELETE', COALESCE(OLD.no, 0), OLD.id::text, to_jsonb(OLD), NULL);
  END IF;

  RETURN NULL;
END;
$$;

-- ── 4. Validation queries (run manually after migration) ────────────────────
/*
-- Confirm RPC returns no null ids:
SELECT * FROM public.search_products_catalog(NULL, NULL, 'desembre', 1, 20) WHERE id IS NULL;
SELECT * FROM public.search_products_catalog(NULL, NULL, 'dermagarden', 1, 20) WHERE id IS NULL;

-- Confirm RPC returns rows:
SELECT COUNT(*) FROM public.search_products_catalog(NULL, NULL, 'desembre', 1, 20);

-- Confirm no still exists (not dropped yet):
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'product_overrides' AND column_name = 'no';

-- Confirm audit history has product_id column:
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'product_overrides_history' AND column_name = 'product_id';
*/
