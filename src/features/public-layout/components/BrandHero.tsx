import { Link } from "react-router-dom";
import { BrandId, BRAND_THEMES } from "@/config/brands";
import { ArrowRight } from "lucide-react";

interface BrandHeroProps {
  brandId: BrandId;
  totalCount?: number | null;
}

export function BrandHero({ brandId, totalCount }: BrandHeroProps) {
  const theme = BRAND_THEMES[brandId];
  if (!theme) return null;

  const otherTheme = BRAND_THEMES[theme.otherBrandId];

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

          <div className="flex items-center gap-4">
            {otherTheme && (
              <Link 
                to={`/${otherTheme.id}`}
                className="group flex items-center gap-2 px-6 py-3 rounded-full bg-card hover:bg-muted border border-border shadow-sm transition-all duration-300 hover:shadow text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Khám phá {otherTheme.name}
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-foreground transition-transform" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
