import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { BRAND_THEMES } from "@/config/brands";

export function HomeBrandCards() {
  const desembreTheme = BRAND_THEMES["desembre"];
  const dermagardenTheme = BRAND_THEMES["dermagarden"];

  // TODO: Add public/images/desembre-card.jpg
  // TODO: Add public/images/dermagarden-card.jpg
  const desembreImage = "/images/desembre-card.jpg";
  const dermagardenImage = "/images/dermagarden-card.jpg";

  return (
    <section className="py-12 md:py-[72px] bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">Danh mục thương hiệu</h2>
          <div className="w-12 h-1 bg-primary mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* DESEMBRE CARD */}
          <Link 
            to="/desembre"
            className="group relative flex flex-col bg-card rounded-3xl border border-border/50 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden isolate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="Xem danh mục Desembre"
          >
            {/* Image Area */}
            <div className={`relative w-full h-[240px] md:h-[320px] overflow-hidden ${desembreTheme.backgroundClass}`}>
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.03]"
                style={{ 
                  backgroundImage: `url(${desembreImage})`,
                }}
              />
              {/* Fallback gradient if no image */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60" />
              
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="text-3xl md:text-4xl font-black tracking-tighter text-white drop-shadow-md">
                  DESEMBRE
                </h3>
              </div>
            </div>
            
            {/* Content Area */}
            <div className="p-8 md:p-10 flex flex-col flex-1">
              <h4 className="text-lg font-bold text-foreground mb-3">
                Thương hiệu thẩm mỹ chuyên nghiệp
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8 flex-1">
                Dòng sản phẩm chăm sóc da chuyên nghiệp, được quản lý trong hệ thống tra cứu công bố sản phẩm.
              </p>
              
              <div className="flex items-center gap-2 text-sm font-semibold text-primary mt-auto">
                Xem thêm <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* DERMAGARDEN CARD */}
          <Link 
            to="/dermagarden"
            className="group relative flex flex-col bg-card rounded-3xl border border-border/50 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden isolate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="Xem danh mục Dermagarden"
          >
            {/* Image Area */}
            <div className={`relative w-full h-[240px] md:h-[320px] overflow-hidden ${dermagardenTheme.backgroundClass}`}>
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.03]"
                style={{ 
                  backgroundImage: `url(${dermagardenImage})`,
                }}
              />
              {/* Fallback gradient if no image */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60" />
              
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="text-3xl md:text-4xl font-black tracking-tighter text-white drop-shadow-md">
                  DERMAGARDEN
                </h3>
              </div>
            </div>
            
            {/* Content Area */}
            <div className="p-8 md:p-10 flex flex-col flex-1">
              <h4 className="text-lg font-bold text-foreground mb-3">
                Thương hiệu chăm sóc da chuyên sâu
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8 flex-1">
                Danh mục sản phẩm Dermagarden được cập nhật theo trạng thái công bố và quản lý hiển thị.
              </p>
              
              <div className="flex items-center gap-2 text-sm font-semibold text-primary mt-auto">
                Xem thêm <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
