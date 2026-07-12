import { supabase } from '@/integrations/supabase/client';

export type GalleryImage = {
  id: string;
  url: string;
  alt: string;
  brand: 'desembre' | 'dermagarden' | 'chung';
  caption: string;
  isActive: boolean;
};

export type SiteSettings = {
  id: string;
  siteName: string;
  faviconUrl: string | null;
  appleTouchIconUrl: string | null;
  webAppIcon192Url: string | null;
  webAppIcon512Url: string | null;
  defaultOgImageUrl: string | null;
  headerLogoDesembreUrl?: string | null;
  headerLogoHyunjinUrl?: string | null;
  headerLogoDermagardenUrl?: string | null;
  homeBrandDesembreImageUrl?: string | null;
  homeBrandDermagardenImageUrl?: string | null;
  homeHeroBannerImageUrl?: string | null;
  homeHeroBannerMobileImageUrl?: string | null;
  catalogDesembreBannerImageUrl?: string | null;
  catalogDesembreBannerMobileImageUrl?: string | null;
  catalogDermagardenBannerImageUrl?: string | null;
  catalogDermagardenBannerMobileImageUrl?: string | null;
  homeProductGalleryImages?: GalleryImage[];
};

export type SiteSettingsRow = {
  id: string;
  site_name: string;
  favicon_url: string | null;
  apple_touch_icon_url: string | null;
  web_app_icon_192_url: string | null;
  web_app_icon_512_url: string | null;
  default_og_image_url: string | null;
  header_logo_desembre_url?: string | null;
  header_logo_hyunjin_url?: string | null;
  header_logo_dermagarden_url?: string | null;
  home_brand_desembre_image_url?: string | null;
  home_brand_dermagarden_image_url?: string | null;
  home_hero_banner_image_url?: string | null;
  home_hero_banner_mobile_image_url?: string | null;
  catalog_desembre_banner_image_url?: string | null;
  catalog_desembre_banner_mobile_image_url?: string | null;
  catalog_dermagarden_banner_image_url?: string | null;
  catalog_dermagarden_banner_mobile_image_url?: string | null;
  home_product_gallery_images?: any;
};

// Map DB snake_case to camelCase
export function mapSiteSettings(row: SiteSettingsRow): SiteSettings {
  return {
    id: row.id,
    siteName: row.site_name,
    faviconUrl: row.favicon_url,
    appleTouchIconUrl: row.apple_touch_icon_url,
    webAppIcon192Url: row.web_app_icon_192_url,
    webAppIcon512Url: row.web_app_icon_512_url,
    defaultOgImageUrl: row.default_og_image_url,
    headerLogoDesembreUrl: row.header_logo_desembre_url,
    headerLogoHyunjinUrl: row.header_logo_hyunjin_url,
    headerLogoDermagardenUrl: row.header_logo_dermagarden_url,
    homeBrandDesembreImageUrl: row.home_brand_desembre_image_url,
    homeBrandDermagardenImageUrl: row.home_brand_dermagarden_image_url,
    homeHeroBannerImageUrl: row.home_hero_banner_image_url,
    homeHeroBannerMobileImageUrl: row.home_hero_banner_mobile_image_url,
    catalogDesembreBannerImageUrl: row.catalog_desembre_banner_image_url,
    catalogDesembreBannerMobileImageUrl: row.catalog_desembre_banner_mobile_image_url,
    catalogDermagardenBannerImageUrl: row.catalog_dermagarden_banner_image_url,
    catalogDermagardenBannerMobileImageUrl: row.catalog_dermagarden_banner_mobile_image_url,
    homeProductGalleryImages: Array.isArray(row.home_product_gallery_images) ? row.home_product_gallery_images : [],
  };
}

