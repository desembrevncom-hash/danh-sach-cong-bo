import { useState, useEffect, useRef } from "react";
import { Search, RotateCcw, Lock, LockOpen, Plus, FileDown, FolderPlus, X, Check } from "lucide-react";
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
  /** Khi Admin đăng nhập qua Supabase Auth */
  isAdmin?: boolean;
  /** Callback khi Admin xác nhận thêm nhóm mới */
  onAddSection?: (name: string) => void;
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
      {"." .repeat(count)}
    </span>
  );
}

/** Mini modal nhỏ gọn để nhập tên nhóm mới — render inline không overlay toàn màn hình */
function AddSectionPopover({
  onConfirm,
  onCancel,
}: {
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input ngay khi mở
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleConfirm = () => {
    const trimmed = value.trim().toUpperCase();
    if (!trimmed) return;
    onConfirm(trimmed);
    setValue("");
  };

  return (
    <div className="absolute top-full left-0 mt-1.5 z-50 bg-card border border-border rounded-lg shadow-xl p-3 w-72 animate-in fade-in zoom-in-95 duration-150">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tên nhóm sản phẩm mới</p>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleConfirm();
            if (e.key === "Escape") onCancel();
          }}
          placeholder="VD: MẶT NẠ SỢI SINH HỌC"
          className="flex-1 h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!value.trim()}
          title="Xác nhận"
          className="w-9 h-9 rounded-md bg-primary text-primary-foreground inline-flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onCancel}
          title="Hủy"
          className="w-9 h-9 rounded-md border border-border hover:bg-muted/50 inline-flex items-center justify-center text-muted-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground mt-2">Nhấn Enter để xác nhận hoặc Esc để hủy</p>
    </div>
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
  isAdmin = false,
  onAddSection,
}: ProductToolbarProps) {
  const [showAddSection, setShowAddSection] = useState(false);
  const addSectionRef = useRef<HTMLDivElement>(null);

  // Đóng popover khi click bên ngoài
  useEffect(() => {
    if (!showAddSection) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (addSectionRef.current && !addSectionRef.current.contains(e.target as Node)) {
        setShowAddSection(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAddSection]);

  const handleReset = () => {
    onSearchChange("");
    onReset();
  };

  const handleConfirmAddSection = (name: string) => {
    onAddSection?.(name);
    setShowAddSection(false);
    // Tự động chọn nhóm mới vừa tạo trong dropdown
    setSection(name);
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

      {/* Dropdown chọn nhóm + nút Thêm nhóm (Admin) */}
      <div className="flex gap-1.5 items-center">
        <select
          value={section}
          onChange={(e) => setSection(e.target.value)}
          className="h-11 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition md:w-56"
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

        {/* Nút (+) Thêm nhóm — chỉ hiện khi isAdmin */}
        {isAdmin && (
          <div className="relative" ref={addSectionRef}>
            <button
              type="button"
              onClick={() => setShowAddSection((v) => !v)}
              title="Thêm nhóm sản phẩm mới"
              className={`h-11 px-3 rounded-md border text-sm font-medium inline-flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-95 ${
                showAddSection
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border bg-card text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5"
              }`}
            >
              <FolderPlus className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Thêm nhóm</span>
            </button>

            {showAddSection && (
              <AddSectionPopover
                onConfirm={handleConfirmAddSection}
                onCancel={() => setShowAddSection(false)}
              />
            )}
          </div>
        )}
      </div>

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
          {/* Nút khoá — chỉ hiện khi Admin đang ở chế độ chỉnh sửa */}
          <button
            type="button"
            onClick={onToggleLock}
            title="Đang ở chế độ chỉnh sửa sản phẩm"
            aria-label="Đang ở chế độ chỉnh sửa sản phẩm"
            className="h-11 px-4 rounded-md text-sm font-semibold tracking-wide inline-flex items-center justify-center gap-2 transition-all duration-200 border active:scale-[0.98] md:hover:-translate-y-px bg-[#1f2b27] text-white border-[#c5a86b] hover:bg-[#26362f] shadow-sm"
          >
            <LockOpen className="w-4 h-4 text-[#c5a86b]" />
            <span className="flex items-center">
              Đang chỉnh sửa<AnimatedDots />
            </span>
          </button>
        </>
      )}
    </div>
  );
}
