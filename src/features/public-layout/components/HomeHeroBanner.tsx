import { Link } from "react-router-dom";
import { useSiteSettings } from "@/features/seo/components/SiteSettingsProvider";

export function HomeHeroBanner() {
  const { settings } = useSiteSettings();
  const heroImageUrl = "/images/home-hero-banner.jpg";

  return (
    <section className="relative w-full min-h-[720px] md:min-h-[760px] lg:min-h-[820px] bg-muted/30 overflow-hidden isolate py-16 flex items-center">
      {/* Background Image with Fallback Gradient */}
      <div 
        className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${heroImageUrl})`,
          backgroundColor: 'hsl(var(--muted))'
        }}
        aria-hidden="true"
      />
      
      {/* Strong Overlay for Text Readability */}
      <div className="absolute inset-0 -z-10 bg-background/80 md:bg-gradient-to-r md:from-background/95 md:via-background/70 md:to-background/90 backdrop-blur-[2px]" />

      <div className="container mx-auto px-4 sm:px-6 h-full flex flex-col justify-center items-center mt-8">
        <div className="w-full mx-auto text-center animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both flex flex-col items-center">
          <p className="inline-flex items-center px-4 py-1.5 mb-6 md:mb-8 rounded-full bg-muted/60 border border-border/50 text-foreground text-xs font-bold tracking-[0.18em] uppercase backdrop-blur-md shadow-sm">
            Tập đoàn HYUNJIN C&T
          </p>
          
          <div className="max-w-[1180px] mx-auto w-full">
            <h1 className="elegant-title text-[clamp(38px,8vw,48px)] lg:text-[clamp(48px,4.4vw,72px)] lg:leading-[1.08] lg:whitespace-nowrap font-bold text-foreground tracking-tight mb-6 sm:mb-8">
              Danh sách công bố sản phẩm
            </h1>
          </div>
          
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-10 max-w-[720px] mx-auto drop-shadow-sm px-2">
            Cập nhật chính xác liên tục các công bố sản phẩm Desembre và Dermagarden đang được phép lưu hành tại Việt Nam
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-[960px] lg:max-w-[1040px] mt-2">
            {/* DESEMBRE CARD */}
            <Link 
              to="/desembre"
              className="group relative flex flex-col text-left rounded-[28px] bg-background/80 backdrop-blur-md border border-border/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 w-full h-[260px] sm:h-[320px] lg:h-[360px]"
            >
              <div className="p-6 md:p-8 flex flex-col z-20">
                <h3 className="text-2xl md:text-3xl font-black tracking-tight text-foreground mb-1 group-hover:text-primary transition-colors flex items-center justify-between w-full">
                  DESEMBRE
                </h3>
                <p className="text-sm font-semibold text-foreground/80 mb-4">
                  Thương hiệu thẩm mỹ chuyên nghiệp
                </p>
                
                <div className="flex items-center gap-2 text-sm font-bold text-primary transition-all">
                  Xem danh mục <span className="group-hover:translate-x-1.5 transition-transform duration-300">&rarr;</span>
                </div>
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 h-[150px] sm:h-[180px] lg:h-[220px] overflow-hidden flex items-end justify-center">
                <div className="absolute inset-0 bg-gradient-to-b from-background via-background/40 to-transparent z-10" />
                <div className="absolute inset-0 bg-orange-100/20 dark:bg-orange-950/10" />
                {settings?.homeBrandDesembreImageUrl && (
                  <img 
                    src={settings.homeBrandDesembreImageUrl} 
                    alt="Desembre" 
                    className="w-full h-[90%] object-contain object-bottom group-hover:scale-[1.03] transition-transform duration-700 opacity-95" 
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
              </div>
            </Link>

            {/* DERMAGARDEN CARD */}
            <Link 
              to="/dermagarden"
              className="group relative flex flex-col text-left rounded-[28px] bg-background/80 backdrop-blur-md border border-border/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 w-full h-[260px] sm:h-[320px] lg:h-[360px]"
            >
              <div className="p-6 md:p-8 flex flex-col z-20">
                <h3 className="text-2xl md:text-3xl font-black tracking-tight text-foreground mb-1 group-hover:text-primary transition-colors flex items-center justify-between w-full">
                  DERMAGARDEN
                </h3>
                <p className="text-sm font-semibold text-foreground/80 mb-4">
                  Thương hiệu chăm sóc da chuyên sâu
                </p>
                
                <div className="flex items-center gap-2 text-sm font-bold text-primary transition-all">
                  Xem danh mục <span className="group-hover:translate-x-1.5 transition-transform duration-300">&rarr;</span>
                </div>
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 h-[150px] sm:h-[180px] lg:h-[220px] overflow-hidden flex items-end justify-center">
                <div className="absolute inset-0 bg-gradient-to-b from-background via-background/40 to-transparent z-10" />
                <div className="absolute inset-0 bg-emerald-100/20 dark:bg-emerald-950/10" />
                {settings?.homeBrandDermagardenImageUrl && (
                  <img 
                    src={settings.homeBrandDermagardenImageUrl} 
                    alt="Dermagarden" 
                    className="w-full h-[90%] object-contain object-bottom group-hover:scale-[1.03] transition-transform duration-700 opacity-95" 
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
