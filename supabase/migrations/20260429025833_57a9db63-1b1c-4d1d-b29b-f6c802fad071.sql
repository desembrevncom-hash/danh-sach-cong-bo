-- Table to store per-product image and link overrides
CREATE TABLE public.product_overrides (
  no INTEGER PRIMARY KEY,
  image_url TEXT,
  link_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_overrides ENABLE ROW LEVEL SECURITY;

-- Public read for everyone (catalog is public)
CREATE POLICY "Public can read product overrides"
ON public.product_overrides
FOR SELECT
USING (true);

-- No public write — writes go through the edge function using the service role key
-- (no INSERT/UPDATE/DELETE policies => denied for anon/auth roles)

-- Storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read on the bucket
CREATE POLICY "Public can view product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

-- Uploads happen server-side via edge function with service role, so no insert policy needed
