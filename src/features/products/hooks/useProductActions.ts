import { useCallback, useState } from "react";
import { toast } from "sonner";
import { type FlatProduct } from "@/data/desembreProducts";
import { saveProductOverride, saveProductOrder } from "@/features/products/services/productOverrideService";
import { createDefaultOverride } from "@/features/products/utils/productTransforms";
import type {
  ProductOverrideRow as OverrideRow,
  ProductActionHandlers,
} from "@/features/products/types";
import type { ProductDialogInitial } from "@/features/products/types";

// Dependencies injected from parent so the hook stays pure and testable
export type UseProductActionsOptions = {
  overrides: Record<number, OverrideRow>;
  setOverrides: React.Dispatch<React.SetStateAction<Record<number, OverrideRow>>>;
  getPassword: () => string | null;
  snapshot: (no: number, prev: OverrideRow | undefined, label: string) => void;
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
  getPassword,
  snapshot,
  refreshOverrides,
}: UseProductActionsOptions): UseProductActionsReturn {
  const [editOpen, setEditOpen] = useState(false);
  const [editInitial, setEditInitial] = useState<ProductDialogInitial | null>(null);

  // ── Core helpers ──────────────────────────────────────────────────────────

  const upsertOverride = useCallback(
    (row: OverrideRow, options?: { snapshotLabel?: string }) => {
      if (options?.snapshotLabel) {
        snapshot(row.no, overrides[row.no], options.snapshotLabel);
      }
      setOverrides((p) => ({ ...p, [row.no]: row }));
    },
    [overrides, setOverrides, snapshot],
  );

  // ── Dialog openers ────────────────────────────────────────────────────────

  const openCreate = useCallback((currentSection: string) => {
    setEditInitial({ section: currentSection, name: "", desc: "" });
    setEditOpen(true);
  }, []);

  const openEdit = useCallback((p: FlatProduct) => {
    setEditInitial({ no: p.no, section: p.section, name: p.name, desc: p.desc });
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
    async (p: FlatProduct) => {
      const password = getPassword();
      if (!password) {
        toast.error("Cần mở khoá KEY");
        return;
      }
      if (!confirm(`Xoá sản phẩm "${p.name}"?`)) return;

      const prev = overrides[p.no];
      const isCustom = !!prev?.is_custom;

      if (isCustom) {
        const res = await saveProductOverride({ password, action: "hard_delete", no: p.no });
        if (!res.ok) return toast.error(res.error ?? "Xoá thất bại");
        snapshot(p.no, prev, `Xoá "${p.name}"`);
        setOverrides((prev2) => {
          const n = { ...prev2 };
          delete n[p.no];
          return n;
        });
      } else {
        const res = await saveProductOverride({ password, no: p.no, deleted: true });
        if (!res.ok || !res.row) return toast.error(res.error ?? "Xoá thất bại");
        upsertOverride(res.row, { snapshotLabel: `Xoá "${p.name}"` });
      }
      toast.success("Đã xoá — có thể hoàn tác");
    },
    [getPassword, overrides, setOverrides, snapshot, upsertOverride],
  );

  const onRenameSection = useCallback(
    async (oldTitle: string, rows: FlatProduct[]) => {
      const password = getPassword();
      if (!password) return toast.error("Cần mở khoá KEY");

      const next = window.prompt(`Đổi tên nhóm "${oldTitle}" thành:`, oldTitle);
      if (!next) return;
      const newTitle = next.trim();
      if (!newTitle || newTitle === oldTitle) return;

      toast.info(`Đang đổi tên ${rows.length} sản phẩm…`);
      let failed = 0;
      for (const r of rows) {
        const res = await saveProductOverride({ password, no: r.no, section: newTitle });
        if (!res.ok || !res.row) {
          failed++;
          continue;
        }
        upsertOverride(res.row, { snapshotLabel: `Đổi nhóm #${String(r.no).padStart(2, "0")}` });
      }
      if (failed) toast.error(`${failed} sản phẩm lỗi`);
      else toast.success(`Đã đổi nhóm thành "${newTitle}"`);
    },
    [getPassword, overrides, setOverrides, snapshot, upsertOverride],
  );

  const onReorderProduct = useCallback(
    async (section: string, orderedNos: number[]) => {
      const password = getPassword();
      if (!password) return toast.error("Cần mở khoá KEY");

      // Optimistically update frontend display first
      setOverrides((prev) => {
        const next = { ...prev };
        orderedNos.forEach((no, idx) => {
          next[no] = {
            ...(next[no] ?? createDefaultOverride(no)),
            sort_order: idx + 1,
            section,
          };
        });
        return next;
      });

      const res = await saveProductOrder({ password, section, ordered_nos: orderedNos });
      if (!res.ok || !res.rows) {
        toast.error(res.error ?? "Cập nhật thứ tự thất bại");
        // Revert overrides on failure
        refreshOverrides();
        return;
      }

      // Ghi snapshot cho từng sản phẩm bị đổi thứ tự
      res.rows!.forEach((row) => {
        snapshot(row.no, overrides[row.no], `Đổi thứ tự nhóm "${section}"`);
      });

      // Apply actual rows returned
      setOverrides((prev) => {
        const next = { ...prev };
        res.rows!.forEach((row) => {
          next[row.no] = row;
        });
        return next;
      });
      
      toast.success("Đã cập nhật thứ tự hiển thị!");
    },
    [getPassword, overrides, setOverrides, snapshot, refreshOverrides],
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
