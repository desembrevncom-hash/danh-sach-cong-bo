import { Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { sections, type FlatProduct } from "@/data/desembreProducts";
import ProductImageCell from "@/features/products/components/ProductImageCell";
import ProductLinkCell from "@/features/products/components/ProductLinkCell";
import type { ProductOverrideRow, ProductActionHandlers } from "@/features/products/types";

export type ProductCardListProps = {
  groupedProducts: [string, FlatProduct[]][];
  overrides: Record<number, ProductOverrideRow>;
  unlocked: boolean;
  actions: ProductActionHandlers;
};

export function ProductCardList({
  groupedProducts,
  overrides,
  unlocked,
  actions,
}: ProductCardListProps) {
  return (
    <div className="md:hidden space-y-3">
      {groupedProducts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Không tìm thấy sản phẩm phù hợp.
        </div>
      )}
      {(() => {
        let seq = 0;
        return groupedProducts.map(([sectionTitle, rows]) => {
          const sec = sections.find((s) => s.title === sectionTitle);
          return (
            <div key={sectionTitle}>
              {/* Section Header */}
              <div className="flex items-center gap-2 mb-3 mt-4">
                <div className="flex-1 h-[1px] bg-border" />
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ background: "hsl(var(--header-bg))", color: "hsl(var(--header-text))" }}>
                  <span className="text-xs font-black uppercase tracking-widest">{sectionTitle}</span>
                  {unlocked && (
                    <button
                      type="button"
                      onClick={() => actions.onRenameSection(sectionTitle, rows)}
                      title="Đổi tên nhóm"
                      className="opacity-60 hover:opacity-100 transition"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="flex-1 h-[1px] bg-border" />
              </div>
              {sec?.vi && (
                <p className="text-center text-xs text-muted-foreground mb-3 -mt-1">{sec.vi}</p>
              )}

              {/* Product Cards */}
              {rows.map((row, rowIdx) => {
                seq += 1;
                const currentSeq = seq;
                const isEven = rowIdx % 2 === 1;
                return (
                  <div key={row.no}
                    className="border border-border rounded-xl shadow-sm mb-2 overflow-hidden"
                    style={{ background: isEven ? "hsl(var(--row-alt))" : "hsl(var(--card))" }}>
                    <div className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-xs font-bold bg-foreground text-background px-2 py-0.5 rounded-md self-start">
                          #{String(currentSeq).padStart(2, "0")}
                        </div>
                        {unlocked && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (rowIdx > 0) {
                                  const next = [...rows];
                                  [next[rowIdx - 1], next[rowIdx]] = [next[rowIdx], next[rowIdx - 1]];
                                  actions.onReorderProduct(sectionTitle, next.map(r => r.no));
                                }
                              }}
                              disabled={rowIdx === 0}
                              className="w-7 h-7 inline-flex items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-accent/20 disabled:opacity-30 disabled:pointer-events-none"
                              title="Lên trên"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (rowIdx < rows.length - 1) {
                                  const next = [...rows];
                                  [next[rowIdx], next[rowIdx + 1]] = [next[rowIdx + 1], next[rowIdx]];
                                  actions.onReorderProduct(sectionTitle, next.map(r => r.no));
                                }
                              }}
                              disabled={rowIdx === rows.length - 1}
                              className="w-7 h-7 inline-flex items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-accent/20 disabled:opacity-30 disabled:pointer-events-none"
                              title="Xuống dưới"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => actions.onEdit(row)}
                              className="w-7 h-7 inline-flex items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-accent/20"
                              title="Chỉnh sửa"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => actions.onDelete(row)}
                              className="w-7 h-7 inline-flex items-center justify-center rounded-full border border-border bg-background shadow-sm text-destructive hover:bg-destructive/10"
                              title="Xoá"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-4">
                        <div className="w-28 flex-shrink-0">
                          <ProductImageCell
                            productNo={row.no}
                            src={overrides[row.no]?.image_url ?? undefined}
                            onChange={(src) => actions.onSetImage(row.no, src)}
                            mobile
                          />
                        </div>
                        <div className="flex-1 pt-1 min-w-0">
                          <div className="font-semibold text-[15px] leading-snug text-foreground mb-1.5">
                            {row.name}
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-3 leading-5 mb-3">
                            {row.desc}
                          </div>
                          <div className="pt-2 border-t border-border mt-3 flex flex-wrap gap-1.5">
                            <ProductLinkCell
                              productNo={row.no}
                              href={row.link}
                              onChange={(href) => actions.onSetLink(row.no, href, false)}
                              mobile
                            />
                            {(unlocked || row.link2) && (
                              <ProductLinkCell
                                productNo={row.no}
                                href={row.link2}
                                onChange={(href) => actions.onSetLink(row.no, href, true)}
                                label="Link 2"
                                variant="secondary"
                                mobile
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        });
      })()}
    </div>
  );
}
