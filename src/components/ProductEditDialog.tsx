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
import { useEditUnlock } from "@/hooks/useEditUnlock";
import { saveProductOverride, type OverrideRow } from "@/lib/saveOverride";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export type ProductDialogInitial = {
  no?: number; // undefined => create new
  section: string;
  name: string;
  desc: string;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: ProductDialogInitial | null;
  sectionOptions: string[];
  onSaved: (row: OverrideRow) => void;
};

const ProductEditDialog = ({ open, onOpenChange, initial, sectionOptions, onSaved }: Props) => {
  const { getPassword } = useEditUnlock();
  const [section, setSection] = useState("");
  const [customSection, setCustomSection] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && initial) {
      const initSec = initial.section ?? "";
      const inList = initSec && sectionOptions.includes(initSec);
      setUseCustom(!!initSec && !inList);
      setSection(inList ? initSec : "");
      setCustomSection(!inList ? initSec : "");
      setName(initial.name ?? "");
      setDesc(initial.desc ?? "");
    }
  }, [open, initial, sectionOptions]);

  const finalSection = (useCustom ? customSection : section).trim();
  const isCreate = !initial?.no;

  const submit = async () => {
    if (!name.trim() || !finalSection) {
      toast.error("Vui lòng nhập tên và nhóm sản phẩm");
      return;
    }
    const password = getPassword();
    if (!password) {
      toast.error("Cần mở khoá KEY");
      return;
    }
    setSaving(true);
    const res = await saveProductOverride({
      password,
      action: isCreate ? "create" : "upsert",
      no: isCreate ? undefined : initial!.no,
      section: finalSection,
      name: name.trim(),
      desc: desc.trim(),
    });
    setSaving(false);
    if (!res.ok || !res.row) {
      toast.error(res.error ?? "Lưu thất bại");
      return;
    }
    toast.success(isCreate ? "Đã thêm sản phẩm" : "Đã cập nhật");
    onSaved(res.row);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isCreate ? "Thêm sản phẩm mới" : "Chỉnh sửa sản phẩm"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Nhóm sản phẩm (Section)</Label>
            {useCustom ? (
              <div className="flex gap-2">
                <Input
                  value={customSection}
                  onChange={(e) => setCustomSection(e.target.value)}
                  placeholder="Nhập tên nhóm mới (VD: SERUM)"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setUseCustom(false);
                    setCustomSection("");
                  }}
                >
                  Chọn từ danh sách
                </Button>
              </div>
            ) : (
              <Select
                value={section}
                onValueChange={(v) => {
                  if (v === "__new__") {
                    setUseCustom(true);
                    setSection("");
                  } else {
                    setSection(v);
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
          <div>
            <Label className="text-xs">Tên sản phẩm</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Mô tả</Label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
          </div>
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
