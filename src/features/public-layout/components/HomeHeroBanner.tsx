import { Link } from "react-router-dom";

export function HomeHeroBanner() {
  const heroImageUrl = "/images/home-hero-banner.jpg";

  return (
    <section className="relative w-full h-[560px] md:h-[680px] lg:h-[720px] bg-muted/30 overflow-hidden isolate">
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

      <div className="container mx-auto px-4 sm:px-6 h-full flex flex-col justify-center items-center">
        <div className="max-w-[860px] w-full mx-auto text-center animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both flex flex-col items-center">
          <p className="inline-flex items-center px-4 py-1.5 mb-6 md:mb-8 rounded-full bg-muted/60 border border-border/50 text-foreground text-xs font-bold tracking-[0.18em] uppercase backdrop-blur-md shadow-sm">
            Tập đoàn HYUNJIN C&T
          </p>
          
          <h1 className="elegant-title text-[34px] leading-[1.2] sm:text-[42px] md:text-[56px] lg:text-[72px] font-bold text-foreground tracking-tight mb-6 sm:mb-8">
            Danh sách công bố <br className="hidden sm:block" />
            sản phẩm
          </h1>
          
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-10 max-w-[620px] mx-auto drop-shadow-sm">
            Cập nhật chính xác liên tục các công bố sản phẩm Desembre và Dermagarden đang được phép lưu hành tại Việt Nam
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link 
              to="/desembre"
              className="w-full sm:w-auto min-w-[200px] px-8 py-3.5 rounded-full bg-foreground text-background font-medium hover:bg-foreground/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 text-center"
            >
              Xem Desembre
            </Link>
            <Link 
              to="/dermagarden"
              className="w-full sm:w-auto min-w-[200px] px-8 py-3.5 rounded-full bg-background/90 backdrop-blur border border-border text-foreground font-medium hover:bg-muted transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 text-center"
            >
              Xem Dermagarden
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
