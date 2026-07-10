import { Search, FileText, Layers } from "lucide-react";

export function HomeFeatureStrip() {
  return (
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
  );
}
