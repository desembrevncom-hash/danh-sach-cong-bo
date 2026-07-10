-- =============================================================
-- Round 7B-2: Drop physical `no` column from product_overrides
--
-- PRECONDITIONS (must be verified before running):
--   1. Round 7B-1 migration has been applied and running in production.
--   2. Edge Functions no longer send `no` in upsert payloads.
--   3. RPC search_products_catalog no longer reads p.no.
--   4. Audit trigger uses COALESCE(NEW.no, 0) — safe to drop after this.
--   5. No other DB function reads product_overrides.no (verify below).
--
-- PREFLIGHT AUDIT (run manually first):
--   select n.nspname as schema_name, p.proname as function_name, pg_get_functiondef(p.oid) as function_definition
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where pg_get_functiondef(p.oid) ilike '%product_overrides%'
--     and pg_get_functiondef(p.oid) ilike '%no%';
--   → STOP if any function uses product_overrides.no, NEW.no, or OLD.no (except fn_audit_product_overrides which we replace below).
--
-- ROLLBACK PLAN:
--   ALTER TABLE public.product_overrides ADD COLUMN no INTEGER;
--   UPDATE public.product_overrides po
--   SET no = b.no
--   FROM public.product_overrides_legacy_no_backup b WHERE b.id = po.id;
-- =============================================================

BEGIN;

-- ── 1. Backup legacy no ──────────────────────────────────────────────────────
create table if not exists public.product_overrides_legacy_no_backup as
select
  id,
  no,
  brand,
  now() as backed_up_at
from public.product_overrides
where no is not null;

-- ── 2. Update audit trigger to remove dependency on no before drop ──────────
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
      ('INSERT', 0, NEW.id::text, NULL, to_jsonb(NEW));

  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.product_overrides_history
      (action, product_no, product_id, old_data, new_data)
    VALUES
      ('UPDATE', 0, NEW.id::text, to_jsonb(OLD), to_jsonb(NEW));

  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO public.product_overrides_history
      (action, product_no, product_id, old_data, new_data)
    VALUES
      ('DELETE', 0, OLD.id::text, to_jsonb(OLD), NULL);
  END IF;

  RETURN NULL;
END;
$$;

-- ── 3. Drop indexes and physical no column ───────────────────────────────────
drop index if exists public.product_overrides_legacy_no_key;
drop index if exists public.product_overrides_no_key;

ALTER TABLE public.product_overrides
  DROP COLUMN IF EXISTS no;

COMMIT;

-- ── 4. Validation queries ────────────────────────────────────────────────────
/*
-- Confirm backup table exists and has rows:
select count(*) from public.product_overrides_legacy_no_backup;

-- Confirm no is gone from product_overrides:
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'product_overrides'
order by ordinal_position;
-- Expected: no column named "no"

-- Confirm RPC still works:
select count(*) from public.search_products_catalog(null, null, 'desembre', 1, 20);
select * from public.search_products_catalog(null, null, 'desembre', 1, 20) where id is null;
-- Expected: count > 0, null-id = 0 rows
*/
