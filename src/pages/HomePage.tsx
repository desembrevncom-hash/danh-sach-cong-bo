import { Link } from "react-router-dom";
import { SeoHead } from "@/features/seo/components/SeoHead";
import { PublicLayout } from "@/features/public-layout/components/PublicLayout";
import { BRAND_THEMES } from "@/config/brands";
import { ArrowRight, Search, FileText, Layers } from "lucide-react";

export default function HomePage() {
  const desembreTheme = BRAND_THEMES["desembre"];
  const dermagardenTheme = BRAND_THEMES["dermagarden"];

  return (
    <PublicLayout>
      <SeoHead routePath="/" />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-muted/30 py-20 md:py-32">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-6 relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase mb-8">
            <Search className="w-3.5 h-3.5" />
            Tra cứu trực tuyến
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold text-foreground tracking-tight max-w-4xl mb-6 leading-tight">
            Hệ thống tra cứu <span className="text-primary">công bố sản phẩm</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            Công cụ chính thức để tra cứu danh sách sản phẩm thuộc thương hiệu Desembre và Dermagarden đang được phép lưu hành tại Việt Nam.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link 
              to="/desembre"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-foreground text-background font-medium hover:bg-foreground/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Xem Desembre
            </Link>
            <Link 
              to="/dermagarden"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-card border border-border text-foreground font-medium hover:bg-muted transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Xem Dermagarden
            </Link>
          </div>
        </div>
      </section>

      {/* Brands Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">Danh mục thương hiệu</h2>
            <div className="w-12 h-1 bg-primary mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* DESEMBRE CARD */}
            <Link 
              to="/desembre"
              className="group relative flex flex-col p-10 md:p-14 bg-card rounded-3xl border border-border/50 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden isolate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label="Vào xem danh mục Desembre"
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 ${desembreTheme.backgroundClass}`} />
              
              <div className="mt-auto">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3 opacity-80 group-hover:opacity-100 transition-opacity">
                  Chăm sóc chuyên nghiệp
                </p>
                <h3 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground mb-6 group-hover:text-primary transition-colors">
                  DESEMBRE
                </h3>
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  Vào xem danh mục <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* DERMAGARDEN CARD */}
            <Link 
              to="/dermagarden"
              className="group relative flex flex-col p-10 md:p-14 bg-card rounded-3xl border border-border/50 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden isolate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label="Vào xem danh mục Dermagarden"
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 ${dermagardenTheme.backgroundClass}`} />
              
              <div className="mt-auto">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3 opacity-80 group-hover:opacity-100 transition-opacity">
                  Chăm sóc chuyên sâu
                </p>
                <h3 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground mb-6 group-hover:text-primary transition-colors">
                  DERMAGARDEN
                </h3>
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  Vào xem danh mục <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Info Strip */}
      <section className="border-y border-border bg-card/50">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-border">
            <div className="flex flex-col items-center text-center pt-8 md:pt-0 px-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                <Search className="w-5 h-5" />
              </div>
              <h4 className="font-semibold mb-2">Tìm kiếm nhanh chóng</h4>
              <p className="text-sm text-muted-foreground">Tra cứu tức thì bằng mã hoặc tên sản phẩm.</p>
            </div>
            
            <div className="flex flex-col items-center text-center pt-8 md:pt-0 px-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="font-semibold mb-2">Phân loại thông minh</h4>
              <p className="text-sm text-muted-foreground">Sản phẩm được chia nhóm theo danh mục chuyên nghiệp.</p>
            </div>
            
            <div className="flex flex-col items-center text-center pt-8 md:pt-0 px-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="font-semibold mb-2">Xuất file tiện lợi</h4>
              <p className="text-sm text-muted-foreground">Hỗ trợ kết xuất danh sách dưới dạng PDF/Excel dễ dàng.</p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
