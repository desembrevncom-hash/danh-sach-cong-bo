import { Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { sections, type FlatProduct } from "@/data/desembreProducts";
import ProductImageCell from "@/features/products/components/ProductImageCell";
import ProductLinkCell from "@/features/products/components/ProductLinkCell";
import type { ProductOverrideRow, ProductActionHandlers } from "@/features/products/types";

export type ProductTableProps = {
  groupedProducts: [string, FlatProduct[]][];
  overrides: Record<number, ProductOverrideRow>;
  unlocked: boolean;
  actions: ProductActionHandlers;
};

export function ProductTable({
  groupedProducts,
  overrides,
  unlocked,
  actions,
}: ProductTableProps) {
  return (
    <div className="hidden md:block bg-card rounded-lg shadow-sm border border-border overflow-hidden mx-auto" style={{ maxWidth: "95%" }}>
      <div className="table-wrap">
        <table className="product-table">
          <thead>
            <tr>
              <th style={{ width: "150px" }}>Section</th>
              <th style={{ width: "70px" }}>No.</th>
              <th style={{ width: "120px" }}>Hình ảnh</th>
              <th>Product</th>
              <th style={{ width: "120px" }}>Công bố</th>
              {unlocked && <th style={{ width: "90px" }}>Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {groupedProducts.length === 0 && (
              <tr>
                <td colSpan={unlocked ? 6 : 5} className="text-center py-12 text-muted-foreground text-sm">
                  Không tìm thấy sản phẩm phù hợp.
                </td>
              </tr>
            )}
            {(() => {
              let seq = 0;
              return groupedProducts.map(([sectionTitle, rows]) =>
                rows.map((row, idx) => {
                  seq += 1;
                  const sec = sections.find((s) => s.title === sectionTitle);
                  return (
                    <tr key={row.no}>
                      {idx === 0 && (
                        <td rowSpan={rows.length} className="section-cell">
                          <div className="inline-flex items-center gap-1.5">
                            <span>{sectionTitle}</span>
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
                          {sec?.vi && (
                            <div className="text-[11px] font-normal text-muted-foreground mt-1 normal-case tracking-normal">
                              {sec.vi}
                            </div>
                          )}
                        </td>
                      )}
                      <td className="text-center font-semibold text-foreground">
                        {String(seq).padStart(2, "0")}
                      </td>
                      <td className="overflow-visible">
                        <ProductImageCell
                          productNo={row.no}
                          src={overrides[row.no]?.image_url ?? undefined}
                          onChange={(src) => actions.onSetImage(row.no, src)}
                        />
                      </td>
                      <td>
                        <div className="product-name">{row.name}</div>
                        <div className="product-desc">{row.desc}</div>
                      </td>
                      <td className="text-center overflow-visible">
                        <div className="flex flex-col gap-1 items-center justify-center">
                          <ProductLinkCell
                            productNo={row.no}
                            href={row.link}
                            onChange={(href) => actions.onSetLink(row.no, href, false)}
                          />
                          {(unlocked || row.link2) && (
                            <ProductLinkCell
                              productNo={row.no}
                              href={row.link2}
                              onChange={(href) => actions.onSetLink(row.no, href, true)}
                              label="Link 2"
                              variant="secondary"
                            />
                          )}
                        </div>
                      </td>
                      {unlocked && (
                        <td className="text-center">
                          <div className="inline-flex gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (idx > 0) {
                                  const next = [...rows];
                                  [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                                  actions.onReorderProduct(sectionTitle, next.map(r => r.no));
                                }
                              }}
                              disabled={idx === 0}
                              className="w-7 h-7 inline-flex items-center justify-center rounded border border-border hover:bg-accent/20 disabled:opacity-30 disabled:pointer-events-none"
                              title="Lên trên"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (idx < rows.length - 1) {
                                  const next = [...rows];
                                  [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                                  actions.onReorderProduct(sectionTitle, next.map(r => r.no));
                                }
                              }}
                              disabled={idx === rows.length - 1}
                              className="w-7 h-7 inline-flex items-center justify-center rounded border border-border hover:bg-accent/20 disabled:opacity-30 disabled:pointer-events-none"
                              title="Xuống dưới"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => actions.onEdit(row)}
                              className="w-7 h-7 inline-flex items-center justify-center rounded border border-border hover:bg-accent/20"
                              title="Chỉnh sửa"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => actions.onDelete(row)}
                              className="w-7 h-7 inline-flex items-center justify-center rounded border border-border text-destructive hover:bg-destructive/10"
                              title="Xoá"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                }),
              );
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}
