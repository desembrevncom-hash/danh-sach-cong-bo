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
  accessToken: string | null;
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
  accessToken,
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
      if (!accessToken) {
        toast.error("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
        return;
      }
      
      const prev = overrides[p.id];
      const isCustom = !!prev?.is_custom;

      // When soft deleting or restoring, always pass the full payload per user requirement
      const actionLabel = prev?.deleted ? "Khôi phục" : "Xoá mềm";
      const confirmMessage = prev?.deleted ? `Khôi phục sản phẩm "${p.name}"?` : `Xoá sản phẩm "${p.name}"?`;
      
      if (!confirm(confirmMessage)) return;

      if (isCustom) {
        const res = await saveProductOverride({ action: "hard_delete", productId: p.id }, accessToken);
        if (!res.ok) return toast.error(res.error ?? "Xoá thất bại");
        snapshot(p.id, prev, `Xoá "${p.name}"`);
        setOverrides((prev2) => {
          const n = { ...prev2 };
          delete n[p.id];
          return n;
        });
        toast.success("Đã xoá thành công!");
      } else {
        const payload = {
          productId: p.id,
          brand: p.brand,
          section: p.section,
          name: p.name,
          desc: p.desc,
          imageUrl: p.image_url,
          linkUrl: p.link_url,
          linkUrl2: p.link_url_2,
          deleted: !prev?.deleted // toggle the deleted state
        };
        const res = await saveProductOverride(payload, accessToken);
        if (!res.ok || !res.row) return toast.error(res.error ?? `${actionLabel} thất bại`);
        upsertOverride(res.row, { snapshotLabel: `${actionLabel} "${p.name}"` });
        toast.success(`Đã ${actionLabel.toLowerCase()} sản phẩm`);
      }
      
      // refresh products after save
      refreshOverrides();
    },
    [overrides, setOverrides, snapshot, upsertOverride, accessToken, refreshOverrides],
  );

  const onRenameSection = useCallback(
    async (oldTitle: string, rows: ProductViewModel[]) => {
      if (!accessToken) {
        toast.error("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
        return;
      }
      const next = window.prompt(`Đổi tên nhóm "${oldTitle}" thành:`, oldTitle);
      if (!next) return;
      const newTitle = next.trim();
      if (!newTitle || newTitle === oldTitle) return;

      toast.info(`Đang đổi tên ${rows.length} sản phẩm…`);
      let failed = 0;
      for (const r of rows) {
        const payload = {
          productId: r.id,
          brand: r.brand,
          section: newTitle,
          name: r.name,
          desc: r.desc,
          imageUrl: r.image_url,
          linkUrl: r.link_url,
          linkUrl2: r.link_url_2,
          deleted: r.deleted
        };
        const res = await saveProductOverride(payload, accessToken);
        if (!res.ok || !res.row) {
          failed++;
          continue;
        }
        upsertOverride(res.row, { snapshotLabel: `Đổi nhóm #${String(r.id).padStart(2, "0")}` });
      }
      if (failed) toast.error(`${failed} sản phẩm lỗi`);
      else toast.success(`Đã đổi nhóm thành "${newTitle}"`);
      
      refreshOverrides();
    },
    [upsertOverride, accessToken, refreshOverrides],
  );

  const onReorderProduct = useCallback(
    async (section: string, orderedIds: string[]) => {
      if (!accessToken) {
        toast.error("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
        return;
      }
      const res = await saveProductOrder({
        section,
        ordered_ids: orderedIds,
      }, accessToken);
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
      refreshOverrides();
    },
    [setOverrides, accessToken, refreshOverrides],
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
