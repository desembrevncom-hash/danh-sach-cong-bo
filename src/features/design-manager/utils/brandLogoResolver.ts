import { SiteSettings } from "@/features/seo/services/siteSettingsService";
import { BrandId } from "@/config/brands";

export type SupportedBrandKey = BrandId | "hyunjin";

export const BRAND_TEXT_LABELS: Record<SupportedBrandKey, string> = {
  desembre: "DESEMBRE",
  hyunjin: "HYUNJIN",
  dermagarden: "DERMAGARDEN",
};

/**
 * Resolves the logo URL from SiteSettings.
 * If the database setting is empty or null, it returns null
 * to enforce the text fallback, avoiding broken default image links.
 */
export function resolveBrandLogoUrl(settings: SiteSettings | null | undefined, brand: SupportedBrandKey): string | null {
  if (!settings) return null;

  let url: string | null | undefined = null;
  switch (brand) {
    case "desembre":
      url = settings.headerLogoDesembreUrl;
      break;
    case "hyunjin":
      url = settings.headerLogoHyunjinUrl;
      break;
    case "dermagarden":
      url = settings.headerLogoDermagardenUrl;
      break;
  }

  // If the url is empty string or null, return null so it falls back to text.
  if (!url || url.trim() === "") {
    return null;
  }

  return url;
}
