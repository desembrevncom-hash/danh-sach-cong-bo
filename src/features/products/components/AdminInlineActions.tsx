import { useState } from "react";
import { Eye, EyeOff, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ProductViewModel } from "@/features/products/types";
import type { ProductOverrideRow } from "@/features/products/types";
import { AdminEditModal } from "@/features/products/components/AdminEditModal";

type AdminInlineActionsProps = {
  product: ProductViewModel;
  override?: ProductOverrideRow;
  /** Optimistic UI: cập nhật local ngay lập tức */
  onOptimisticUpdate: (no: number, patch: Partial<ProductOverrideRow>) => void;
  // Các props inline-edit cũ vẫn giữ để ProductTable không bị lỗi — nhưng modal tự quản lý
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  isEditing: boolean;
};

export function AdminInlineActions({
  product,
  override,
  onOptimisticUpdate,
}: AdminInlineActionsProps) {
  const isDeleted = override?.deleted ?? false;
  const [modalOpen, setModalOpen] = useState(false);

  // ─── Ẩn / Hiện sản phẩm (Soft Delete toggle) ─────────────────────────────
  const handleToggleVisibility = async () => {
    const newDeleted = !isDeleted;

    // 1. Optimistic UI — cập nhật ngay lập tức
    onOptimisticUpdate(product.id, { deleted: newDeleted });

    // 2. Gửi request xuống DB ngầm
    const { error } = await supabase
      .from("product_overrides")
      .upsert({ no: product.id, deleted: newDeleted });

    if (error) {
      // Rollback nếu lỗi
      onOptimisticUpdate(product.id, { deleted: isDeleted });
      toast.error("Lỗi khi thay đổi trạng thái hiển thị.");
    } else {
      toast.success(newDeleted ? "Đã ẩn sản phẩm." : "Đã hiện sản phẩm.");
    }
  };

  return (
    <>
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

        {/* Nút mở Modal sửa nâng cao */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          title="Sửa sản phẩm nâng cao"
          className="w-7 h-7 inline-flex items-center justify-center rounded border border-border hover:bg-primary/10 hover:text-primary hover:border-primary text-muted-foreground transition-all duration-150"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Modal sửa đầy đủ thông tin */}
      <AdminEditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        product={product}
        override={override}
        onOptimisticUpdate={onOptimisticUpdate}
      />
    </>
  );
}
