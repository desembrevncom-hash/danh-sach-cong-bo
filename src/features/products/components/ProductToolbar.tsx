import { useState, useEffect } from "react";
import { Search, RotateCcw, Lock, LockOpen, Plus, FileDown } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { ProductPDF } from "@/features/export-pdf/components/ProductPDF";
import { HistoryPanel } from "@/features/products/components/HistoryPanel";
import { sections, type FlatProduct } from "@/data/desembreProducts";
import type { ProductOverrideRow } from "@/features/products/types";

export type ProductToolbarProps = {
  query: string;
  onSearchChange: (value: string) => void;
  section: string;
  setSection: (s: string) => void;
  sectionTitles: string[];
  isFiltered: boolean;
  onReset: () => void;
  filteredProducts: FlatProduct[];
  overrides: Record<number, ProductOverrideRow>;
  unlocked: boolean;
  onOpenCreate: () => void;
  onToggleLock: () => void;
};

const ALL = "ALL";

function AnimatedDots() {
  const [count, setCount] = useState(1);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCount((value) => (value >= 3 ? 1 : value + 1));
    }, 500);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <span
      className="inline-block w-[18px] text-left"
      aria-hidden="true"
    >
      {".".repeat(count)}
    </span>
  );
}

export function ProductToolbar({
  query,
  onSearchChange,
  section,
  setSection,
  sectionTitles,
  isFiltered,
  onReset,
  filteredProducts,
  overrides,
  unlocked,
  onOpenCreate,
  onToggleLock,
}: ProductToolbarProps) {
  
  const handleReset = () => {
    onSearchChange("");
    onReset();
  };

  return (
    <div className="bg-card border border-border rounded-lg p-3 md:p-5 shadow-md flex flex-col md:flex-row gap-2 md:gap-3 md:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm theo tên hoặc mô tả sản phẩm..."
          className="w-full h-11 pl-10 pr-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow duration-200 focus:shadow-sm"
        />
      </div>

      <select
        value={section}
        onChange={(e) => setSection(e.target.value)}
        className="h-11 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition md:w-64"
      >
        <option value={ALL}>Tất cả nhóm sản phẩm</option>
        {sectionTitles.map((s) => {
          const meta = sections.find((x) => x.title === s);
          return (
            <option key={s} value={s}>
              {s}
              {meta?.vi ? ` — ${meta.vi}` : ""}
            </option>
          );
        })}
      </select>

      <button
        type="button"
        onClick={handleReset}
        disabled={!isFiltered}
        className={`h-11 px-5 rounded-md text-sm font-semibold tracking-wide inline-flex items-center justify-center gap-2 transition-transform duration-150 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] md:hover:-translate-y-px ${
          isFiltered
            ? "bg-primary text-primary-foreground hover:opacity-90 hover:shadow-sm"
            : "bg-transparent text-muted-foreground border border-border hover:bg-muted/50"
        }`}
      >
        <RotateCcw className="w-4 h-4" />
        Reset
      </button>

      <PDFDownloadLink
        document={
          <ProductPDF
            products={filteredProducts.map((p) => ({
              ...p,
              image: overrides[p.no]?.image_url ?? undefined,
            }))}
          />
        }
        fileName="danh-sach-san-pham-desembre.pdf"
        className="h-11 px-4 rounded-md border border-border bg-card text-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-muted/50 hover:shadow-sm transition-transform duration-150 active:scale-[0.98] md:hover:-translate-y-px"
      >
        {({ loading }) => (
          <>
            <FileDown className={`w-4 h-4 ${loading ? "animate-pulse" : ""}`} />
            {loading ? "Đang tạo…" : "Xuất PDF"}
          </>
        )}
      </PDFDownloadLink>

      {unlocked && (
        <>
          <button
            type="button"
            onClick={onOpenCreate}
            className="h-11 px-4 rounded-md bg-accent text-accent-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90 hover:shadow-sm transition-transform duration-150 active:scale-[0.98] md:hover:-translate-y-px"
          >
            <Plus className="w-4 h-4" />
            Thêm sản phẩm
          </button>
          <HistoryPanel />
        </>
      )}

      <button
        type="button"
        onClick={onToggleLock}
        title={unlocked ? "Đang ở chế độ chỉnh sửa sản phẩm" : undefined}
        aria-label={unlocked ? "Đang ở chế độ chỉnh sửa sản phẩm" : undefined}
        className={`h-11 px-4 rounded-md text-sm font-semibold tracking-wide inline-flex items-center justify-center gap-2 transition-all duration-200 border active:scale-[0.98] md:hover:-translate-y-px ${
          unlocked
            ? "bg-[#1f2b27] text-white border-[#c5a86b] hover:bg-[#26362f] shadow-sm"
            : "bg-card text-foreground border-border hover:bg-muted/50"
        }`}
      >
        {unlocked ? <LockOpen className="w-4 h-4 text-[#c5a86b]" /> : <Lock className="w-4 h-4" />}
        {unlocked ? (
          <span className="flex items-center">
            Đang chỉnh sửa<AnimatedDots />
          </span>
        ) : (
          "Mở khóa KEY"
        )}
      </button>
    </div>
  );
}
