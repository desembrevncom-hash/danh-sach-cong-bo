import { Search, RotateCcw, Lock, LockOpen, Plus, FileDown } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { ProductPDF } from "@/features/export-pdf/components/ProductPDF";
import { HistoryPanel } from "@/features/products/components/HistoryPanel";
import { sections, type FlatProduct } from "@/data/desembreProducts";
import type { ProductOverrideRow } from "@/features/products/types";

export type ProductToolbarProps = {
  query: string;
  setQuery: (q: string) => void;
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

export function ProductToolbar({
  query,
  setQuery,
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
  return (
    <div className="bg-card border border-border rounded-lg p-3 md:p-5 shadow-md flex flex-col md:flex-row gap-2 md:gap-3 md:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo tên hoặc mô tả sản phẩm..."
          className="w-full h-11 pl-10 pr-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
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
        onClick={onReset}
        disabled={!isFiltered}
        className="h-11 px-5 rounded-md bg-primary text-primary-foreground text-sm font-semibold tracking-wide inline-flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
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
        className="h-11 px-4 rounded-md border border-border bg-card text-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-muted/50 transition"
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
            className="h-11 px-4 rounded-md bg-accent text-accent-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90 transition"
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
        className={`h-11 px-4 rounded-md text-sm font-semibold tracking-wide inline-flex items-center justify-center gap-2 transition border ${
          unlocked
            ? "bg-accent/20 text-foreground border-accent hover:bg-accent/30"
            : "bg-card text-foreground border-border hover:bg-muted/50"
        }`}
      >
        {unlocked ? <LockOpen className="w-4 h-4 text-accent-foreground" /> : <Lock className="w-4 h-4" />}
        {unlocked ? "Đã mở khoá" : "Mở khoá KEY"}
      </button>
    </div>
  );
}
