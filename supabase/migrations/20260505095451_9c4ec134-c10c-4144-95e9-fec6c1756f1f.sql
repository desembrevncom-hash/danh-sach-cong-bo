
ALTER TABLE public.product_overrides
  ADD COLUMN IF NOT EXISTS section text,
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS "desc" text,
  ADD COLUMN IF NOT EXISTS deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_custom boolean NOT NULL DEFAULT false;
