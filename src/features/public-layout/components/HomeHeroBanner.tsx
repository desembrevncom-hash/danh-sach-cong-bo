import { Link } from "react-router-dom";
import { useSiteSettings } from "@/features/seo/components/SiteSettingsProvider";

export function HomeHeroBanner() {
  const { settings } = useSiteSettings();
  const fallbackBanner = "/images/home-hero-banner.jpg";
  const desktopBanner = settings?.homeHeroBannerImageUrl || fallbackBanner;
  const mobileBanner = settings?.homeHeroBannerMobileImageUrl || desktopBanner;

  return (
    <section className="relative w-full min-h-[720px] md:min-h-[760px] lg:min-h-[820px] bg-muted/30 overflow-hidden isolate py-16 flex items-center">
      {/* Desktop Background Image */}
      <div 
        className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat hidden md:block"
        style={{ 
          backgroundImage: `url(${desktopBanner})`,
          backgroundColor: 'hsl(var(--muted))'
        }}
        aria-hidden="true"
      />
      
      {/* Mobile Background Image */}
      <div 
        className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat block md:hidden"
        style={{ 
          backgroundImage: `url(${mobileBanner})`,
          backgroundColor: 'hsl(var(--muted))'
        }}
        aria-hidden="true"
      />
      
      {/* Strong Overlay for Text Readability */}
      <div className="absolute inset-0 -z-10 bg-background/60 md:bg-gradient-to-r md:from-background/75 md:via-background/50 md:to-background/70 backdrop-blur-[2px]" />

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
              className="group flex flex-col text-left rounded-3xl bg-background/85 backdrop-blur-md border border-border/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 w-full h-[320px] sm:h-[360px] lg:h-[400px]"
            >
              {/* IMAGE AREA */}
              <div className="relative w-full flex-[1.7] bg-gradient-to-t from-[#e9eee6] to-[#f7f2e8] flex items-end justify-center overflow-hidden">
                {settings?.homeBrandDesembreImageUrl ? (
                  <img 
                    src={settings.homeBrandDesembreImageUrl} 
                    alt="Desembre" 
                    className="w-full max-w-[90%] h-[90%] object-contain object-bottom group-hover:scale-[1.03] transition-transform duration-700" 
                    onError={(e) => { 
                      e.currentTarget.style.display = 'none'; 
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-t from-orange-100/50 to-orange-50/20" />
                )}
              </div>

              {/* CONTENT AREA */}
              <div className="flex-1 flex flex-col justify-center p-5 md:p-7 bg-background">
                <h3 className="text-2xl lg:text-[32px] font-black tracking-tight text-foreground mb-1 group-hover:text-primary transition-colors leading-none">
                  DESEMBRE
                </h3>
                <p className="text-sm md:text-base font-medium text-muted-foreground truncate">
                  Thương hiệu thẩm mỹ chuyên nghiệp
                </p>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-primary transition-all mt-3 md:mt-4">
                  Tra cứu ngay <span className="group-hover:translate-x-1.5 transition-transform duration-300">&rarr;</span>
                </div>
              </div>
            </Link>

            {/* DERMAGARDEN CARD */}
            <Link 
              to="/dermagarden"
              className="group flex flex-col text-left rounded-3xl bg-background/85 backdrop-blur-md border border-border/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 w-full h-[320px] sm:h-[360px] lg:h-[400px]"
            >
              {/* IMAGE AREA */}
              <div className="relative w-full flex-[1.7] bg-gradient-to-t from-[#e4f6ee] to-[#eef8f4] flex items-end justify-center overflow-hidden">
                {settings?.homeBrandDermagardenImageUrl ? (
                  <img 
                    src={settings.homeBrandDermagardenImageUrl} 
                    alt="Dermagarden" 
                    className="w-full max-w-[90%] h-[90%] object-contain object-bottom group-hover:scale-[1.03] transition-transform duration-700" 
                    onError={(e) => { 
                      e.currentTarget.style.display = 'none'; 
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-100/50 to-emerald-50/20" />
                )}
              </div>

              {/* CONTENT AREA */}
              <div className="flex-1 flex flex-col justify-center p-5 md:p-7 bg-background">
                <h3 className="text-2xl lg:text-[32px] font-black tracking-tight text-foreground mb-1 group-hover:text-primary transition-colors leading-none">
                  DERMAGARDEN
                </h3>
                <p className="text-sm md:text-base font-medium text-muted-foreground truncate">
                  Thương hiệu chăm sóc da chuyên sâu
                </p>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-primary transition-all mt-3 md:mt-4">
                  Tra cứu ngay <span className="group-hover:translate-x-1.5 transition-transform duration-300">&rarr;</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
