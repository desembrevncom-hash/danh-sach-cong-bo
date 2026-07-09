import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEditUnlock } from "@/features/edit-unlock/hooks/useEditUnlock";
import { saveProductOverride } from "@/features/products/services/productOverrideService";
import type { ProductOverrideRow as OverrideRow, ProductDialogInitial } from "@/features/products/types";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { ProductViewModel } from "@/features/products/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type { ProductDialogInitial };

export type ProductEditDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: ProductDialogInitial | null;
  sectionOptions: string[];
  groupedProducts?: [string, ProductViewModel[]][];
  onSaved: (row: OverrideRow, insertAfterNo?: number) => void;
};

// ─── Form state ───────────────────────────────────────────────────────────────

type FormState = {
  /** String representation of the product number; only editable in edit mode */
  no: string;
  /** Selected section from dropdown */
  section: string;
  /** Free-text section when user picks "add new group" */
  customSection: string;
  /** Whether the user is typing a new section name */
  useCustom: boolean;
  name: string;
  desc: string;
};

function buildFormState(
  initial: ProductDialogInitial,
  sectionOptions: string[],
): FormState {
  const initSec = initial.section ?? "";
  const inList = initSec && sectionOptions.includes(initSec);
  return {
    no: initial.id != null ? String(initial.id) : "",
    section: inList ? initSec : "",
    customSection: !inList ? initSec : "",
    useCustom: !!initSec && !inList,
    name: initial.name ?? "",
    desc: initial.desc ?? "",
  };
}

const EMPTY_FORM: FormState = {
  no: "",
  section: "",
  customSection: "",
  useCustom: false,
  name: "",
  desc: "",
};

// ─── Component ────────────────────────────────────────────────────────────────

const ProductEditDialog = ({
  open,
  onOpenChange,
  initial,
  sectionOptions,
  groupedProducts,
  onSaved,
}: ProductEditDialogProps) => {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [insertPos, setInsertPos] = useState<number>(-2); // -2: end, -1: start, others: after product no
  const [saving, setSaving] = useState(false);

  // Reset form whenever the dialog opens or initial data changes
  useEffect(() => {
    if (open && initial) {
      setForm(buildFormState(initial, sectionOptions));
      setInsertPos(-2); // reset to end
    }
  }, [open, initial, sectionOptions]);

  const finalSection = (form.useCustom ? form.customSection : form.section).trim();
  const isCreate = !initial?.id;

  // ── Submit ──────────────────────────────────────────────────────────────────

  const submit = async () => {
    if (!form.name.trim() || !finalSection) {
      toast.error("Vui lòng nhập tên và nhóm sản phẩm");
      return;
    }

    setSaving(true);
    const res = await saveProductOverride({
      action: isCreate ? "create" : "upsert",
      productId: isCreate ? undefined : initial!.id,
      section: finalSection,
      name: form.name.trim(),
      desc: form.desc.trim(),
    });
    setSaving(false);

    if (!res.ok || !res.row) {
      toast.error(res.error ?? "Lưu thất bại");
      return;
    }

    toast.success(isCreate ? "Đã thêm sản phẩm" : "Đã cập nhật");
    onSaved(res.row, isCreate ? insertPos : undefined);
    onOpenChange(false);
  };

  const currentSectionProducts = groupedProducts?.find(g => g[0] === finalSection)?.[1] || [];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isCreate ? "Thêm sản phẩm mới" : "Chỉnh sửa sản phẩm"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Info showing immutable ID in edit mode */}
          {!isCreate && (
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              Mã định danh sản phẩm (No): <span className="font-semibold text-foreground">{form.id}</span> (Không thể thay đổi)
            </div>
          )}

          {/* Section picker */}
          <div>
            <Label className="text-xs">Nhóm sản phẩm (Section)</Label>
            {form.useCustom ? (
              <div className="flex gap-2">
                <Input
                  value={form.customSection}
                  onChange={(e) => setForm({ ...form, customSection: e.target.value })}
                  placeholder="Nhập tên nhóm mới (VD: SERUM)"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setForm({ ...form, useCustom: false, customSection: "" })}
                >
                  Chọn từ danh sách
                </Button>
              </div>
            ) : (
              <Select
                value={form.section}
                onValueChange={(v) => {
                  if (v === "__new__") {
                    setForm({ ...form, useCustom: true, section: "" });
                  } else {
                    setForm({ ...form, section: v });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhóm sản phẩm" />
                </SelectTrigger>
                <SelectContent>
                  {sectionOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                  <SelectItem value="__new__">+ Thêm nhóm mới…</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Name */}
          <div>
            <Label className="text-xs">Tên sản phẩm</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* Description */}
          <div>
            <Label className="text-xs">Mô tả</Label>
            <Textarea
              value={form.desc}
              onChange={(e) => setForm({ ...form, desc: e.target.value })}
              rows={3}
            />
          </div>

          {/* Insert Position (Only Create) */}
          {isCreate && finalSection && currentSectionProducts.length > 0 && (
            <div>
              <Label className="text-xs">Vị trí thêm (Tuỳ chọn)</Label>
              <Select
                value={String(insertPos)}
                onValueChange={(v) => setInsertPos(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn vị trí thêm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-2">Thêm vào cuối danh sách</SelectItem>
                  <SelectItem value="-1">Thêm vào đầu danh sách</SelectItem>
                  {currentSectionProducts.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      Thêm vào sau "{p.name}"
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isCreate ? "Thêm" : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductEditDialog;
