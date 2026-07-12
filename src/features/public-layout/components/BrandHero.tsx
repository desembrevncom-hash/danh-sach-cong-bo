import { BrandId, BRAND_THEMES } from "@/config/brands";
import { ArrowDown } from "lucide-react";
import { useSiteSettings } from "@/features/seo/components/SiteSettingsProvider";

interface BrandHeroProps {
  brandId: BrandId;
  totalCount?: number | null;
}

export function BrandHero({ brandId, totalCount }: BrandHeroProps) {
  const theme = BRAND_THEMES[brandId];
  const { settings } = useSiteSettings();

  if (!theme) return null;

  // Fallback logic for Desktop
  const desktopBg = brandId === 'desembre'
    ? (settings?.catalogDesembreBannerImageUrl || settings?.homeBrandDesembreImageUrl || settings?.homeHeroBannerImageUrl)
    : (settings?.catalogDermagardenBannerImageUrl || settings?.homeBrandDermagardenImageUrl || settings?.homeHeroBannerImageUrl);

  // Fallback logic for Mobile
  const mobileBg = brandId === 'desembre'
    ? (settings?.catalogDesembreBannerMobileImageUrl || settings?.catalogDesembreBannerImageUrl || settings?.homeBrandDesembreImageUrl || settings?.homeHeroBannerMobileImageUrl || settings?.homeHeroBannerImageUrl)
    : (settings?.catalogDermagardenBannerMobileImageUrl || settings?.catalogDermagardenBannerImageUrl || settings?.homeBrandDermagardenImageUrl || settings?.homeHeroBannerMobileImageUrl || settings?.homeHeroBannerImageUrl);

  return (
    <div 
      className={`relative w-full overflow-hidden border-b border-border transition-colors duration-700 ${theme.backgroundClass} min-h-[420px] md:min-h-[520px]`}
    >
      {/* Mobile Background */}
      {mobileBg && (
        <div 
          className="absolute inset-0 bg-cover bg-center md:hidden z-0"
          style={{ backgroundImage: `url('${mobileBg}')` }}
        />
      )}
      
      {/* Desktop Background */}
      {desktopBg && (
        <div 
          className="absolute inset-0 bg-cover bg-right hidden md:block z-0"
          style={{ backgroundImage: `url('${desktopBg}')` }}
        />
      )}

      {/* Overlay gradient for text readability - Lighter on right to reveal image */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/30 md:from-background/95 md:via-background/60 md:to-background/20 z-0" />
      
      <div className="container mx-auto px-6 pt-20 pb-12 md:py-24 relative z-10 flex h-full">
        <div className="max-w-3xl flex flex-col items-start text-left animate-in fade-in slide-in-from-bottom-4 duration-700 justify-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground font-semibold mb-3 md:mb-4 drop-shadow-sm">
            {theme.eyebrow}
          </p>
          
          <h1 className="elegant-title text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight mb-4 md:mb-6 drop-shadow-sm">
            {theme.title}
          </h1>
          
          <div className={`h-1.5 w-16 mb-4 md:mb-6 rounded-full ${theme.accentColor}`} />
          
          <p className="text-sm md:text-lg text-foreground/90 md:text-muted-foreground leading-relaxed mb-6 md:mb-10 max-w-2xl drop-shadow-md md:drop-shadow-none">
            {totalCount === null 
              ? `Đang cập nhật số lượng công bố sản phẩm thương hiệu ${theme.name}. Xin mời tra cứu.`
              : totalCount < 0
              ? `Thông tin công bố sản phẩm thương hiệu ${theme.name} đang được cập nhật. Xin mời tra cứu.`
              : `Hiện tại đang có tổng số ${totalCount} công bố sản phẩm thương hiệu ${theme.name} trên hệ thống. Xin mời tra cứu.`}
          </p>

          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => {
                document.getElementById("catalog-search")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              aria-label={`Cuộn xuống tra cứu sản phẩm ${theme.name}`}
              className="group flex flex-col items-center gap-2 text-foreground/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg p-2 transition-colors drop-shadow-sm md:drop-shadow-none"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-background/80 shadow-sm transition-all group-hover:border-border group-hover:bg-background">
                <ArrowDown className="h-4 w-4 text-accent-foreground animate-scroll-bounce" />
              </div>
              <span className="text-xs font-medium tracking-wide">Cuộn xuống tra cứu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
