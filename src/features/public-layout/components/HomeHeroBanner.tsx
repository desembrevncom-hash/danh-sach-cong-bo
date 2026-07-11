import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSiteSettings } from "@/features/seo/components/SiteSettingsProvider";

// Image tray with rounded clipping, brand gradient, and error fallback
function BrandImageTray({
  src,
  alt,
  gradientFrom,
  gradientTo,
}: {
  src: string | null | undefined;
  alt: string;
  gradientFrom: string;
  gradientTo: string;
}) {
  const [imgError, setImgError] = useState(false);

  // Reset error state whenever src changes
  useEffect(() => {
    setImgError(false);
  }, [src]);

  const showImage = src && !imgError;

  return (
    <div
      className="
        mx-auto my-auto
        w-[82%] sm:w-[80%] md:w-[78%]
        h-[150px] sm:h-[170px] md:h-[200px]
        rounded-[24px] overflow-hidden
        border border-white/50
        flex items-center justify-center
        transition-transform duration-500 group-hover:scale-[1.015]
      "
      style={{
        background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
      }}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          className="
            w-[92%] h-[92%]
            object-contain object-center
            opacity-[0.97]
          "
          onError={() => setImgError(true)}
        />
      ) : (
        // Fallback: subtle brand-colored inner glow
        <div
          className="w-full h-full rounded-[24px]"
          style={{
            background: `radial-gradient(ellipse at 50% 70%, ${gradientTo}cc 0%, ${gradientFrom}55 100%)`,
          }}
        />
      )}
    </div>
  );
}

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
          backgroundColor: "hsl(var(--muted))",
        }}
        aria-hidden="true"
      />

      {/* Mobile Background Image */}
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat block md:hidden"
        style={{
          backgroundImage: `url(${mobileBanner})`,
          backgroundColor: "hsl(var(--muted))",
        }}
        aria-hidden="true"
      />

      {/* Overlay for text readability */}
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
              className="
                group flex flex-col text-left
                rounded-3xl overflow-hidden
                bg-background/85 backdrop-blur-md
                border border-border/60
                shadow-sm hover:shadow-lg
                hover:-translate-y-1
                transition-all duration-300
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                w-full h-[320px] sm:h-[360px] lg:h-[400px]
              "
            >
              {/* IMAGE AREA */}
              <div className="relative w-full flex-[1.7] bg-gradient-to-br from-[#f8f3ea] via-[#f3f4ee] to-[#e8eee6] flex items-center justify-center overflow-hidden">
                <BrandImageTray
                  src={settings?.homeBrandDesembreImageUrl}
                  alt="Desembre sản phẩm"
                  gradientFrom="#f8f3ea"
                  gradientTo="#e8eee6"
                />
              </div>

              {/* CONTENT AREA */}
              <div className="flex-1 flex flex-col justify-center px-5 py-4 md:px-7 md:py-5 bg-background border-t border-border/30">
                <h3 className="text-2xl lg:text-[32px] font-black tracking-tight text-foreground mb-0.5 group-hover:text-primary transition-colors leading-none">
                  DESEMBRE
                </h3>
                <p className="text-sm md:text-base font-medium text-muted-foreground truncate">
                  Thẩm mỹ chuyên nghiệp
                </p>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-primary transition-all mt-3">
                  Tra cứu ngay{" "}
                  <span className="group-hover:translate-x-1 transition-transform duration-300">
                    &rarr;
                  </span>
                </div>
              </div>
            </Link>

            {/* DERMAGARDEN CARD */}
            <Link
              to="/dermagarden"
              className="
                group flex flex-col text-left
                rounded-3xl overflow-hidden
                bg-background/85 backdrop-blur-md
                border border-border/60
                shadow-sm hover:shadow-lg
                hover:-translate-y-1
                transition-all duration-300
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                w-full h-[320px] sm:h-[360px] lg:h-[400px]
              "
            >
              {/* IMAGE AREA */}
              <div className="relative w-full flex-[1.7] bg-gradient-to-br from-[#effaf5] via-[#edf8f4] to-[#e2f5ec] flex items-center justify-center overflow-hidden">
                <BrandImageTray
                  src={settings?.homeBrandDermagardenImageUrl}
                  alt="Dermagarden sản phẩm"
                  gradientFrom="#effaf5"
                  gradientTo="#e2f5ec"
                />
              </div>

              {/* CONTENT AREA */}
              <div className="flex-1 flex flex-col justify-center px-5 py-4 md:px-7 md:py-5 bg-background border-t border-border/30">
                <h3 className="text-2xl lg:text-[32px] font-black tracking-tight text-foreground mb-0.5 group-hover:text-primary transition-colors leading-none">
                  DERMAGARDEN
                </h3>
                <p className="text-sm md:text-base font-medium text-muted-foreground truncate">
                  Chăm sóc da chuyên sâu
                </p>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-primary transition-all mt-3">
                  Tra cứu ngay{" "}
                  <span className="group-hover:translate-x-1 transition-transform duration-300">
                    &rarr;
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
