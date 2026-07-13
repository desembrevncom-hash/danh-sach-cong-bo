import { Link } from "react-router-dom";

export function HomeHeroBanner() {
  const heroImageUrl = "/images/home-hero-banner.jpg";

  return (
    <section className="relative w-full h-[560px] md:h-[680px] bg-muted/30 overflow-hidden isolate">
      {/* Background Image with Fallback Gradient */}
      <div 
        className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${heroImageUrl})`,
          backgroundColor: 'hsl(var(--muted))'
        }}
        aria-hidden="true"
      />
      
      {/* Gradient Overlay for Text Readability (Right side) */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t md:bg-gradient-to-l from-background/90 via-background/60 to-transparent" />

      <div className="container mx-auto px-6 h-full flex flex-col justify-end md:justify-center md:items-end pb-12 md:pb-0">
        <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both">
          <p className="inline-block px-3 py-1 mb-6 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase backdrop-blur-sm">
            Tra Cứu Trực Tuyến
          </p>
          
          <h1 className="elegant-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] tracking-tight mb-6">
            Hệ thống tra cứu <br className="hidden sm:block" />
            công bố sản phẩm
          </h1>
          
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl md:ml-auto md:mr-0 drop-shadow-sm">
            Công cụ chính thức để tra cứu danh sách sản phẩm Desembre và Dermagarden đang được phép lưu hành tại Việt Nam.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link 
              to="/desembre"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-foreground text-background font-medium hover:bg-foreground/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 text-center"
            >
              Xem Desembre
            </Link>
            <Link 
              to="/dermagarden"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-card/80 backdrop-blur border border-border text-foreground font-medium hover:bg-muted transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 text-center"
            >
              Xem Dermagarden
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
