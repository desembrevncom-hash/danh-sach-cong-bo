export function HomeProcessSection() {
  return (
    <section className="border-y border-border bg-[#f8f5ef]/50 dark:bg-muted/10 relative overflow-hidden isolate">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28 relative z-10">
        <div className="mx-auto max-w-2xl text-center mb-16 md:mb-20">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary mb-4">
            Quy trình tra cứu
          </p>
          <h2 className="elegant-title text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-6">
            Tra cứu dễ dàng trong 3 bước
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
            Chọn thương hiệu, tìm sản phẩm và xuất danh mục khi cần.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Item 1 */}
          <article className="group relative flex flex-col p-8 bg-card border border-border/50 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 hover:-translate-y-1">
            <div className="text-5xl md:text-6xl font-black text-primary/15 group-hover:text-primary/20 transition-colors mb-6 font-serif">
              01
            </div>
            <div className="w-8 h-1 bg-primary/30 mb-6 rounded-full group-hover:bg-primary/50 transition-colors" />
            <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight">
              Chọn thương hiệu
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed flex-1">
              Truy cập nhanh danh mục Desembre hoặc Dermagarden tùy theo nhu cầu tra cứu.
            </p>
          </article>

          {/* Item 2 */}
          <article className="group relative flex flex-col p-8 bg-card border border-border/50 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 hover:-translate-y-1">
            <div className="text-5xl md:text-6xl font-black text-primary/15 group-hover:text-primary/20 transition-colors mb-6 font-serif">
              02
            </div>
            <div className="w-8 h-1 bg-primary/30 mb-6 rounded-full group-hover:bg-primary/50 transition-colors" />
            <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight">
              Tra cứu sản phẩm
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed flex-1">
              Tìm kiếm theo tên, mô tả hoặc lọc theo từng nhóm sản phẩm một cách thông minh.
            </p>
          </article>

          {/* Item 3 */}
          <article className="group relative flex flex-col p-8 bg-card border border-border/50 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 hover:-translate-y-1">
            <div className="text-5xl md:text-6xl font-black text-primary/15 group-hover:text-primary/20 transition-colors mb-6 font-serif">
              03
            </div>
            <div className="w-8 h-1 bg-primary/30 mb-6 rounded-full group-hover:bg-primary/50 transition-colors" />
            <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight">
              Xuất danh mục
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed flex-1">
              Tải danh sách công bố dưới dạng PDF hoặc Excel để lưu trữ và chia sẻ tiện lợi.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
