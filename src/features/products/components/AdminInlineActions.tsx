import { useState } from "react";
import { Eye, EyeOff, Pencil, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { FlatProduct } from "@/data/desembreProducts";
import type { ProductOverrideRow } from "@/features/products/types";

type AdminInlineActionsProps = {
  product: FlatProduct;
  override?: ProductOverrideRow;
  /** Optimistic UI: cập nhật local ngay lập tức */
  onOptimisticUpdate: (no: number, patch: Partial<ProductOverrideRow>) => void;
  /** Callbacks để ProductTable (cha) kiểm soát trạng thái inline-edit */
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  isEditing: boolean;
};

export function AdminInlineActions({
  product,
  override,
  onOptimisticUpdate,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  isEditing,
}: AdminInlineActionsProps) {
  const isDeleted = override?.deleted ?? false;
  const [isSaving, setIsSaving] = useState(false);

  // ─── Ẩn / Hiện sản phẩm (Soft Delete toggle) ─────────────────────────────
  const handleToggleVisibility = async () => {
    const newDeleted = !isDeleted;

    // 1. Optimistic UI — cập nhật ngay lập tức
    onOptimisticUpdate(product.no, { deleted: newDeleted });

    // 2. Gửi request xuống DB ngầm
    const { error } = await supabase
      .from("product_overrides")
      .upsert({ no: product.no, deleted: newDeleted });

    if (error) {
      // Rollback nếu lỗi
      onOptimisticUpdate(product.no, { deleted: isDeleted });
      toast.error("Lỗi khi thay đổi trạng thái hiển thị.");
    } else {
      toast.success(newDeleted ? "Đã ẩn sản phẩm." : "Đã hiện sản phẩm.");
    }
  };

  // ─── Lưu chỉnh sửa nhanh tên / mô tả ─────────────────────────────────────
  const handleSaveEdit = async () => {
    if (isSaving) return;
    setIsSaving(true);
    // Gọi callback cha để thực hiện lưu (cha đã có editName/editDesc)
    onSaveEdit();
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col gap-1">
      {/* Nút ẩn/hiện */}
      <button
        type="button"
        onClick={handleToggleVisibility}
        title={isDeleted ? "Đang ẩn — bấm để hiện lại" : "Đang hiển thị — bấm để ẩn"}
        className={`w-7 h-7 inline-flex items-center justify-center rounded border transition-all duration-150 ${
          isDeleted
            ? "border-amber-400 text-amber-500 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100"
            : "border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground"
        }`}
      >
        {isDeleted ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>

      {/* Nút sửa nhanh */}
      {!isEditing ? (
        <button
          type="button"
          onClick={onStartEdit}
          title="Sửa nhanh tên & mô tả"
          className="w-7 h-7 inline-flex items-center justify-center rounded border border-border hover:bg-primary/10 hover:text-primary hover:border-primary text-muted-foreground transition-all duration-150"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={handleSaveEdit}
            disabled={isSaving}
            title="Lưu"
            className="w-7 h-7 inline-flex items-center justify-center rounded border border-green-400 bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 transition-all duration-150"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onCancelEdit}
            title="Hủy"
            className="w-7 h-7 inline-flex items-center justify-center rounded border border-border hover:bg-muted/50 text-muted-foreground transition-all duration-150"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  );
}

/**
 * Cell hiển thị tên + mô tả có thể chuyển sang inline edit.
 */
type AdminProductNameCellProps = {
  product: FlatProduct;
  override?: ProductOverrideRow;
  isEditing: boolean;
  editName: string;
  editDesc: string;
  onChangeName: (v: string) => void;
  onChangeDesc: (v: string) => void;
  onSave: () => void;
};

export function AdminProductNameCell({
  product,
  override,
  isEditing,
  editName,
  editDesc,
  onChangeName,
  onChangeDesc,
  onSave,
}: AdminProductNameCellProps) {
  if (!isEditing) {
    return (
      <>
        <div className="product-name">{override?.name ?? product.name}</div>
        <div className="product-desc">{override?.desc ?? product.desc}</div>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 py-1">
      <input
        autoFocus
        value={editName}
        onChange={(e) => onChangeName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSave()}
        className="w-full px-2 py-1 text-sm font-medium border border-primary/50 rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        placeholder="Tên sản phẩm..."
      />
      <textarea
        value={editDesc}
        onChange={(e) => onChangeDesc(e.target.value)}
        className="w-full px-2 py-1 text-xs text-muted-foreground border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
        rows={2}
        placeholder="Mô tả..."
      />
    </div>
  );
}
