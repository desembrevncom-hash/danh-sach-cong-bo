import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { uploadProductImage } from "@/features/products/utils/upload";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, LogOut, Image as ImageIcon } from "lucide-react";
import { sections } from "@/data/desembreProducts";

type AdminProduct = {
  no: number;
  section: string;
  name: string;
  desc: string;
  link_url?: string;
  link_url_2?: string;
  image_url?: string;
  deleted?: boolean;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [sessionLoading, setSessionLoading] = useState(true);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterTab, setFilterTab] = useState<"ALL" | "ACTIVE" | "DELETED">("ALL");
  
  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingNo, setEditingNo] = useState<number | null>(null);
  
  // Form fields
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [section, setSection] = useState(sections[0].title);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkUrl2, setLinkUrl2] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  // 1. Auth Guard
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/admin/login");
      } else {
        setSessionLoading(false);
        fetchProducts();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/admin/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // 2. Lấy danh sách sản phẩm
  const fetchProducts = async () => {
    setIsLoading(true);
    // Admin lấy trực tiếp từ bảng product_overrides để quản lý toàn bộ bản ghi (cả ẩn và hiện)
    const { data, error } = await supabase
      .from("product_overrides")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      toast.error("Lỗi lấy dữ liệu: " + error.message);
    } else if (data) {
      interface RawRow {
        no: number;
        section: string | null;
        name: string | null;
        desc: string | null;
        link_url: string | null;
        link_url_2: string | null;
        image_url: string | null;
        deleted: boolean;
      }
      // Map về AdminProduct, giữ nguyên thuộc tính deleted
      setProducts(data.map((item: RawRow) => ({
        no: item.no,
        section: item.section || "Khác",
        name: item.name || "",
        desc: item.desc || "",
        link_url: item.link_url || undefined,
        link_url_2: item.link_url_2 || undefined,
        image_url: item.image_url || undefined,
        deleted: item.deleted
      })));
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const openAddForm = () => {
    setEditingNo(null);
    setName("");
    setDesc("");
    setSection(sections[0].title);
    setLinkUrl("");
    setLinkUrl2("");
    setImageUrl("");
    setImageFile(null);
    setIsFormOpen(true);
  };

  const openEditForm = (p: AdminProduct) => {
    setEditingNo(p.no);
    setName(p.name || "");
    setDesc(p.desc || "");
    setSection(p.section || sections[0].title);
    setLinkUrl(p.link_url || "");
    setLinkUrl2(p.link_url_2 || "");
    setImageUrl(p.image_url || "");
    setImageFile(null);
    setIsFormOpen(true);
  };

  // 3. Xóa mềm (Soft Delete)
  const handleDelete = async (no: number, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa/ẩn sản phẩm "${name}"?`)) return;
    try {
      const { error } = await supabase.from("product_overrides").update({ deleted: true }).eq("no", no);
      if (error) throw error;
      
      // Optimistic update
      setProducts(prev => prev.map(p => p.no === no ? { ...p, deleted: true } : p));
      toast.success('Đã ẩn sản phẩm thành công!');
    } catch (err) {
      console.error("Lỗi khi ẩn sản phẩm:", err);
      toast.error('Ẩn thất bại!');
    }
  };

  // Khôi phục (Restore)
  const handleRestore = async (no: number, name: string) => {
    try {
      const { error } = await supabase.from("product_overrides").update({ deleted: false }).eq("no", no);
      if (error) throw error;
      
      // Optimistic update
      setProducts(prev => prev.map(p => p.no === no ? { ...p, deleted: false } : p));
      
      if (typeof toast !== 'undefined' && toast.success) {
        toast.success('Đã khôi phục sản phẩm thành công!');
      } else {
        console.log("Đã khôi phục thành công sản phẩm số: " + no);
      }
    } catch (err) {
      console.error("Lỗi khi khôi phục sản phẩm:", err);
      toast.error('Khôi phục thất bại!');
    }
  };

  // 4. Validate file ảnh ngay khi chọn
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImageFile(null);
      return;
    }

    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    const MAX_SIZE_MB = 5;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Lỗi: Chỉ hỗ trợ định dạng ảnh .jpg, .jpeg, .png, .webp.");
      e.target.value = ""; // Reset input
      setImageFile(null);
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      toast.error(`Lỗi: Dung lượng file quá lớn (tối đa ${MAX_SIZE_MB}MB).`);
      e.target.value = ""; // Reset input
      setImageFile(null);
      return;
    }

    setImageFile(file);
  };

  // 5. Lưu sản phẩm (Thêm mới hoặc Cập nhật)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let finalImageUrl = imageUrl;

      // Nếu có chọn ảnh mới thì upload
      if (imageFile) {
        const uploadRes = await uploadProductImage(imageFile);
        if (uploadRes.error) {
          toast.error(uploadRes.error);
          setIsSaving(false);
          return;
        }
        if (uploadRes.url) {
          finalImageUrl = uploadRes.url;
        }
      }

      // Payload dữ liệu
      const payload: Record<string, unknown> = {
        name,
        desc,
        section,
        link_url: linkUrl || null,
        link_url_2: linkUrl2 || null,
        image_url: finalImageUrl || null,
        deleted: false
      };

      // Nếu tạo mới, chúng ta cần tìm một số `no` mới (tạm thời auto-increment hoặc timestamp nếu backend cho phép)
      // Theo logic cũ, no là primary key. Nếu editingNo = null (thêm mới), ta tạo ID dựa vào Date.now() 
      if (editingNo === null) {
        payload.no = parseInt(Date.now().toString().slice(-8)); // ID ngẫu nhiên không trùng
      } else {
        payload.no = editingNo;
      }

      const { error } = await supabase.from("product_overrides").upsert(payload);

      if (error) throw error;

      toast.success("Đã lưu sản phẩm thành công!");
      setIsFormOpen(false);
      fetchProducts();
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error("Lỗi khi lưu: " + err.message);
      } else {
        toast.error("Lỗi khi lưu!");
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (sessionLoading) {
    return <div className="min-h-screen flex items-center justify-center">Đang kiểm tra quyền truy cập...</div>;
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 px-4 h-16 flex items-center justify-between">
        <h1 className="font-bold text-lg md:text-xl">Dashboard Quản trị</h1>
        <button onClick={handleLogout} className="text-sm font-medium text-destructive flex items-center gap-2 hover:bg-destructive/10 px-3 py-1.5 rounded-md transition-colors">
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Đăng xuất</span>
        </button>
      </header>

      <main className="container mx-auto p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Danh sách Sản phẩm</h2>
          <button onClick={openAddForm} className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:opacity-90 shadow-sm transition-all active:scale-95">
            <Plus className="w-4 h-4" />
            Thêm mới
          </button>
        </div>

        {/* Tab Bộ lọc trạng thái */}
        <div className="flex gap-2 mb-4 bg-card w-fit p-1 rounded-lg border border-border shadow-sm">
          <button 
            onClick={() => setFilterTab("ALL")} 
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterTab === "ALL" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:bg-muted"}`}
          >
            Tất cả
          </button>
          <button 
            onClick={() => setFilterTab("ACTIVE")} 
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterTab === "ACTIVE" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:bg-muted"}`}
          >
            Đang hiển thị
          </button>
          <button 
            onClick={() => setFilterTab("DELETED")} 
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterTab === "DELETED" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:bg-muted"}`}
          >
            Đã ẩn
          </button>
        </div>

        {/* Bảng danh sách */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-10 text-center text-muted-foreground animate-pulse">Đang tải dữ liệu...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 font-medium">Ảnh</th>
                    <th className="px-4 py-3 font-medium">Sản phẩm</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Nhóm</th>
                    <th className="px-4 py-3 font-medium text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {products.filter(p => {
                    if (filterTab === "ACTIVE") return !p.deleted;
                    if (filterTab === "DELETED") return p.deleted;
                    return true;
                  }).map((p) => (
                    <tr key={p.no} className={`hover:bg-muted/30 transition-colors ${p.deleted ? "opacity-50 grayscale-[50%]" : ""}`}>
                      <td className="px-4 py-3 w-16">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-10 h-10 object-cover rounded-md border border-border" />
                        ) : (
                          <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-md border border-border"><ImageIcon className="w-4 h-4 text-muted-foreground/50"/></div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground line-clamp-1">{p.name || `Sản phẩm #${p.no}`} {p.deleted && <span className="ml-2 text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full uppercase">Đã ẩn</span>}</div>
                        <div className="text-muted-foreground text-xs line-clamp-1 mt-0.5">{p.desc}</div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                        {p.section}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2 w-28">
                        <button onClick={() => openEditForm(p)} className="p-2 text-primary hover:bg-primary/10 rounded-md transition-colors" title="Sửa">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {p.deleted ? (
                          <button onClick={() => handleRestore(p.no, p.name)} className="p-2 text-emerald-600 hover:bg-emerald-600/10 rounded-md transition-colors" title="Khôi phục">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                          </button>
                        ) : (
                          <button onClick={() => handleDelete(p.no, p.name)} className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors" title="Ẩn">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Chưa có sản phẩm nào.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => !isSaving && setIsFormOpen(false)} />
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg z-10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-4 md:p-6 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-lg">{editingNo ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}</h3>
              <button onClick={() => !isSaving && setIsFormOpen(false)} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleSave} className="overflow-y-auto p-4 md:p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tên sản phẩm <span className="text-destructive">*</span></label>
                <input required value={name} onChange={e=>setName(e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary focus:border-primary text-sm" placeholder="Nhập tên sản phẩm..." />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nhóm sản phẩm <span className="text-destructive">*</span></label>
                <select required value={section} onChange={e=>setSection(e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary focus:border-primary text-sm">
                  {sections.map(s => <option key={s.title} value={s.title}>{s.title}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Mô tả ngắn</label>
                <textarea value={desc} onChange={e=>setDesc(e.target.value)} className="w-full min-h-[80px] p-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary focus:border-primary text-sm resize-y" placeholder="Mô tả công dụng..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Link công bố 1</label>
                  <input value={linkUrl} onChange={e=>setLinkUrl(e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary focus:border-primary text-sm" placeholder="https://..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Link công bố 2 (Tuỳ chọn)</label>
                  <input value={linkUrl2} onChange={e=>setLinkUrl2(e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary focus:border-primary text-sm" placeholder="https://..." />
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border">
                <label className="text-sm font-medium">Hình ảnh sản phẩm</label>
                <div className="flex items-center gap-4 mt-2">
                  <div className="w-16 h-16 rounded-md border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {imageFile ? (
                      <img src={URL.createObjectURL(imageFile)} alt="preview" className="w-full h-full object-cover" />
                    ) : imageUrl ? (
                      <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="image/jpeg, image/png, image/webp" 
                      onChange={handleFileChange}
                      className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">JPG, PNG, WEBP (Max: 5MB)</p>
                  </div>
                </div>
              </div>

            </form>
            
            <div className="p-4 md:p-6 border-t border-border bg-muted/20 flex justify-end gap-3 rounded-b-xl">
              <button type="button" onClick={() => setIsFormOpen(false)} disabled={isSaving} className="px-4 py-2 font-medium text-sm rounded-md border border-input hover:bg-muted/50 transition-colors">
                Hủy
              </button>
              <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-primary text-primary-foreground font-medium text-sm rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2">
                {isSaving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Đang lưu...
                  </>
                ) : "Lưu sản phẩm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
