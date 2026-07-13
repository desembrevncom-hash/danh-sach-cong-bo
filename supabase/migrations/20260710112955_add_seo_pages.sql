-- Migration: Add seo_pages table for Admin SEO Manager
-- Features: Manage meta tags, canonical, og tags, robots, schema.json per route

CREATE TABLE IF NOT EXISTS public.seo_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_path text NOT NULL UNIQUE,
  page_key text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  canonical_url text,
  og_title text,
  og_description text,
  og_image_url text,
  robots text NOT NULL DEFAULT 'index,follow',
  schema_json jsonb,
  is_active boolean NOT NULL DEFAULT true,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;

-- Public can read active SEO pages
CREATE POLICY "Public can read active seo_pages"
ON public.seo_pages
FOR SELECT
USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins can manage seo_pages"
ON public.seo_pages
FOR ALL
USING (public.is_admin());

-- Insert default seed rows
INSERT INTO public.seo_pages (route_path, page_key, title, description, canonical_url)
VALUES
  (
    '/',
    'home',
    'Hệ thống tra cứu công bố sản phẩm | HJCNT',
    'Tra cứu danh sách công bố sản phẩm Desembre và Dermagarden đang lưu hành tại Việt Nam.',
    'https://cong-bo.hjcnt.com.vn/'
  ),
  (
    '/desembre',
    'desembre',
    'Danh sách công bố sản phẩm Desembre 2026',
    'Tra cứu danh sách công bố sản phẩm Desembre, thông tin nhóm sản phẩm, hình ảnh và link công bố.',
    'https://cong-bo.hjcnt.com.vn/desembre'
  ),
  (
    '/dermagarden',
    'dermagarden',
    'Danh sách công bố sản phẩm Dermagarden 2026',
    'Tra cứu danh sách công bố sản phẩm Dermagarden, thông tin nhóm sản phẩm, hình ảnh và link công bố.',
    'https://cong-bo.hjcnt.com.vn/dermagarden'
  )
ON CONFLICT (route_path) DO NOTHING;
