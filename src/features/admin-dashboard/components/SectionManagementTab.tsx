import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, RefreshCw, Check, X, ArrowUp, ArrowDown } from "lucide-react";
import { resolveBrandId, type BrandId } from "@/config/brands";

interface SectionRow {
  id: string;
  brand: string;
  value: string;
  label: string;
  description: string | null;
  sort_order: number;
  active: boolean;
  total_count?: number; // Fetched from RPC
}

export function SectionManagementTab({ activeBrand }: { activeBrand: BrandId }) {
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form states
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SectionRow>>({});
  const [isAdding, setIsAdding] = useState(false);

  const fetchSections = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch raw catalog_sections to get full details (description, id, etc.)
      const { data: dbSections, error: dbError } = await supabase
        .from("catalog_sections")
        .select("*")
        .eq("brand", activeBrand)
        .order("sort_order", { ascending: true });

      if (dbError) throw dbError;

      // 2. Fetch RPC to get total_count
      const { data: rpcSections, error: rpcError } = await supabase.rpc("get_catalog_sections", {
        brand_id: activeBrand,
        include_hidden: true
      });

      if (rpcError) throw rpcError;

      // Merge data
      const merged = (dbSections || []).map(sec => {
        const rpc = rpcSections?.find(r => r.section === sec.value);
        return {
          ...sec,
          total_count: rpc?.total_count || 0
        } as SectionRow;
      });

      // Also append sections that exist in products but NOT in catalog_sections (from RPC fallback)
      const existingValues = new Set(merged.map(s => s.value));
      const fallbackSections = (rpcSections || [])
        .filter(r => !existingValues.has(r.section))
        .map(r => ({
          id: `fallback-${r.section}`,
          brand: activeBrand,
          value: r.section,
          label: r.label || r.section,
          description: "(Nhóm tự động tạo từ sản phẩm)",
          sort_order: r.sort_order || 9999,
          active: true,
          total_count: r.total_count || 0
        }));

      setSections([...merged, ...fallbackSections].sort((a, b) => a.sort_order - b.sort_order));
    } catch (e: unknown) {
      const err = e as Error;
      console.error("Fetch sections error:", err);
      toast.error("Lỗi tải danh sách nhóm: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, [activeBrand]);

  const handleSaveEdit = async (id: string) => {
    try {
      if (!editForm.label?.trim() || !editForm.value?.trim()) {
        toast.error("Tên nhóm và Mã nhóm không được để trống");
        return;
      }
      
      const valueToSave = editForm.value.trim().toUpperCase();

      if (id === "NEW") {
        const { error } = await supabase.from("catalog_sections").insert({
          brand: activeBrand,
          label: editForm.label.trim(),
          value: valueToSave,
          description: editForm.description || null,
          sort_order: editForm.sort_order || 0,
          active: editForm.active ?? true
        });
        if (error) throw error;
        toast.success("Thêm nhóm thành công");
      } else {
        if (id.startsWith("fallback-")) {
          // Promote fallback to real row
          const { error } = await supabase.from("catalog_sections").insert({
            brand: activeBrand,
            label: editForm.label.trim(),
            value: valueToSave,
            description: editForm.description || null,
            sort_order: editForm.sort_order || 0,
            active: editForm.active ?? true
          });
          if (error) throw error;
        } else {
          // Update existing
          const { error } = await supabase.from("catalog_sections").update({
            label: editForm.label.trim(),
            value: valueToSave,
            description: editForm.description || null,
            sort_order: editForm.sort_order || 0,
            active: editForm.active ?? true
          }).eq("id", id);
          if (error) throw error;
        }
        toast.success("Cập nhật nhóm thành công");
      }
      setIsEditing(null);
      setIsAdding(false);
      fetchSections();
    } catch (error: unknown) {
      console.error(error);
      toast.error((error as Error).message);
    }
  };

  const toggleActive = async (sec: SectionRow) => {
    if (sec.id.startsWith("fallback-")) {
      toast.error("Vui lòng chỉnh sửa nhóm này một lần để lưu vào cơ sở dữ liệu trước khi đổi trạng thái.");
      return;
    }
    if (sec.active && sec.total_count && sec.total_count > 0) {
      if (!window.confirm(`Nhóm này đang có ${sec.total_count} sản phẩm. Bạn có chắc muốn ẩn nhóm này khỏi trang public?`)) {
        return;
      }
    }
    
    try {
      const { error } = await supabase.from("catalog_sections").update({ active: !sec.active }).eq("id", sec.id);
      if (error) throw error;
      setSections(prev => prev.map(s => s.id === sec.id ? { ...s, active: !sec.active } : s));
      toast.success(sec.active ? "Đã ẩn nhóm" : "Đã hiện nhóm");
    } catch (err: unknown) {
      toast.error("Lỗi: " + (err as Error).message);
    }
  };

  const handleDeleteSection = async (sec: CatalogSection) => {
    if (sec.id.startsWith("fallback-")) return;
    if (sec.total_count && sec.total_count > 0) {
      toast.error(`Không thể xóa nhóm này vì đang có ${sec.total_count} sản phẩm! Vui lòng chuyển các sản phẩm sang nhóm khác hoặc xóa chúng trước.`);
      return;
    }
    if (!window.confirm(`Bạn có chắc muốn xóa vĩnh viễn nhóm "${sec.label}" không?`)) return;
    
    try {
      const { error } = await supabase.from("catalog_sections").delete().eq("id", sec.id);
      if (error) throw error;
      setSections(prev => prev.filter(s => s.id !== sec.id));
      toast.success("Đã xóa nhóm sản phẩm");
    } catch (err: unknown) {
      toast.error("Lỗi xóa nhóm: " + (err as Error).message);
    }
  };

  const moveOrder = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === sections.length - 1)
    ) return;
    
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Hoán đổi trong array
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;
    
    // Tính lại sort_order
    newSections.forEach((s, i) => {
      s.sort_order = i * 10; // Cách nhau 10 đơn vị
    });
    
    // Cập nhật UI ngay lập tức
    setSections(newSections);
    
    // Gửi update lên DB
    try {
      const updates = newSections.filter(s => !s.id.startsWith("fallback-")).map(s => ({
        id: s.id,
        brand: s.brand,
        value: s.value,
        label: s.label,
        sort_order: s.sort_order
      }));
      
      const { error } = await supabase.from("catalog_sections").upsert(updates);
      if (error) throw error;
      toast.success("Đã cập nhật thứ tự");
    } catch (err: unknown) {
      toast.error("Lỗi cập nhật thứ tự: " + (err as Error).message);
      fetchSections(); // rollback on error
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-foreground">Quản lý nhóm sản phẩm</h2>
          <p className="text-sm text-muted-foreground">Thêm, sửa, sắp xếp các nhóm thuộc thương hiệu {activeBrand}</p>
        </div>
        <button
          onClick={() => {
            setIsAdding(true);
            setIsEditing("NEW");
            setEditForm({ sort_order: sections.length * 10, active: true });
          }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Thêm nhóm
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/30 border-b border-border text-muted-foreground uppercase text-xs">
            <tr>
              <th className="px-5 py-3 font-medium">Thứ tự</th>
              <th className="px-5 py-3 font-medium">Tên hiển thị (Label)</th>
              <th className="px-5 py-3 font-medium">Mã nhóm (Value)</th>
              <th className="px-5 py-3 font-medium text-center">Số sản phẩm</th>
              <th className="px-5 py-3 font-medium text-center">Trạng thái</th>
              <th className="px-5 py-3 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isAdding && (
              <tr className="bg-primary/5">
                <td className="px-5 py-3 text-center">-</td>
                <td className="px-5 py-3">
                  <input
                    type="text"
                    value={editForm.label || ""}
                    onChange={e => setEditForm({ ...editForm, label: e.target.value })}
                    placeholder="VD: Kem dưỡng"
                    className="w-full h-8 px-2 border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                  />
                </td>
                <td className="px-5 py-3">
                  <input
                    type="text"
                    value={editForm.value || ""}
                    onChange={e => setEditForm({ ...editForm, value: e.target.value.toUpperCase() })}
                    placeholder="VD: CREAM"
                    className="w-full h-8 px-2 border border-input rounded text-sm uppercase focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </td>
                <td className="px-5 py-3 text-center">-</td>
                <td className="px-5 py-3 text-center">
                  <span className="text-emerald-600 font-medium text-xs">Đang hiện</span>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleSaveEdit("NEW")} className="p-1.5 text-emerald-600 hover:bg-emerald-600/10 rounded" title="Lưu">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setIsAdding(false); setIsEditing(null); }} className="p-1.5 text-destructive hover:bg-destructive/10 rounded" title="Hủy">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Đang tải dữ liệu...</td></tr>
            ) : sections.length === 0 && !isAdding ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Chưa có nhóm sản phẩm nào.</td></tr>
            ) : (
              sections.map((sec, idx) => (
                isEditing === sec.id ? (
                  <tr key={sec.id} className="bg-muted/10">
                    <td className="px-5 py-3 text-center text-muted-foreground">{idx + 1}</td>
                    <td className="px-5 py-3">
                      <input
                        type="text"
                        value={editForm.label || ""}
                        onChange={e => setEditForm({ ...editForm, label: e.target.value })}
                        className="w-full h-8 px-2 border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="text"
                        value={editForm.value || ""}
                        onChange={e => setEditForm({ ...editForm, value: e.target.value.toUpperCase() })}
                        className="w-full h-8 px-2 border border-input rounded text-sm uppercase focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </td>
                    <td className="px-5 py-3 text-center font-medium">{sec.total_count}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={editForm.active ? "text-emerald-600 text-xs font-medium" : "text-muted-foreground text-xs font-medium"}>
                        {editForm.active ? "Đang hiện" : "Đã ẩn"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleSaveEdit(sec.id)} className="p-1.5 text-emerald-600 hover:bg-emerald-600/10 rounded" title="Lưu">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setIsEditing(null)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded" title="Hủy">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={sec.id} className={`hover:bg-muted/20 transition-colors ${!sec.active ? 'opacity-60 bg-muted/10' : ''}`}>
                    <td className="px-5 py-3 text-center text-muted-foreground font-medium">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => moveOrder(idx, 'up')} disabled={idx === 0} className="p-1 hover:bg-muted rounded disabled:opacity-30"><ArrowUp className="w-3 h-3" /></button>
                        <span className="w-4 text-center">{idx + 1}</span>
                        <button onClick={() => moveOrder(idx, 'down')} disabled={idx === sections.length - 1} className="p-1 hover:bg-muted rounded disabled:opacity-30"><ArrowDown className="w-3 h-3" /></button>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-semibold text-foreground">
                      {sec.label}
                      {sec.id.startsWith("fallback-") && (
                        <span className="ml-2 text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Mới</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground font-mono text-xs">{sec.value}</td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex items-center justify-center bg-muted px-2 py-1 rounded-full text-xs font-semibold">
                        {sec.total_count}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button 
                        onClick={() => toggleActive(sec)}
                        className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider transition-colors ${sec.active ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" : "bg-destructive/10 text-destructive hover:bg-destructive/20"}`}
                      >
                        {sec.active ? "Đang hiện" : "Đã ẩn"}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => { setIsEditing(sec.id); setEditForm(sec); }} 
                          className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors" 
                          title="Sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {!sec.id.startsWith("fallback-") && (
                          <button 
                            onClick={() => handleDeleteSection(sec)} 
                            className="p-1.5 text-destructive hover:bg-destructive/10 rounded transition-colors" 
                            title="Xóa nhóm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
