import { useState } from "react";
import { Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { sections, type FlatProduct } from "@/data/desembreProducts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ProductImageCell from "@/features/products/components/ProductImageCell";
import ProductLinkCell from "@/features/products/components/ProductLinkCell";
import type { ProductOverrideRow, ProductActionHandlers } from "@/features/products/types";
import { AdminInlineActions } from "@/features/products/components/AdminInlineActions";

export type ProductTableProps = {
  groupedProducts: [string, FlatProduct[]][];
  overrides: Record<number, ProductOverrideRow>;
  unlocked: boolean;
  actions: ProductActionHandlers;
  isAdmin?: boolean;
  onAdminOptimisticUpdate?: (no: number, patch: Partial<ProductOverrideRow>) => void;
};

export function ProductTable({
  groupedProducts,
  overrides,
  unlocked,
  actions,
  isAdmin = false,
  onAdminOptimisticUpdate,
}: ProductTableProps) {
  const [productToDelete, setProductToDelete] = useState<FlatProduct | null>(null);
  // Tracking which row is in inline-edit mode
  const [editingNo, setEditingNo] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  return (
    <>
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
              {isAdmin && !unlocked && <th style={{ width: "70px" }}>⚙</th>}
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
                        {isAdmin && editingNo === row.no ? (
                          <div className="flex flex-col gap-1.5 py-1">
                            <input
                              autoFocus
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  onAdminOptimisticUpdate?.(row.no, { name: editName.trim(), desc: editDesc.trim() });
                                  setEditingNo(null);
                                }
                                if (e.key === "Escape") setEditingNo(null);
                              }}
                              className="w-full px-2 py-1 text-sm font-medium border border-primary/50 rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                              placeholder="Tên sản phẩm..."
                            />
                            <textarea
                              value={editDesc}
                              onChange={(e) => setEditDesc(e.target.value)}
                              className="w-full px-2 py-1 text-xs text-muted-foreground border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                              rows={2}
                              placeholder="Mô tả..."
                            />
                          </div>
                        ) : (
                          <>
                            <div className="product-name">{overrides[row.no]?.name ?? row.name}</div>
                            <div className="product-desc">{overrides[row.no]?.desc ?? row.desc}</div>
                          </>
                        )}
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
                              className="w-7 h-7 inline-flex items-center justify-center rounded border border-border hover:bg-accent/20 disabled:opacity-30 disabled:pointer-events-none transition-all duration-150"
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
                              className="w-7 h-7 inline-flex items-center justify-center rounded border border-border hover:bg-accent/20 disabled:opacity-30 disabled:pointer-events-none transition-all duration-150"
                              title="Xuống dưới"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => actions.onEdit(row)}
                              className="w-7 h-7 inline-flex items-center justify-center rounded border border-border hover:bg-accent/20 transition-all duration-150"
                              title="Chỉnh sửa"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setProductToDelete(row)}
                              className="w-7 h-7 inline-flex items-center justify-center rounded border border-border text-destructive hover:bg-destructive/10 transition-all duration-150"
                              title="Xoá"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                      {/* Cột Admin Inline Actions — chỉ hiện khi isAdmin và KHÔNG ở chế độ unlock KEY cũ */}
                      {isAdmin && !unlocked && (
                        <td className="text-center">
                          <AdminInlineActions
                            product={row}
                            override={overrides[row.no]}
                            onOptimisticUpdate={(no, patch) => {
                              // Nếu đang edit inline thì sync state
                              if (patch.name !== undefined) setEditName(patch.name as string);
                              if (patch.desc !== undefined) setEditDesc(patch.desc as string);
                              if (patch.name !== undefined || patch.desc !== undefined) setEditingNo(null);
                              onAdminOptimisticUpdate?.(no, patch);
                            }}
                            onStartEdit={() => {
                              setEditName(overrides[row.no]?.name ?? row.name ?? "");
                              setEditDesc(overrides[row.no]?.desc ?? row.desc ?? "");
                              setEditingNo(row.no);
                            }}
                            onSaveEdit={() => {
                              onAdminOptimisticUpdate?.(row.no, { name: editName.trim(), desc: editDesc.trim() });
                              setEditingNo(null);
                            }}
                            onCancelEdit={() => setEditingNo(null)}
                            isEditing={editingNo === row.no}
                          />
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

      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa sản phẩm?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa sản phẩm <strong className="text-foreground">{productToDelete?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (productToDelete) {
                  actions.onDelete(productToDelete);
                  setProductToDelete(null);
                }
              }}
            >
              Xóa sản phẩm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
