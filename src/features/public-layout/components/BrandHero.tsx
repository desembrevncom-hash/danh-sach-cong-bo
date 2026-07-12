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

  const style = {
    '--hero-bg-desktop': desktopBg ? `url('${desktopBg}')` : 'none',
    '--hero-bg-mobile': mobileBg ? `url('${mobileBg}')` : 'none',
  } as React.CSSProperties;

  return (
    <div 
      style={style}
      className={`relative w-full overflow-hidden border-b border-border transition-colors duration-700 ${theme.backgroundClass} min-h-[520px] bg-[image:var(--hero-bg-mobile)] md:bg-[image:var(--hero-bg-desktop)] bg-cover bg-center md:bg-right`}
    >
      {/* Overlay gradient for text readability */}
      <div className="absolute inset-0 bg-background/85 md:bg-gradient-to-r md:from-background/95 md:via-background/82 md:to-background/45 z-0" />
      
      <div className="container mx-auto px-6 py-16 md:py-24 relative z-10 flex h-full">
        <div className="max-w-3xl flex flex-col items-start text-left animate-in fade-in slide-in-from-bottom-4 duration-700 justify-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground font-semibold mb-4">
            {theme.eyebrow}
          </p>
          
          <h1 className="elegant-title text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight mb-6">
            {theme.title}
          </h1>
          
          <div className={`h-1.5 w-16 mb-6 rounded-full ${theme.accentColor}`} />
          
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-10 max-w-2xl">
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
              className="group flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg p-2 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-card/50 shadow-sm transition-all group-hover:border-border group-hover:bg-card">
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