export async function fetchSiteSettings(): Promise<{ ok: boolean; data?: SiteSettings; error?: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/site_settings?id=eq.site&select=*`;
    const res = await fetch(url, {
      headers: {
        "apikey": anonKey,
        "Authorization": `Bearer ${token || anonKey}`,
      },
      cache: "no-store"
    });

    if (!res.ok) {
      return { ok: false, error: `Failed to fetch site settings: ${res.statusText}` };
    }

    const data = await res.json();
    if (!data || data.length === 0) {
      // Not found, return a default placeholder
      return { ok: true, data: mapSiteSettings({ 
        id: 'site', 
        site_name: 'Hệ thống tra cứu công bố sản phẩm',
        favicon_url: null,
        apple_touch_icon_url: null,
        web_app_icon_192_url: null,
        web_app_icon_512_url: null,
        default_og_image_url: null,
        header_logo_desembre_url: null,
        header_logo_hyunjin_url: null,
        header_logo_dermagarden_url: null,
        home_brand_desembre_image_url: null,
        home_brand_dermagarden_image_url: null,
        home_hero_banner_image_url: null,
        home_hero_banner_mobile_image_url: null,
        catalog_desembre_banner_image_url: null,
        catalog_desembre_banner_mobile_image_url: null,
        catalog_dermagarden_banner_image_url: null,
        catalog_dermagarden_banner_mobile_image_url: null,
        home_product_gallery_images: []
      }) };
    }

    return { ok: true, data: mapSiteSettings(data[0] as unknown as SiteSettingsRow) };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function updateSiteSettings(payload: Partial<SiteSettings>): Promise<{ ok: boolean; error?: string }> {
  try {
    const updateData: Record<string, unknown> = {};
    
    if (payload.siteName !== undefined) updateData.site_name = payload.siteName;
    if (payload.faviconUrl !== undefined) updateData.favicon_url = payload.faviconUrl;
    if (payload.appleTouchIconUrl !== undefined) updateData.apple_touch_icon_url = payload.appleTouchIconUrl;
    if (payload.webAppIcon192Url !== undefined) updateData.web_app_icon_192_url = payload.webAppIcon192Url;
    if (payload.webAppIcon512Url !== undefined) updateData.web_app_icon_512_url = payload.webAppIcon512Url;
    if (payload.defaultOgImageUrl !== undefined) updateData.default_og_image_url = payload.defaultOgImageUrl;
    
    if (payload.headerLogoDesembreUrl !== undefined) updateData.header_logo_desembre_url = payload.headerLogoDesembreUrl;
    if (payload.headerLogoHyunjinUrl !== undefined) updateData.header_logo_hyunjin_url = payload.headerLogoHyunjinUrl;
    if (payload.headerLogoDermagardenUrl !== undefined) updateData.header_logo_dermagarden_url = payload.headerLogoDermagardenUrl;

    if (payload.homeBrandDesembreImageUrl !== undefined) updateData.home_brand_desembre_image_url = payload.homeBrandDesembreImageUrl;
    if (payload.homeBrandDermagardenImageUrl !== undefined) updateData.home_brand_dermagarden_image_url = payload.homeBrandDermagardenImageUrl;
    
    if (payload.homeHeroBannerImageUrl !== undefined) updateData.home_hero_banner_image_url = payload.homeHeroBannerImageUrl;
    if (payload.homeHeroBannerMobileImageUrl !== undefined) updateData.home_hero_banner_mobile_image_url = payload.homeHeroBannerMobileImageUrl;
    
    if (payload.catalogDesembreBannerImageUrl !== undefined) updateData.catalog_desembre_banner_image_url = payload.catalogDesembreBannerImageUrl;
    if (payload.catalogDesembreBannerMobileImageUrl !== undefined) updateData.catalog_desembre_banner_mobile_image_url = payload.catalogDesembreBannerMobileImageUrl;
    if (payload.catalogDermagardenBannerImageUrl !== undefined) updateData.catalog_dermagarden_banner_image_url = payload.catalogDermagardenBannerImageUrl;
    if (payload.catalogDermagardenBannerMobileImageUrl !== undefined) updateData.catalog_dermagarden_banner_mobile_image_url = payload.catalogDermagardenBannerMobileImageUrl;
    if (payload.homeProductGalleryImages !== undefined) updateData.home_product_gallery_images = payload.homeProductGalleryImages;
    
    // ensure updated_at is refreshed via trigger or implicitly, or explicitly set it
    updateData.updated_at = new Date().toISOString();

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    
    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/site_settings?id=eq.site`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Authorization": `Bearer ${token || ''}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(updateData),
      cache: "no-store"
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return { ok: false, error: `Failed to update site settings: ${errText}` };
    }

    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
