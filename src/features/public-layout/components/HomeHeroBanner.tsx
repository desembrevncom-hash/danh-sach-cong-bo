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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full max-w-[720px] mt-2">
            {/* DESEMBRE CARD */}
            <Link 
              to="/desembre"
              className="group relative flex flex-col items-start text-left p-5 md:p-6 rounded-2xl bg-background/70 md:bg-background/80 backdrop-blur-md border border-border/40 shadow-sm hover:shadow-xl hover:bg-background/95 hover:border-border/60 transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <h3 className="text-xl md:text-2xl font-black tracking-tight text-foreground mb-1 group-hover:text-primary transition-colors flex items-center justify-between w-full">
                DESEMBRE
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </h3>
              <p className="text-sm font-semibold text-foreground/80 mb-2">
                Thương hiệu thẩm mỹ chuyên nghiệp
              </p>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                Danh mục sản phẩm Desembre đang được công bố và cập nhật liên tục.
              </p>
            </Link>

            {/* DERMAGARDEN CARD */}
            <Link 
              to="/dermagarden"
              className="group relative flex flex-col items-start text-left p-5 md:p-6 rounded-2xl bg-background/70 md:bg-background/80 backdrop-blur-md border border-border/40 shadow-sm hover:shadow-xl hover:bg-background/95 hover:border-border/60 transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <h3 className="text-xl md:text-2xl font-black tracking-tight text-foreground mb-1 group-hover:text-primary transition-colors flex items-center justify-between w-full">
                DERMAGARDEN
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </h3>
              <p className="text-sm font-semibold text-foreground/80 mb-2">
                Thương hiệu chăm sóc da chuyên sâu
              </p>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                Tra cứu danh sách sản phẩm Dermagarden đang được phép lưu hành tại Việt Nam.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
