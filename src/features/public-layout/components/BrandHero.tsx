import { BrandId, BRAND_THEMES } from "@/config/brands";
import { ArrowDown } from "lucide-react";

interface BrandHeroProps {
  brandId: BrandId;
  totalCount?: number | null;
}

export function BrandHero({ brandId, totalCount }: BrandHeroProps) {
  const theme = BRAND_THEMES[brandId];
  if (!theme) return null;

  return (
    <div className={`relative w-full overflow-hidden border-b border-border transition-colors duration-700 ${theme.backgroundClass}`}>
      <div className="container mx-auto px-6 py-16 md:py-24 relative z-10">
        <div className="max-w-3xl flex flex-col items-start text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
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
