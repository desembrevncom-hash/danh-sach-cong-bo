import { useCallback, useEffect, useState, useMemo } from "react";
import { sections, flatProducts, type FlatProduct } from "@/data/desembreProducts";
import UnlockDialog from "@/features/edit-unlock/components/UnlockDialog";
import ProductEditDialog from "@/features/products/components/ProductEditDialog";
import { useEditUnlock } from "@/features/edit-unlock/hooks/useEditUnlock";
import { fetchAllProductOverrides } from "@/features/products/services/productOverrideService";
import type { ProductOverrideRow as OverrideRow } from "@/features/products/types";
import { EditHistoryProvider, useEditHistory } from "@/hooks/useEditHistory";
import { toast } from "sonner";
import { groupProductsBySection } from "@/features/products/utils/productTransforms";
import { CatalogHeader } from "@/features/products/components/CatalogHeader";
import { CatalogFooter } from "@/features/products/components/CatalogFooter";
import { ProductToolbar } from "@/features/products/components/ProductToolbar";
import { ProductTable } from "@/features/products/components/ProductTable";
import { ProductCardList } from "@/features/products/components/ProductCardList";
import { ProductSkeleton } from "@/features/products/components/ProductSkeleton";
import { useProductActions } from "@/features/products/hooks/useProductActions";
import { useDebounce } from "@/hooks/useDebounce";
import { useAdminSession } from "@/hooks/useAdminSession";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ALL = "ALL";

// ─── Inner component (has access to EditHistoryContext) ───────────────────────

