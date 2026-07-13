-- Migration: Add sort_order column to product_overrides and create optimized index
ALTER TABLE public.product_overrides
ADD COLUMN IF NOT EXISTS sort_order INTEGER;

CREATE INDEX IF NOT EXISTS idx_product_overrides_section_sort_order
ON public.product_overrides(section, sort_order);
