export function CatalogHeader({ brand = "desembre" }: { brand?: string }) {
  const isDermagarden = brand.toLowerCase() === "dermagarden";
  const brandName = isDermagarden ? "Dermagarden" : "Desembre";
  
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-6 py-8 md:py-12 text-center md:animate-header-fadein">
        <p className="text-[11px] uppercase tracking-[0.4em] text-muted-foreground mb-4">
          www.{isDermagarden ? "dermagarden" : "desembrevn"}.com · 2026 Catalog
        </p>
        <h1 className="elegant-title text-[24px] md:text-5xl lg:text-6xl font-semibold text-primary leading-tight">
          Danh Sách Công Bố Sản Phẩm {brandName}
        </h1>
        <div className="mx-auto mt-6 h-[2px] w-24 bg-accent" />
        <p className="mt-5 text-sm leading-6 text-muted-foreground max-w-xl mx-auto">
          Bộ sưu tập đầy đủ các dòng sản phẩm chăm sóc da chuyên nghiệp {brandName} — đã công bố lưu hành tại Việt Nam.
        </p>
      </div>
    </header>
  );
}
