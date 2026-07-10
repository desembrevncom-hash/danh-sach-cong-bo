import { supabase } from '@/integrations/supabase/client';

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
  };
}

export async function fetchSiteSettings(): Promise<{ ok: boolean; data?: SiteSettings; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 'site')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
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
          header_logo_dermagarden_url: null
        }) };
      }
      return { ok: false, error: error.message };
    }

    return { ok: true, data: mapSiteSettings(data as unknown as SiteSettingsRow) };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function updateSiteSettings(payload: Partial<SiteSettings>): Promise<{ ok: boolean; error?: string }> {
  const updateData: Record<string, unknown> = {};
  
  if (payload.siteName !== undefined) updateData.site_name = payload.siteName;
  if (payload.faviconUrl !== undefined) updateData.favicon_url = payload.faviconUrl;
  if (payload.appleTouchIconUrl !== undefined) updateData.apple_touch_icon_url = payload.appleTouchIconUrl;
  if (payload.webAppIcon192Url !== undefined) updateData.web_app_icon_192_url = payload.webAppIcon192Url;
  if (payload.webAppIcon512Url !== undefined) updateData.web_app_icon_512_url = payload.webAppIcon512Url;
  if (payload.defaultOgImageUrl !== undefined) updateData.default_og_image_url = payload.defaultOgImageUrl;
  
  // ensure updated_at is refreshed via trigger or implicitly, or explicitly set it
  updateData.updated_at = new Date().toISOString();

  try {
    const { error } = await supabase
      .from('site_settings')
      .update(updateData)
      .eq('id', 'site');

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
