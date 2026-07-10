import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Navigate } from "react-router-dom";
import { sections, flatProducts } from '@/data/desembreProducts';
import type { ProductViewModel, ProductRowFromRpc } from '@/features/products/types';
import { mapProductRowsToViewModels } from '@/features/products/mappers';
import UnlockDialog from "@/features/edit-unlock/components/UnlockDialog";
import ProductEditDialog from "@/features/products/components/ProductEditDialog";
import { useEditUnlock } from "@/features/edit-unlock/hooks/useEditUnlock";
import { fetchAllProductOverrides } from "@/features/products/services/productOverrideService";
import type { ProductOverrideRow as OverrideRow } from "@/features/products/types";
import { EditHistoryProvider, useEditHistory } from "@/hooks/useEditHistory";
import { toast } from "sonner";
import { groupProductsBySection } from "@/features/products/utils/productTransforms";
import { buildProductDisplayRows, type ProductDisplayRow } from "@/features/products/utils/productDisplayRows";
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
import { resolveBrandId, ALL_SECTION_VALUE, getBrandSectionOptions, formatSectionLabel, type SectionOption } from "@/config/brands";
import { SeoHead } from "@/features/seo/components/SeoHead";

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
  const { unlocked, lock } = useEditUnlock();
  const history = useEditHistory();
  const { isAdmin } = useAdminSession();
  const { brandId } = useParams();

  const [askUnlock, setAskUnlock] = useState(false);
  const [query, setQuery] = useState("");
  const [section, setSection] = useState<string>(ALL_SECTION_VALUE);
  
  const activeBrand = resolveBrandId(brandId);
  const [dbSections, setDbSections] = useState<SectionOption[] | null>(null);
  
  const baseSectionOptions = useMemo(() => {
    return dbSections ?? getBrandSectionOptions(activeBrand);
  }, [dbSections, activeBrand]);

  const fetchSections = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_catalog_sections', {
        brand_id: activeBrand,
        include_hidden: isAdmin,
      });
      if (error) throw error;
      const options = (data || []).map((row: { section: string }) => ({
        value: row.section,
        label: formatSectionLabel(row.section),
      }));
      setDbSections(options);
    } catch (err) {
      console.error("Error fetching sections:", err);
      setDbSections(null); // Fallback to static config
    }
  }, [activeBrand, isAdmin]);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  useEffect(() => {
    setSection(ALL_SECTION_VALUE);
    setCurrentPage(1);
  }, [activeBrand]);

  // Pagination & Data states
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [productsData, setProductsData] = useState<ProductViewModel[]>([]);

  const debouncedQuery = useDebounce(query, 300);

  function withTimeout<T>(promise: Promise<T>, timeoutMs = 15000): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        window.setTimeout(() => {
          reject(new Error(`Request timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  }

  // 3. Sửa hàm fetch:
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const searchTerm = debouncedQuery?.trim() || null;
      const catId      = (section && section !== ALL_SECTION_VALUE) ? section : null;
      const pageNum    = Math.max(1, Math.floor(currentPage));
      const pageSize   = 20;

      // Use raw fetch directly — supabase.rpc() times out due to sb_publishable_ key
      // format incompatibility with the current supabase-js client.
      const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL as string;
      const supabaseKey  =
        (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
        (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string);

      const res = await withTimeout(
        fetch(`${supabaseUrl}/rest/v1/rpc/search_products_catalog`, {
          method: "POST",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            search_term: searchTerm,
            cat_id:      catId,
            brand_id:    activeBrand,
            page_num:    pageNum,
            page_size:   pageSize,
          }),
        }),
        15000
      );

      if (!res.ok) {
        const errText = await res.text();
        console.error("[fetchProducts:error] HTTP", res.status, errText);
        toast.error(`Lỗi tải dữ liệu: HTTP ${res.status}`);
        setProductsData([]);
        setTotalCount(0);
        return;
      }

      const data = await res.json() as Array<{
        id: string;
        legacy_no?: number | null;
        display_no: number;
        name: string;
        desc: string;
        image_url?: string;
        link_url?: string;
        link_url_2?: string;
        section: string;
        brand?: string;
        is_custom?: boolean;
        sort_order?: number;
        total_count?: number;
      }>;

      const filteredData = data.filter((item) => (item.brand || "desembre") === activeBrand);
      const formattedData = mapProductRowsToViewModels(filteredData as ProductRowFromRpc[]);

      setProductsData(formattedData);
      if (filteredData.length > 0) {
        setTotalCount(filteredData[0].total_count ?? filteredData.length);
        setTotalPages(Math.max(1, Math.ceil((filteredData[0].total_count ?? filteredData.length) / pageSize)));
      } else {
        setTotalCount(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("[Catalog fetch:error] fetchProducts exception:", err);
      toast.error("Lỗi hệ thống khi tải dữ liệu sản phẩm.");
      setProductsData([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery, section, currentPage, activeBrand]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // UI Tự động cập nhật: Thêm useEffect để khi activeBrand thay đổi, tự động reset page_num = 1
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, section, activeBrand]);

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
      .filter((p) => !overrides[p.id]?.deleted)  // Ẩn ngay sản phẩm khi Admin bấm nút ẩn
      .map((p) => {
        const ov = overrides[p.id];
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

  const displayRows = useMemo(() => buildProductDisplayRows(mergedForView), [mergedForView]);
  const grouped = useMemo(() => {
    const map = new Map<string, ProductDisplayRow[]>();
    for (const r of displayRows) {
      const arr = map.get(r.section) ?? [];
      arr.push(r);
      map.set(r.section, arr);
    }
    return Array.from(map.entries());
  }, [displayRows]);

  // Nhóm tuỳ chỉnh do Admin thêm mới trong phiên làm việc
  const [customSections, setCustomSections] = useState<string[]>([]);

  const sectionOptions = useMemo(() => {
    const options = [...baseSectionOptions];
    const existingValues = new Set(options.map((o) => o.value));

    for (const cs of customSections) {
      if (!existingValues.has(cs)) {
        options.push({ value: cs, label: cs });
        existingValues.add(cs);
      }
    }


    return options;
  }, [baseSectionOptions, customSections]);

  const handleAddSection = (name: string) => {
    if (!sectionOptions.find(o => o.value === name)) {
      setCustomSections((prev) => [...prev, name]);
    }
  };

  const isFiltered = query !== "" || section !== ALL_SECTION_VALUE;

  // Ensure section is valid with dynamic options
  useEffect(() => {
    if (section === ALL_SECTION_VALUE) return;
    // Wait until dbSections are loaded before forcing a reset if it doesn't match
    if (dbSections === null) return;
    
    if (!sectionOptions.some((item) => item.value === section)) {
      setSection(ALL_SECTION_VALUE);
      setCurrentPage(1);
    }
  }, [section, sectionOptions, dbSections]);

  const reset = () => {
    setQuery("");
    setSection(ALL_SECTION_VALUE);
    setCurrentPage(1);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SeoHead routePath={`/${activeBrand}`} />
      
      <CatalogHeader brand={activeBrand} />

      <section className="container mx-auto px-3 md:px-6 pt-3 md:pt-8 sticky top-0 z-50 bg-background/80 backdrop-blur-sm pb-2">
        <ProductToolbar
          query={query}
          onSearchChange={setQuery}
          section={section}
          setSection={setSection}
          sectionOptions={sectionOptions}
          isFiltered={isFiltered}
          onReset={reset}
          filteredProducts={displayRows}
          overrides={overrides}
          unlocked={unlocked}
          onOpenCreate={() => openCreate(section === ALL_SECTION_VALUE ? "" : section)}
          onToggleLock={() => (unlocked ? lock() : setAskUnlock(true))}
          isAdmin={isAdmin}
          onAddSection={handleAddSection}
          activeBrand={activeBrand}
        />

        <UnlockDialog open={askUnlock} onOpenChange={setAskUnlock} />
        <ProductEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          initial={editInitial}
          sectionOptions={sectionOptions}
          groupedProducts={grouped}
          onSaved={async (row, insertAfterNo) => {
            if (editInitial?.id && editInitial.id !== row.id) {
              await refreshOverrides();
              await fetchProducts();
              toast.success("Đã sắp xếp lại danh sách");
            } else {
              upsertOverride(row, {
                snapshotLabel: editInitial?.id
                  ? `Sửa "${editInitial?.name ?? row.name ?? row.id}"`
                  : `Thêm "${row.name ?? row.id}"`,
              });
              
              if (insertAfterNo !== undefined && row.section) {
                // Find current products in this section
                const sectionGroup = grouped.find(g => g[0] === row.section);
                if (sectionGroup) {
                  const items = sectionGroup[1].filter(p => p.id !== row.id);
                  
                  let newOrderedNos: number[] = [];
                  if (insertAfterNo === -1) {
                    newOrderedNos = [row.id, ...items.map(p => p.id)];
                  } else if (insertAfterNo === -2) {
                    newOrderedNos = [...items.map(p => p.id), row.id];
                  } else {
                    const insertIdx = items.findIndex(p => p.id === insertAfterNo);
                    if (insertIdx !== -1) {
                      newOrderedNos = [
                        ...items.slice(0, insertIdx + 1).map(p => p.id),
                        row.id,
                        ...items.slice(insertIdx + 1).map(p => p.id)
                      ];
                    } else {
                      newOrderedNos = [...items.map(p => p.id), row.id];
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
          activeBrand={activeBrand}
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
              onAdminOptimisticUpdate={(id, patch) => {
                setOverrides(prev => ({ ...prev, [id]: { ...(prev[id] ?? { id: id }), ...patch } as OverrideRow }));
                // Send to DB asynchronously
                supabase.from("product_overrides").upsert({ id: id, ...patch }).then(({ error }) => {
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
    for (const r of data) map[r.id] = r;
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