const IndexInner = ({
  overrides,
  setOverrides,
  refreshOverrides,
}: {
  overrides: Record<number, OverrideRow>;
  setOverrides: React.Dispatch<React.SetStateAction<Record<number, OverrideRow>>>;
  refreshOverrides: () => Promise<void>;
}) => {
  const { unlocked, lock, getPassword } = useEditUnlock();
  const history = useEditHistory();
  const { isAdmin } = useAdminSession();

  const [askUnlock, setAskUnlock] = useState(false);
  const [query, setQuery] = useState("");
  const [section, setSection] = useState<string>(ALL);

  // Pagination & Data states
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [productsData, setProductsData] = useState<FlatProduct[]>([]);

  const debouncedQuery = useDebounce(query, 300);

  // Fetch RPC Data
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      // Ép kiểu tham số chặt chẽ để tránh 400 Bad Request
      const searchTerm = debouncedQuery?.trim() || null;          // string | null
      const catId      = (section && section !== ALL) ? section : null; // string | null
      const pageNum    = Math.max(1, Math.floor(currentPage));    // integer
      const pageSize   = 20;                                       // integer

      const { data, error } = await supabase.rpc("search_products_catalog", {
        search_term: searchTerm,
        cat_id:      catId,
        page_num:    pageNum,
        page_size:   pageSize,
      });

      if (error) {
        console.error("RPC error:", error.code, error.message, error.details, error.hint);
        toast.error(`Lỗi tải dữ liệu: ${error.message}`);
      } else if (data) {
        interface RpcProductItem {
          no: number;
          section: string;
          name: string;
          desc: string;
          link_url?: string;
          link_url_2?: string;
          image_url?: string;
          sort_order?: number;
          total_count?: number;
        }

        const formattedData = data.map((item: RpcProductItem) => ({
          no: item.no,
          section: item.section,
          name: item.name,
          desc: item.desc,
          link: item.link_url,
          link2: item.link_url_2,
          image: item.image_url,
          sort_order: item.sort_order,
        })) as FlatProduct[];

        setProductsData(formattedData);
        if (data.length > 0 && typeof data[0].total_count === "number") {
          setTotalCount(data[0].total_count);
          setTotalPages(Math.max(1, Math.ceil(data[0].total_count / 20)));
        } else if (data.length === 0) {
          setTotalCount(0);
          setTotalPages(1);
        }
      }
    } catch (err) {
      console.error("fetchProducts exception:", err);
      toast.error("Lỗi mạng khi tải dữ liệu sản phẩm.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery, section, currentPage]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset page when search or section changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, section]);

  // ── Product action handlers (tách ra khỏi page) ──────────────────────────
  const {
    upsertOverride,
    editOpen,
    setEditOpen,
    editInitial,
    openCreate,
    actions,
  } = useProductActions({
    overrides,
    setOverrides,
    getPassword,
    snapshot: history.snapshot,
    refreshOverrides: async () => {
      await refreshOverrides();
      await fetchProducts(); // Refetch catalog after override refresh
    },
  });

  // Modify upsertOverride locally in this component to trigger refetch for optimistic UI to be fully synced
  // However, local overrides still work for immediate feedback if `groupedProducts` merges it.
  // Actually, since we render `productsData` directly, we might need `productsData` to be merged with `overrides` locally for instant UX,
  // or just refetch. Since RPC is fast, let's just use `productsData` but apply overrides manually on top for instant UI.
  // Optimistic UI: filter ra sản phẩm đã bị ẩn (deleted = true trong overrides)
  // rồi apply override data lên các item còn lại
  const mergedForView = useMemo(() => {
    return productsData
      .filter((p) => !overrides[p.no]?.deleted)  // Ẩn ngay sản phẩm khi Admin bấm nút ẩn
      .map((p) => {
        const ov = overrides[p.no];
        if (!ov) return p;
        return {
          ...p,
          name: ov.name ?? p.name,
          desc: ov.desc ?? p.desc,
          section: ov.section ?? p.section,
          link: ov.link_url !== undefined ? (ov.link_url ?? undefined) : p.link,
          link2: ov.link_url_2 !== undefined ? (ov.link_url_2 ?? undefined) : p.link2,
          image: ov.image_url !== undefined ? (ov.image_url ?? undefined) : p.image,
          sort_order: ov.sort_order ?? p.sort_order,
        };
      });
  }, [productsData, overrides]);

  const grouped = useMemo(() => groupProductsBySection(mergedForView), [mergedForView]);

  // Nhóm tuỳ chỉnh do Admin thêm mới trong phiên làm việc
  const [customSections, setCustomSections] = useState<string[]>([]);

  const sectionTitles = useMemo(() => {
    const set = new Set<string>(sections.map((s) => s.title));
    for (const o of Object.values(overrides)) if (o.section) set.add(o.section);
    for (const cs of customSections) set.add(cs);
    return Array.from(set);
  }, [overrides, customSections]);

  const handleAddSection = (name: string) => {
    if (!sectionTitles.includes(name)) {
      setCustomSections((prev) => [...prev, name]);
    }
  };

  const isFiltered = query !== "" || section !== ALL;

  const reset = () => {
    setQuery("");
    setSection(ALL);
    setCurrentPage(1);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <CatalogHeader />

      <section className="container mx-auto px-3 md:px-6 pt-3 md:pt-8 sticky top-0 z-50 bg-background/80 backdrop-blur-sm pb-2">
        <ProductToolbar
          query={query}
          onSearchChange={setQuery}
          section={section}
          setSection={setSection}
          sectionTitles={sectionTitles}
          isFiltered={isFiltered}
          onReset={reset}
          filteredProducts={mergedForView}
          overrides={overrides}
          unlocked={unlocked}
          onOpenCreate={() => openCreate(section === ALL ? "" : section)}
          onToggleLock={() => (unlocked ? lock() : setAskUnlock(true))}
          isAdmin={isAdmin}
          onAddSection={handleAddSection}
        />

        <UnlockDialog open={askUnlock} onOpenChange={setAskUnlock} />
        <ProductEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          initial={editInitial}
          sectionOptions={sectionTitles}
          groupedProducts={grouped}
          onSaved={async (row, insertAfterNo) => {
            if (editInitial?.no && editInitial.no !== row.no) {
              await refreshOverrides();
              await fetchProducts();
              toast.success("Đã sắp xếp lại danh sách");
            } else {
              upsertOverride(row, {
                snapshotLabel: editInitial?.no
                  ? `Sửa "${editInitial?.name ?? row.name ?? row.no}"`
                  : `Thêm "${row.name ?? row.no}"`,
              });
              
              if (insertAfterNo !== undefined && row.section) {
                // Find current products in this section
                const sectionGroup = grouped.find(g => g[0] === row.section);
                if (sectionGroup) {
                  const items = sectionGroup[1].filter(p => p.no !== row.no);
                  
                  let newOrderedNos: number[] = [];
                  if (insertAfterNo === -1) {
                    newOrderedNos = [row.no, ...items.map(p => p.no)];
                  } else if (insertAfterNo === -2) {
                    newOrderedNos = [...items.map(p => p.no), row.no];
                  } else {
                    const insertIdx = items.findIndex(p => p.no === insertAfterNo);
                    if (insertIdx !== -1) {
                      newOrderedNos = [
                        ...items.slice(0, insertIdx + 1).map(p => p.no),
                        row.no,
                        ...items.slice(insertIdx + 1).map(p => p.no)
                      ];
                    } else {
                      newOrderedNos = [...items.map(p => p.no), row.no];
                    }
                  }
                  
                  // Optimistically delay the reorder slightly to let state settle
                  setTimeout(() => {
                    actions.onReorderProduct(row.section!, newOrderedNos);
                  }, 100);
                }
              } else {
                // We just did upsert, refetch RPC to be sure after a short delay
                setTimeout(fetchProducts, 300);
              }
            }
          }}
        />

        <div className="flex items-center justify-between mt-2 px-1">
          <p className="text-xs text-muted-foreground">
            Hiển thị <span className="font-semibold text-foreground">{mergedForView.length}</span> sản phẩm / Tổng số <span className="font-semibold text-foreground">{totalCount}</span>
          </p>
        </div>
      </section>

      <main className="container mx-auto px-4 md:px-6 pt-2 pb-6 md:py-6 flex-1 w-full">
        {isLoading ? (
          <ProductSkeleton />
        ) : mergedForView.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-lg shadow-sm text-center px-4">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">🔍</span>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Không tìm thấy sản phẩm</h3>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              Không có sản phẩm nào khớp với từ khóa hoặc bộ lọc của bạn. Vui lòng thử lại với tiêu chí khác.
            </p>
            <button
              type="button"
              onClick={reset}
              className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-md hover:opacity-90 transition-opacity shadow-sm"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <>
            <ProductTable
              groupedProducts={grouped}
              overrides={overrides}
              unlocked={unlocked}
              isAdmin={isAdmin}
              onAdminOptimisticUpdate={(no, patch) => {
                setOverrides(prev => ({ ...prev, [no]: { ...(prev[no] ?? { no }), ...patch } as OverrideRow }));
                // Send to DB asynchronously
                supabase.from("product_overrides").upsert({ no, ...patch }).then(({ error }) => {
                  if (error) toast.error("Lỗi khi cập nhật: " + error.message);
                  else if (Object.keys(patch).some(k => ["name","desc"].includes(k))) toast.success("Đã lưu thay đổi.");
                });
              }}
              actions={{
                ...actions,
                onSetImage: async (no, src) => { await actions.onSetImage(no, src); fetchProducts(); },
                onSetLink: async (no, href, isLink2) => { await actions.onSetLink(no, href, isLink2); fetchProducts(); },
                onDelete: async (p) => { await actions.onDelete(p); fetchProducts(); },
                onRenameSection: async (oldTitle, rows) => { await actions.onRenameSection(oldTitle, rows); fetchProducts(); },
                onReorderProduct: async (section, orderedNos) => { await actions.onReorderProduct(section, orderedNos); fetchProducts(); }
              }}
            />
            <ProductCardList
              groupedProducts={grouped}
              overrides={overrides}
              unlocked={unlocked}
              actions={{
                ...actions,
                onSetImage: async (no, src) => { await actions.onSetImage(no, src); fetchProducts(); },
                onSetLink: async (no, href, isLink2) => { await actions.onSetLink(no, href, isLink2); fetchProducts(); },
                onDelete: async (p) => { await actions.onDelete(p); fetchProducts(); },
                onRenameSection: async (oldTitle, rows) => { await actions.onRenameSection(oldTitle, rows); fetchProducts(); },
                onReorderProduct: async (section, orderedNos) => { await actions.onReorderProduct(section, orderedNos); fetchProducts(); }
              }}
            />

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-4 pb-8">
                <button
                  type="button"
                  disabled={currentPage <= 1 || isLoading}
                  onClick={() => {
                    setCurrentPage(p => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-md bg-card hover:bg-muted/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Trang trước
                </button>
                <div className="text-sm font-medium px-2">
                  Trang <span className="font-bold text-primary">{currentPage}</span> / {totalPages}
                </div>
                <button
                  type="button"
                  disabled={currentPage >= totalPages || isLoading}
                  onClick={() => {
                    setCurrentPage(p => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-md bg-card hover:bg-muted/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                >
                  Trang sau
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <CatalogFooter />
    </div>
  );
};

// ─── Root component (owns overrides state + history context) ──────────────────

const Index = () => {
  const [overrides, setOverrides] = useState<Record<number, OverrideRow>>({});

  const refreshOverrides = useCallback(async () => {
    const { ok, data, error } = await fetchAllProductOverrides();
    if (!ok) {
      console.error("Fetch error:", error);
      toast.error(error);
      return;
    }
    if (!data) return;
    const map: Record<number, OverrideRow> = {};
    for (const r of data) map[r.no] = r;
    setOverrides(map);
  }, []);

  useEffect(() => {
    refreshOverrides();
  }, [refreshOverrides]);

  const applyRestore = useCallback((no: number, row: OverrideRow | null) => {
    setOverrides((prev) => {
      const n = { ...prev };
      if (row) n[no] = row;
      else delete n[no];
      return n;
    });
  }, []);

  return (
    <EditHistoryProvider applyRestore={applyRestore}>
      <IndexInner overrides={overrides} setOverrides={setOverrides} refreshOverrides={refreshOverrides} />
    </EditHistoryProvider>
  );
};

export default Index;
