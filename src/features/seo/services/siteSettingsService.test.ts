import { describe, it, expect } from 'vitest';
import { mapSiteSettings, type SiteSettingsRow } from './siteSettingsService';

describe('siteSettingsService', () => {
  describe('mapSiteSettings', () => {
    it('maps database snake_case fields to camelCase SiteSettings', () => {
      const row: SiteSettingsRow = {
        id: 'site',
        site_name: 'Test Site',
        favicon_url: 'https://example.com/favicon.ico',
        apple_touch_icon_url: 'https://example.com/apple.png',
        web_app_icon_192_url: null,
        web_app_icon_512_url: null,
        default_og_image_url: 'https://example.com/og.jpg',
        header_logo_desembre_url: 'https://example.com/desembre.png',
        header_logo_hyunjin_url: 'https://example.com/hyunjin.png',
        header_logo_dermagarden_url: 'https://example.com/dermagarden.png',
      };

      const result = mapSiteSettings(row);

      expect(result).toEqual({
        id: 'site',
        siteName: 'Test Site',
        faviconUrl: 'https://example.com/favicon.ico',
        appleTouchIconUrl: 'https://example.com/apple.png',
        webAppIcon192Url: null,
        webAppIcon512Url: null,
        defaultOgImageUrl: 'https://example.com/og.jpg',
        headerLogoDesembreUrl: 'https://example.com/desembre.png',
        headerLogoHyunjinUrl: 'https://example.com/hyunjin.png',
        headerLogoDermagardenUrl: 'https://example.com/dermagarden.png',
        homeBrandDesembreImageUrl: undefined,
        homeBrandDermagardenImageUrl: undefined,
        homeHeroBannerImageUrl: undefined,
        homeHeroBannerMobileImageUrl: undefined,
        catalogDesembreBannerImageUrl: undefined,
        catalogDesembreBannerMobileImageUrl: undefined,
        catalogDermagardenBannerImageUrl: undefined,
        catalogDermagardenBannerMobileImageUrl: undefined,
        homeProductGalleryImages: [],
      });
    });

    it('handles undefined or null header logos', () => {
      const row: SiteSettingsRow = {
        id: 'site',
        site_name: 'Test Site',
        favicon_url: null,
        apple_touch_icon_url: null,
        web_app_icon_192_url: null,
        web_app_icon_512_url: null,
        default_og_image_url: null,
        header_logo_desembre_url: null,
      };

      const result = mapSiteSettings(row);

      expect(result.headerLogoDesembreUrl).toBeNull();
      expect(result.headerLogoHyunjinUrl).toBeUndefined();
      expect(result.headerLogoDermagardenUrl).toBeUndefined();
    });
  });
});
