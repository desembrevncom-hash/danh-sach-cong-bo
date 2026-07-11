import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { useSiteSettings } from "@/features/seo/components/SiteSettingsProvider";

// ─────────────────────────────────────────────
// Hook: useTypewriter
// ─────────────────────────────────────────────
function useTypewriter(
  fullText: string,
  {
    speed = 28,
    startDelay = 600,
    cursorBlinkDuration = 1800,
    disabled = false,
  }: {
    speed?: number;
    startDelay?: number;
    cursorBlinkDuration?: number;
    disabled?: boolean;
  } = {}
) {
  const [displayed, setDisplayed] = useState(disabled ? fullText : "");
  const [showCursor, setShowCursor] = useState(!disabled);
  const [done, setDone] = useState(disabled);

  useEffect(() => {
    if (disabled) {
      setDisplayed(fullText);
      setShowCursor(false);
      setDone(true);
      return;
    }

    setDisplayed("");
    setShowCursor(true);
    setDone(false);

    let charIndex = 0;
    let typeInterval: ReturnType<typeof setInterval>;
    let cursorTimer: ReturnType<typeof setTimeout>;

    const startTimer = setTimeout(() => {
      typeInterval = setInterval(() => {
        charIndex++;
        setDisplayed(fullText.slice(0, charIndex));
        if (charIndex >= fullText.length) {
          clearInterval(typeInterval);
          setDone(true);
          cursorTimer = setTimeout(() => {
            setShowCursor(false);
          }, cursorBlinkDuration);
        }
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(startTimer);
      clearInterval(typeInterval);
      clearTimeout(cursorTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullText, disabled]);

  return { displayed, showCursor, done };
}

// ─────────────────────────────────────────────
// Component: BrandCard
// ─────────────────────────────────────────────
function BrandCard({
  to,
  imageUrl,
  title,
  subtitle,
  ctaLabel,
  fallbackGradient,
}: {
  to: string;
  imageUrl: string | null | undefined;
  title: string;
  subtitle: string;
  ctaLabel: string;
  fallbackGradient: string;
}) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [imageUrl]);

  const showImage = imageUrl && !imgError;

  return (
    <Link
      to={to}
      className="group flex flex-col text-left rounded-[28px] overflow-hidden bg-background border border-border/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 w-full"
    >
      {/* IMAGE SECTION — full-bleed aspect-[12/7] */}
      <div
        className="relative w-full aspect-[12/7] overflow-hidden flex-shrink-0"
        style={{ background: fallbackGradient }}
      >
        {showImage ? (
          <img
            src={imageUrl}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0" style={{ background: fallbackGradient }} />
        )}
        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background/35 to-transparent pointer-events-none" />
      </div>

      {/* CONTENT SECTION */}
      <div className="flex items-center justify-between gap-3 px-6 py-5 md:px-7 md:py-6 bg-background min-h-[130px] md:min-h-[140px]">
        {/* Left: text */}
        <div className="flex flex-col min-w-0">
          <h3 className="text-2xl lg:text-[28px] font-black tracking-tight text-foreground group-hover:text-primary transition-colors leading-tight">
            {title}
          </h3>
          <p className="text-sm md:text-base font-medium text-muted-foreground mt-0.5 truncate">
            {subtitle}
          </p>
        </div>

        {/* Right: Morph CTA — circle on desktop idle, pill on hover; always pill on mobile */}
        <div
          className={[
            "flex-shrink-0 flex items-center justify-center overflow-hidden",
            "rounded-full bg-[#14221c] text-white",
            "transition-all duration-300 ease-in-out",
            "shadow-md group-hover:shadow-lg",
            // pulse ring — only on desktop, reduced-motion safe via CSS
            "motion-safe:animate-none",
            // Desktop: 46px circle → 108px pill on group-hover
            "w-[46px] h-[46px]",
            "md:w-[52px] md:h-[52px]",
            "md:group-hover:w-[116px] md:group-focus-within:w-[116px]",
            "md:group-hover:scale-[1.04] md:group-hover:shadow-xl",
          ].join(" ")}
          aria-label={ctaLabel}
          role="img"
        >
          {/* Text label — hidden on mobile, fade-in on desktop hover */}
          <span
            className={[
              "whitespace-nowrap text-sm font-semibold leading-none",
              // Mobile: always hidden (pill handled below)
              "hidden",
              // Desktop: hidden by default, visible on group-hover
              "md:block md:max-w-0 md:opacity-0 md:overflow-hidden",
              "md:group-hover:max-w-[60px] md:group-hover:opacity-100 md:group-hover:mr-1",
              "transition-all duration-300 ease-in-out",
            ].join(" ")}
          >
            Tra cứu
          </span>
          <ArrowRight
            className="w-[18px] h-[18px] flex-shrink-0 group-hover:translate-x-0.5 transition-transform duration-300"
            strokeWidth={2.2}
          />
        </div>

        {/* Mobile-only pill: always visible */}
        <div
          className={[
            "md:hidden flex-shrink-0 flex items-center gap-1.5",
            "rounded-full bg-[#14221c] text-white",
            "px-4 h-[40px] text-sm font-semibold",
            "shadow-md",
          ].join(" ")}
          aria-hidden="true"
        >
          Tra cứu <ArrowRight className="w-[14px] h-[14px]" strokeWidth={2.2} />
        </div>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────
// Main: HomeHeroBanner
// ─────────────────────────────────────────────
const DESCRIPTION =
  "Cập nhật chính xác liên tục các công bố sản phẩm Desembre và Dermagarden đang được phép lưu hành tại Việt Nam";

export function HomeHeroBanner() {
  const { settings } = useSiteSettings();
  const fallbackBanner = "/images/home-hero-banner.jpg";
  const desktopBanner = settings?.homeHeroBannerImageUrl || fallbackBanner;
  const mobileBanner = settings?.homeHeroBannerMobileImageUrl || desktopBanner;

  // Detect prefers-reduced-motion
  const reducedMotion = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ).current;

  const { displayed, showCursor } = useTypewriter(DESCRIPTION, {
    speed: 26,
    startDelay: 700,
    cursorBlinkDuration: 1800,
    disabled: reducedMotion,
  });

  return (
    <section className="relative w-full min-h-[720px] md:min-h-[760px] lg:min-h-[820px] bg-muted/30 overflow-hidden isolate py-16 flex items-center">
      {/* Desktop Background */}
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat hidden md:block"
        style={{
          backgroundImage: `url(${desktopBanner})`,
          backgroundColor: "hsl(var(--muted))",
        }}
        aria-hidden="true"
      />

      {/* Mobile Background */}
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat block md:hidden"
        style={{
          backgroundImage: `url(${mobileBanner})`,
          backgroundColor: "hsl(var(--muted))",
        }}
        aria-hidden="true"
      />

      {/* Overlay */}
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

          {/* Description with typewriter effect */}
          <div
            className="mb-10 max-w-[720px] mx-auto px-2"
            /* min-height = roughly 2 lines to prevent layout shift */
            style={{ minHeight: "3.5rem" }}
          >
            {/* Screen reader gets full text immediately */}
            <span className="sr-only">{DESCRIPTION}</span>

            {/* Visual typewriter (aria-hidden so SR doesn't read char by char) */}
            <p
              className="text-base sm:text-lg text-muted-foreground leading-relaxed drop-shadow-sm"
              aria-hidden="true"
            >
              {displayed}
              {showCursor && (
                <span className="inline-block w-[2px] h-[1.1em] bg-muted-foreground/70 ml-0.5 align-middle animate-[blink_0.75s_step-end_infinite]" />
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 lg:gap-7 w-full max-w-[1080px] lg:max-w-[1120px] mt-2">
            <BrandCard
              to="/desembre"
              imageUrl={settings?.homeBrandDesembreImageUrl}
              title="DESEMBRE"
              subtitle="Thẩm mỹ chuyên nghiệp"
              ctaLabel="Tra cứu sản phẩm Desembre"
              fallbackGradient="linear-gradient(135deg, #f8f3ea, #f3f4ee, #e8eee6)"
            />
            <BrandCard
              to="/dermagarden"
              imageUrl={settings?.homeBrandDermagardenImageUrl}
              title="DERMAGARDEN"
              subtitle="Chăm sóc da chuyên sâu"
              ctaLabel="Tra cứu sản phẩm Dermagarden"
              fallbackGradient="linear-gradient(135deg, #effaf5, #edf8f4, #e2f5ec)"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
