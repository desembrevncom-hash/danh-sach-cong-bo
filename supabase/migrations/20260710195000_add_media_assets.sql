-- Migration: Add media_assets table and site-assets bucket for Round 10C
-- Features: Media Library

CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket text NOT NULL DEFAULT 'site-assets',
  path text NOT NULL,
  public_url text NOT NULL,
  asset_type text NOT NULL CHECK (asset_type IN ('favicon', 'apple_touch_icon', 'web_app_icon', 'og_image', 'brand_logo', 'product_image', 'misc')),
  file_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  width integer,
  height integer,
  alt_text text,
  brand text,
  used_for text,
  created_by uuid,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(bucket, path)
);

-- RLS Policies for media_assets
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- Public can read active media
CREATE POLICY "Public can read active media"
ON public.media_assets
FOR SELECT
USING (deleted_at IS NULL);

-- Admins can manage everything
CREATE POLICY "Admins can manage media_assets"
ON public.media_assets
FOR ALL
USING (public.is_admin());

-- Supabase Storage: site-assets bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-assets', 
  'site-assets', 
  true, 
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/x-icon']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
-- Enable RLS on objects if not already
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Public Read for site-assets
CREATE POLICY "Public Read for site-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-assets');

-- Admin Insert for site-assets
CREATE POLICY "Admin Insert for site-assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'site-assets' AND public.is_admin());

-- Admin Update for site-assets
CREATE POLICY "Admin Update for site-assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'site-assets' AND public.is_admin());

-- Admin Delete for site-assets
CREATE POLICY "Admin Delete for site-assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'site-assets' AND public.is_admin());
