import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadProductImage } from "@/features/products/utils/upload";
import { toast } from "sonner";
import { Image as ImageIcon } from "lucide-react";
import { sections } from "@/data/desembreProducts";
import type { ProductViewModel } from "@/features/products/types";
import type { ProductOverrideRow } from "@/features/products/types";

type AdminEditModalProps = {
  open: boolean;
  onClose: () => void;
  product: ProductViewModel;
  override?: ProductOverrideRow;
  onOptimisticUpdate: (no: number, patch: Partial<ProductOverrideRow>) => void;
};

export function AdminEditModal({
  open,
  onClose,
  product,
  override,
  onOptimisticUpdate,
}: AdminEditModalProps) {
  const currentName    = override?.name      ?? product.name    ?? "";
  const currentDesc    = override?.desc      ?? product.desc    ?? "";
  const currentSection = override?.section   ?? product.section ?? sections[0]?.title ?? "";
  const currentLinkUrl = override?.link_url  ?? product.link    ?? "";
  const currentLinkUrl2= override?.link_url_2?? product.link2   ?? "";
  const currentImageUrl= override?.image_url ?? product.image   ?? "";

  const [name,    setName]    = useState(currentName);
  const [desc,    setDesc]    = useState(currentDesc);
  const [section, setSection] = useState(currentSection);
  const [linkUrl, setLinkUrl] = useState(currentLinkUrl);
  const [linkUrl2,setLinkUrl2]= useState(currentLinkUrl2);
  const [imageUrl,setImageUrl]= useState(currentImageUrl);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!open) return null;

  // Validate file ngay khi chọn
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { setImageFile(null); return; }
    const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!ALLOWED.includes(file.type)) {
      toast.error("Chỉ hỗ trợ .jpg, .jpeg, .png, .webp");
      e.target.value = ""; setImageFile(null); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File vượt quá 5MB");
      e.target.value = ""; setImageFile(null); return;
    }
    setImageFile(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);

    try {
      let finalImageUrl = imageUrl;

      // Upload ảnh mới nếu có
      if (imageFile) {
        const res = await uploadProductImage(imageFile);
        if (res.error) { toast.error(res.error); setIsSaving(false); return; }
        if (res.url) finalImageUrl = res.url;
      }

      const patch: Partial<ProductOverrideRow> = {
        name:      name.trim()    || product.name,
        desc:      desc.trim()    || product.desc,
        section:   section        || product.section,
        link_url:  linkUrl.trim() || null,
        link_url_2:linkUrl2.trim()|| null,
        image_url: finalImageUrl  || null,
      };

      // 1. Optimistic UI — cập nhật ngay
      onOptimisticUpdate(product.id, patch);
      onClose();

      // 2. Ghi xuống DB
      const { error } = await supabase
        .from("product_overrides")
        .upsert({ no: product.id, ...patch });

      if (error) {
        toast.error("Lỗi khi lưu: " + error.message);
      } else {
        toast.success(`Đã lưu sản phẩm "${patch.name}" thành công!`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => !isSaving && onClose()}
      />

      {/* Modal */}
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg z-10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-border flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-bold text-base">Sửa sản phẩm nâng cao</h3>
            <p className="text-xs text-muted-foreground mt-0.5">#{product.id} · {currentSection}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="text-muted-foreground hover:text-foreground text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted/50 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSave} className="overflow-y-auto p-4 md:p-5 space-y-4 flex-1">
          {/* Tên sản phẩm */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Tên sản phẩm <span className="text-destructive">*</span>
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none"
              placeholder="Nhập tên sản phẩm..."
            />
          </div>

          {/* Nhóm sản phẩm */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nhóm sản phẩm</label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none"
            >
              {sections.map((s) => (
                <option key={s.title} value={s.title}>
                  {s.title}{s.vi ? ` — ${s.vi}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Mô tả */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Mô tả</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none resize-y"
              placeholder="Mô tả ngắn về sản phẩm..."
            />
          </div>

          {/* Links */}
          <div className="grid grid-cols-1 gap-3 pt-1 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-1">Đường dẫn công bố</p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Link công bố 1</label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none"
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Link công bố 2 <span className="text-muted-foreground text-xs">(tuỳ chọn)</span></label>
              <input
                type="url"
                value={linkUrl2}
                onChange={(e) => setLinkUrl2(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Hình ảnh */}
          <div className="space-y-2 pt-1 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-1">Hình ảnh sản phẩm</p>
            <div className="flex items-center gap-4">
              {/* Preview */}
              <div className="w-20 h-20 rounded-md border border-border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
                {imageFile ? (
                  <img src={URL.createObjectURL(imageFile)} alt="preview" className="w-full h-full object-cover" />
                ) : imageUrl ? (
                  <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-7 h-7 text-muted-foreground/40" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors"
                />
                <p className="text-xs text-muted-foreground mt-1.5">JPG, PNG, WEBP · Tối đa 5MB</p>
                {imageUrl && !imageFile && (
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="text-xs text-destructive hover:underline mt-1"
                  >
                    Xóa ảnh hiện tại
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Footer buttons */}
        <div className="p-4 md:p-5 border-t border-border bg-muted/20 flex justify-end gap-2 rounded-b-xl shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium rounded-md border border-input hover:bg-muted/50 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            form=""
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 bg-primary text-primary-foreground font-semibold text-sm rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang lưu...
              </>
            ) : "Lưu sản phẩm"}
          </button>
        </div>
      </div>
    </div>
  );
}
