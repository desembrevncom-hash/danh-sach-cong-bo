-- Migration: Add site_settings table for Favicon & Brand Asset Manager
-- Features: Manage site-wide configurations like favicons, web app icons, default og image

CREATE TABLE IF NOT EXISTS public.site_settings (
  id text PRIMARY KEY DEFAULT 'site',
  site_name text NOT NULL DEFAULT 'Hệ thống tra cứu công bố sản phẩm',
  favicon_url text,
  apple_touch_icon_url text,
  web_app_icon_192_url text,
  web_app_icon_512_url text,
  default_og_image_url text,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ensure_single_row CHECK (id = 'site')
);

-- RLS Policies
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Public can read site_settings
CREATE POLICY "Public can read site_settings"
ON public.site_settings
FOR SELECT
USING (true);

-- Admins can do everything
CREATE POLICY "Admins can manage site_settings"
ON public.site_settings
FOR ALL
USING (public.is_admin());

-- Insert default seed row
INSERT INTO public.site_settings (id, site_name)
VALUES ('site', 'Hệ thống tra cứu công bố sản phẩm')
ON CONFLICT (id) DO NOTHING;
