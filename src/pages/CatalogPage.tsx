import { useCallback, useEffect, useState } from "react";
import { sections, flatProducts } from "@/data/desembreProducts";
import UnlockDialog from "@/features/edit-unlock/components/UnlockDialog";
import ProductEditDialog from "@/features/products/components/ProductEditDialog";
import { useEditUnlock } from "@/features/edit-unlock/hooks/useEditUnlock";
import { fetchAllProductOverrides } from "@/features/products/services/productOverrideService";
import type { ProductOverrideRow as OverrideRow } from "@/features/products/types";
import { EditHistoryProvider, useEditHistory } from "@/hooks/useEditHistory";
import { toast } from "sonner";
import { mergeProducts, filterProducts, groupProductsBySection } from "@/features/products/utils/productTransforms";
import { CatalogHeader } from "@/features/products/components/CatalogHeader";
import { CatalogFooter } from "@/features/products/components/CatalogFooter";
import { ProductToolbar } from "@/features/products/components/ProductToolbar";
import { ProductTable } from "@/features/products/components/ProductTable";
import { ProductCardList } from "@/features/products/components/ProductCardList";
import { useProductActions } from "@/features/products/hooks/useProductActions";
import { useMemo } from "react";

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

  const [askUnlock, setAskUnlock] = useState(false);
  const [query, setQuery] = useState("");
  const [section, setSection] = useState<string>(ALL);

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
    refreshOverrides,
  });

  // ── Derived data ─────────────────────────────────────────────────────────

  const merged = useMemo(() => mergeProducts(flatProducts, overrides), [overrides]);
  const filtered = useMemo(() => filterProducts(merged, query, section), [merged, query, section]);
  const grouped = useMemo(() => groupProductsBySection(filtered), [filtered]);

  const sectionTitles = useMemo(() => {
    const set = new Set<string>(sections.map((s) => s.title));
    for (const o of Object.values(overrides)) if (o.section) set.add(o.section);
    return Array.from(set);
  }, [overrides]);

  const isFiltered = query !== "" || section !== ALL;

  const reset = () => {
    setQuery("");
    setSection(ALL);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <CatalogHeader />

      <section className="container mx-auto px-3 md:px-6 pt-3 md:pt-8 sticky top-0 z-50 bg-background/80 backdrop-blur-sm pb-2">
        <ProductToolbar
          query={query}
          setQuery={setQuery}
          section={section}
          setSection={setSection}
          sectionTitles={sectionTitles}
          isFiltered={isFiltered}
          onReset={reset}
          filteredProducts={filtered}
          overrides={overrides}
          unlocked={unlocked}
          onOpenCreate={() => openCreate(section === ALL ? "" : section)}
          onToggleLock={() => (unlocked ? lock() : setAskUnlock(true))}
        />

        <UnlockDialog open={askUnlock} onOpenChange={setAskUnlock} />
        <ProductEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          initial={editInitial}
          sectionOptions={sectionTitles}
          onSaved={(row) => {
            if (editInitial?.no && editInitial.no !== row.no) {
              refreshOverrides();
              toast.success("Đã sắp xếp lại danh sách");
            } else {
              upsertOverride(row, {
                snapshotLabel: editInitial?.no
                  ? `Sửa "${editInitial?.name ?? row.name ?? row.no}"`
                  : `Thêm "${row.name ?? row.no}"`,
              });
            }
          }}
        />

        <p className="text-xs text-muted-foreground mt-3 px-1">
          Hiển thị <span className="font-semibold text-foreground">{filtered.length}</span> / {merged.length} sản phẩm
        </p>
      </section>

      <main className="container mx-auto px-4 md:px-6 py-6 flex-1 w-full">
        <ProductTable
          groupedProducts={grouped}
          overrides={overrides}
          unlocked={unlocked}
          actions={actions}
        />
        <ProductCardList
          groupedProducts={grouped}
          overrides={overrides}
          unlocked={unlocked}
          actions={actions}
        />
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
