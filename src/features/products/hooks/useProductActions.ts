import React, { useState, useCallback } from 'react';
import { toast } from "sonner";
import { type ProductViewModel } from "@/features/products/types";
import { saveProductOverride, saveProductOrder } from "@/features/products/services/productOverrideService";
import { createDefaultOverride } from "@/features/products/utils/productTransforms";
import type {
  ProductOverrideRow as OverrideRow,
  ProductActionHandlers,
} from "@/features/products/types";
import type { ProductDialogInitial } from "@/features/products/types";

// Dependencies injected from parent so the hook stays pure and testable
export type UseProductActionsOptions = {
  overrides: Record<string, OverrideRow>;
  setOverrides: React.Dispatch<React.SetStateAction<Record<string, OverrideRow>>>;
  snapshot: (id: string, prev: OverrideRow | undefined, label: string) => void;
  refreshOverrides: () => Promise<void>;
};

export type UseProductActionsReturn = {
  /** Merge a saved row into local overrides state and optionally record a snapshot */
  upsertOverride: (row: OverrideRow, options?: { snapshotLabel?: string }) => void;
  /** Controlled state for the edit dialog */
  editOpen: boolean;
  setEditOpen: (open: boolean) => void;
  editInitial: ProductDialogInitial | null;
  openCreate: (currentSection: string) => void;
  /** The actions object to pass to ProductTable / ProductCardList */
  actions: ProductActionHandlers;
};

export function useProductActions({
  overrides,
  setOverrides,
  snapshot,
  refreshOverrides,
}: UseProductActionsOptions): UseProductActionsReturn {
  const [editOpen, setEditOpen] = useState(false);
  const [editInitial, setEditInitial] = useState<ProductDialogInitial | null>(null);

  // ── Core helpers ──────────────────────────────────────────────────────────

  const upsertOverride = useCallback(
    (row: OverrideRow, options?: { snapshotLabel?: string }) => {
      if (options?.snapshotLabel) {
        snapshot(row.id, overrides[row.id], options.snapshotLabel);
      }
      setOverrides((prev) => ({ ...prev, [row.id]: row }));
    },
    [overrides, setOverrides, snapshot],
  );

  // ── Dialog openers ────────────────────────────────────────────────────────

  const openCreate = useCallback((currentSection: string) => {
    setEditInitial({ section: currentSection, name: "", desc: "" });
    setEditOpen(true);
  }, []);

  const openEdit = useCallback((p: ProductViewModel) => {
    setEditInitial({ id: p.id, section: p.section, name: p.name, desc: p.desc });
    setEditOpen(true);
  }, []);

  // ── Product mutation handlers ──────────────────────────────────────────────

  const onSetImage = useCallback(
    async (no: number, src: string | undefined) => {
      snapshot(no, overrides[no], `Ảnh #${String(no).padStart(2, "0")}`);
      setOverrides((p) => ({
        ...p,
        [no]: { ...(p[no] ?? createDefaultOverride(no)), image_url: src ?? null },
      }));
    },
    [overrides, setOverrides, snapshot],
  );

  const onSetLink = useCallback(
    async (no: number, href: string | undefined, isLink2?: boolean) => {
      const fieldName = isLink2 ? "link_url_2" : "link_url";
      const label = isLink2 ? `Liên kết 2 #${String(no).padStart(2, "0")}` : `Liên kết #${String(no).padStart(2, "0")}`;
      
      snapshot(no, overrides[no], label);
      setOverrides((p) => ({
        ...p,
        [no]: { ...(p[no] ?? createDefaultOverride(no)), [fieldName]: href ?? null },
      }));
    },
    [overrides, setOverrides, snapshot],
  );

  const onDelete = useCallback(
    async (p: ProductViewModel) => {
      if (!confirm(`Xoá sản phẩm "${p.name}"?`)) return;

      const prev = overrides[p.id];
      const isCustom = !!prev?.is_custom;

      if (isCustom) {
        const res = await saveProductOverride({ action: "hard_delete", productId: p.id });
        if (!res.ok) return toast.error(res.error ?? "Xoá thất bại");
        snapshot(p.id, prev, `Xoá "${p.name}"`);
        setOverrides((prev2) => {
          const n = { ...prev2 };
          delete n[p.id];
          return n;
        });
      } else {
        const res = await saveProductOverride({ productId: p.id, deleted: true });
        if (!res.ok || !res.row) return toast.error(res.error ?? "Xoá thất bại");
        upsertOverride(res.row, { snapshotLabel: `Xoá "${p.name}"` });
      }
      toast.success("Đã xoá — có thể hoàn tác");
    },
    [overrides, setOverrides, snapshot, upsertOverride],
  );

  const onRenameSection = useCallback(
    async (oldTitle: string, rows: ProductViewModel[]) => {
      const next = window.prompt(`Đổi tên nhóm "${oldTitle}" thành:`, oldTitle);
      if (!next) return;
      const newTitle = next.trim();
      if (!newTitle || newTitle === oldTitle) return;

      toast.info(`Đang đổi tên ${rows.length} sản phẩm…`);
      let failed = 0;
      for (const r of rows) {
        const res = await saveProductOverride({ productId: r.id, section: newTitle });
        if (!res.ok || !res.row) {
          failed++;
          continue;
        }
        upsertOverride(res.row, { snapshotLabel: `Đổi nhóm #${String(r.id).padStart(2, "0")}` });
      }
      if (failed) toast.error(`${failed} sản phẩm lỗi`);
      else toast.success(`Đã đổi nhóm thành "${newTitle}"`);
    },
    [upsertOverride],
  );

  const onReorderProduct = useCallback(
    async (section: string, orderedIds: string[]) => {
      const res = await saveProductOrder({
        section,
        ordered_ids: orderedIds,
      });
      if (!res.ok) {
        toast.error(res.error ?? "Lỗi lưu vị trí");
        return;
      }

      // Apply actual rows returned
      if (res.rows) {
        setOverrides((prev) => {
          const next = { ...prev };
          res.rows!.forEach((row) => {
            next[row.id] = row;
          });
          return next;
        });
      }
      
      toast.success("Đã cập nhật thứ tự hiển thị!");
    },
    [setOverrides],
  );

  // ── Compose actions object ────────────────────────────────────────────────

  const actions: ProductActionHandlers = {
    onSetImage,
    onSetLink,
    onEdit: openEdit,
    onDelete,
    onRenameSection,
    onReorderProduct,
  };

  return {
    upsertOverride,
    editOpen,
    setEditOpen,
    editInitial,
    openCreate,
    actions,
  };
}
