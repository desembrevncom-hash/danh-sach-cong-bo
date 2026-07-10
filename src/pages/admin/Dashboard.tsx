import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { uploadProductImage } from "@/features/products/utils/upload";
import { toast } from "sonner";
import { Plus, Edit2, Archive, LogOut, Image as ImageIcon, Search, RefreshCw, Package, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { sections as fallbackSections } from "@/data/desembreProducts";
import { AdminHealthAlerts } from "@/features/admin-dashboard/components/AdminHealthAlerts";
import { generateHealthAlerts, buildStats } from "@/features/admin-dashboard/utils/adminHealthAlerts";
import { SectionManagementTab } from "@/features/admin-dashboard/components/SectionManagementTab";
import { sortProductRows } from "@/features/products/utils/productDisplayOrder";
import { saveProductOverride } from "@/features/products/services/productOverrideService";
import type { SectionOption } from "@/config/brands";
import { resolveBrandId, type BrandId } from "@/config/brands";
import { SeoHead } from "@/features/seo/components/SeoHead";
import { SeoManagementTab } from "@/features/seo/components/SeoManagementTab";
import { MediaLibraryTab } from '@/features/media/components/MediaLibraryTab';
import { withTimeout, getErrorMessage } from "@/lib/asyncState";
import { DashboardErrorState } from "@/components/ui/dashboard-error";

type AdminProduct = {
  id: string;
  section: string;
  name: string;
  desc: string;
  link_url?: string;
  link_url_2?: string;
  image_url?: string;
  deleted: boolean;
  brand: string;
  sort_order?: number;
  updated_at?: string;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [sessionLoading, setSessionLoading] = useState(true);
  
  // Data state
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  // Filter state
  const [filterTab, setFilterTab] = useState<"ALL" | "ACTIVE" | "DELETED">("ALL");
  const [selectedBrand, setSelectedBrand] = useState<string>("desembre");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMainTab, setActiveMainTab] = useState<"products" | "sections" | "seo" | "media">("products");
  const [sectionOptions, setSectionOptions] = useState<SectionOption[]>([]);
  
  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form fields
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [section, setSection] = useState("");
  const [formBrand, setFormBrand] = useState("desembre");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkUrl2, setLinkUrl2] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  // 1. Auth Guard & Role Check
  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (!session) {
        navigate("/admin/login");
        return;
      }

      // Check role
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error("[Dashboard] Failed to fetch role", profileError);
          toast.error("Không thể xác minh quyền admin.");
          await supabase.auth.signOut();
          navigate("/admin/login");
          return;
        }

        if (profile?.role !== "admin") {
          toast.error("Bạn không có quyền truy cập trang này.");
          await supabase.auth.signOut();
          navigate("/admin/login");
          return;
        }

        setSessionLoading(false);
      } catch (err) {
        console.error("[Dashboard] Unexpected error", err);
        await supabase.auth.signOut();
        navigate("/admin/login");
      }
    }

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || (event !== 'INITIAL_SESSION' && !session)) {
        navigate("/admin/login");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    if (!sessionLoading && activeMainTab === "products") {
      fetchProducts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLoading, selectedBrand, activeMainTab]);

  // 2. Lấy danh sách sản phẩm
  const fetchProducts = async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setErrorState(null);
    
    try {
      // Admin lấy trực tiếp từ bảng product_overrides để quản lý toàn bộ bản ghi (cả ẩn và hiện)
      const [productsRes, sectionsRes] = await Promise.all([
        withTimeout(supabase.from("product_overrides").select("*").order("updated_at", { ascending: false }), 10000),
        withTimeout(supabase.from("catalog_sections").select("*").eq("brand", selectedBrand).order("sort_order", { ascending: true }), 10000)
      ]);

      if (requestId !== requestIdRef.current) return;

      const { data, error } = productsRes;
      const { data: secData, error: secError } = sectionsRes;

      if (secError) throw secError;
      if (error) throw error;

      if (secData && secData.length > 0) {
        setSectionOptions(secData as SectionOption[]);
      } else {
        setSectionOptions(fallbackSections.map((s, i) => ({ value: s.title, label: s.title, sort_order: i * 10 })));
      }

      if (data) {
        interface RawRow {
          id: string;
          section: string | null;
          name: string | null;
          desc: string | null;
          link_url: string | null;
          link_url_2: string | null;
          image_url: string | null;
          deleted: boolean;
          brand: string | null;
          sort_order: number | null;
          updated_at: string | null;
        }
        setProducts(data.map((item: RawRow) => ({
          id: item.id || String(Date.now()),
          section: item.section || "Khác",
          name: item.name || "",
          desc: item.desc || "",
          link_url: item.link_url || undefined,
          link_url_2: item.link_url_2 || undefined,
          image_url: item.image_url || undefined,
          deleted: item.deleted,
          brand: item.brand || "desembre",
          sort_order: item.sort_order || 0,
          updated_at: item.updated_at || undefined
        })));
      }
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      const msg = getErrorMessage(error);
      setErrorState(msg);
      if (import.meta.env.DEV) console.error("fetchProducts error:", error);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const openAddForm = () => {
    setEditingId(null);
    setName("");
    setDesc("");
    setSection(sectionOptions.length > 0 ? sectionOptions[0].value : fallbackSections[0].title);
    setFormBrand(selectedBrand);
    setLinkUrl("");
    setLinkUrl2("");
    setImageUrl("");
    setImageFile(null);
    setIsFormOpen(true);
  };

  const openEditForm = (p: AdminProduct) => {
    setEditingId(p.id);
    setName(p.name || "");
    setDesc(p.desc || "");
    setSection(p.section || (sectionOptions.length > 0 ? sectionOptions[0].value : fallbackSections[0].title));
    setFormBrand(p.brand || "desembre");
    setLinkUrl(p.link_url || "");
    setLinkUrl2(p.link_url_2 || "");
    setImageUrl(p.image_url || "");
    setImageFile(null);
    setIsFormOpen(true);
  };

  // 3. Xóa mềm (Soft Delete)
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn ẩn sản phẩm "${name}"?`)) return;
    try {
      const res = await saveProductOverride({
        action: "upsert",
        productId: id,
        deleted: true
      });
      if (!res.ok) throw new Error(res.error);
      
      // Optimistic update
      setProducts(prev => prev.map(p => p.id === id ? { ...p, deleted: true } : p));
      toast.success('Đã ẩn sản phẩm thành công!');
    } catch (error) {
      const err = error as Error;
      console.error("Lỗi khi ẩn sản phẩm:", err);
      toast.error('Ẩn thất bại! ' + (err.message || ''));
    }
  };

  // Khôi phục (Restore)
  const handleRestore = async (id: string, name: string) => {
    try {
      const res = await saveProductOverride({
        action: "upsert",
        productId: id,
        deleted: false
      });
      if (!res.ok) throw new Error(res.error);
      
      // Optimistic update
      setProducts(prev => prev.map(p => p.id === id ? { ...p, deleted: false } : p));
      toast.success('Đã khôi phục sản phẩm thành công!');
    } catch (error) {
      const err = error as Error;
      console.error("Lỗi khi khôi phục sản phẩm:", err);
      toast.error('Khôi phục thất bại! ' + (err.message || ''));
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
    
    // Nếu chọn tạo nhóm mới thông qua prompt nhanh
    let finalSection = section;
    if (section === "__CREATE_NEW__") {
      const newSecName = prompt("Nhập tên nhóm sản phẩm mới:");
      if (!newSecName?.trim()) {
        setIsSaving(false);
        return;
      }
      finalSection = newSecName.trim().toUpperCase();
      // Tạo group mới ngay lập tức
      const { error: secErr } = await supabase.from("catalog_sections").insert({
        brand: formBrand,
        value: finalSection,
        label: newSecName.trim(),
        sort_order: sectionOptions.length * 10,
        active: true
      });
      if (!secErr) {
        setSectionOptions(prev => [...prev, { value: finalSection, label: newSecName.trim(), sort_order: sectionOptions.length * 10, active: true }]);
      }
    }

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

      const res = await saveProductOverride({
        action: editingId === null ? "create" : "upsert",
        productId: editingId === null ? undefined : editingId,
        brand: formBrand,
        section: finalSection,
        name: name.trim(),
        desc: desc.trim(),
        image_url: finalImageUrl || undefined,
        link_url: linkUrl || undefined,
        link_url_2: linkUrl2 || undefined,
      });

      if (!res.ok) throw new Error(res.error);

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

  // Derived state calculations based on ALL products (DB truth)
  const stats = useMemo(() => buildStats(products), [products]);
  
  const alerts = useMemo(() => {
    return generateHealthAlerts(stats);
  }, [stats]);

  // Filtered products for the table UI
  const filteredProducts = useMemo(() => {
    const filtered = products.filter(p => {
      // 1. Lọc theo thương hiệu (brand)
      const pBrand = p.brand || "desembre";
      if (pBrand !== selectedBrand) return false;

      // 2. Lọc theo trạng thái (status)
      if (filterTab === "ACTIVE" && p.deleted) return false;
      if (filterTab === "DELETED" && !p.deleted) return false;
      
      // 3. Lọc theo từ khóa tìm kiếm (searchQuery)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = p.name?.toLowerCase().includes(query);
        const matchesSection = p.section?.toLowerCase().includes(query);
        if (!matchesName && !matchesSection) return false;
      }
      
      return true;
    });

    // Use the index of the section in the sectionOptions array as the definitive sorting rank.
    // This ensures that even if multiple sections have sort_order = 0, products are still grouped by section.
    const sectionSortOrderMap = new Map(sectionOptions.map((s, idx) => [s.value.toUpperCase(), idx]));

    return filtered.sort((a, b) => {
      const aSecSort = sectionSortOrderMap.get(a.section.toUpperCase()) ?? 999999;
      const bSecSort = sectionSortOrderMap.get(b.section.toUpperCase()) ?? 999999;
      
      if (aSecSort !== bSecSort) {
        return aSecSort - bSecSort;
      }
      
      const aProdSort = a.sort_order ?? 0;
      const bProdSort = b.sort_order ?? 0;
      
      if (aProdSort !== bProdSort) {
        return aProdSort - bProdSort;
      }

      const timeA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const timeB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return timeB - timeA;
    });
  }, [products, selectedBrand, filterTab, searchQuery, sectionOptions]);

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground font-medium">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-12">
      <SeoHead robots="noindex,nofollow" />
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 px-4 md:px-6 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <h1 className="font-bold text-lg md:text-xl tracking-tight">Dashboard Quản trị</h1>
        </div>
        <button onClick={handleLogout} className="text-sm font-medium text-destructive flex items-center gap-2 hover:bg-destructive/10 px-3 py-1.5 rounded-md transition-colors">
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Đăng xuất</span>
        </button>
      </header>

      <main className="container mx-auto p-4 md:p-6 space-y-6">
        
        {/* Main Tabs */}
        <div className="flex space-x-1 border-b border-border">
          <button
            onClick={() => setActiveMainTab("products")}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeMainTab === "products"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            Sản phẩm
          </button>
          <button
            onClick={() => setActiveMainTab("sections")}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeMainTab === "sections"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            Nhóm sản phẩm
          </button>
          <button
            onClick={() => setActiveMainTab("seo")}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeMainTab === "seo"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            SEO
          </button>
          <button
            onClick={() => setActiveMainTab("media")}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeMainTab === "media"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            Thư viện ảnh
          </button>
        </div>

        {activeMainTab === "media" ? (
          <MediaLibraryTab />
        ) : activeMainTab === "seo" ? (
          <SeoManagementTab />
        ) : activeMainTab === "sections" ? (
          <SectionManagementTab activeBrand={resolveBrandId(selectedBrand)} />
        ) : (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Controls & KPI */}
            <div className="flex flex-col xl:flex-row gap-6">
          <div className="flex-1 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-foreground bg-card px-3 py-1.5 rounded-md border border-border shadow-sm">Thương hiệu</span>
                <select 
                  value={selectedBrand} 
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="h-9 px-3 rounded-md border border-input bg-card focus:ring-2 focus:ring-primary focus:border-primary text-sm font-medium shadow-sm"
                >
                  <option value="desembre">Desembre</option>
                  <option value="dermagarden">Dermagarden</option>
                </select>
              </div>
              <button onClick={openAddForm} className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:opacity-90 shadow-sm transition-all active:scale-95 h-9">
                <Plus className="w-4 h-4" />
                Thêm mới
              </button>
            </div>
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card rounded-xl border border-border p-5 shadow-sm flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-full text-primary">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tổng sản phẩm</p>
                  <p className="text-2xl font-bold mt-1">{stats.total}</p>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border p-5 shadow-sm flex items-center gap-4">
                <div className="bg-emerald-500/10 p-3 rounded-full text-emerald-600 dark:text-emerald-500">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Đang hiển thị</p>
                  <p className="text-2xl font-bold mt-1">{stats.visible}</p>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border p-5 shadow-sm flex items-center gap-4">
                <div className="bg-destructive/10 p-3 rounded-full text-destructive">
                  <EyeOff className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Đã ẩn</p>
                  <p className="text-2xl font-bold mt-1">{stats.hidden}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Health Alerts Panel */}
          <div className="w-full xl:w-[400px] shrink-0">
            <div className="bg-card rounded-xl border border-border p-5 shadow-sm h-full">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                Cảnh báo dữ liệu 
                <span className="bg-muted px-2 py-0.5 rounded-full text-[10px] text-foreground">{alerts.length}</span>
              </h3>
              <AdminHealthAlerts alerts={alerts} />
            </div>
          </div>
        </div>

        {/* Management Section */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          {/* Table Toolbar */}
          <div className="p-4 border-b border-border bg-muted/10 flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex gap-2 bg-background w-fit p-1 rounded-lg border border-border shadow-sm">
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

            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary focus:border-primary text-sm shadow-sm"
              />
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto min-h-[300px] relative">
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                <p className="text-sm font-medium text-muted-foreground">Đang tải dữ liệu...</p>
              </div>
            ) : errorState ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-background/50 backdrop-blur-sm">
                <DashboardErrorState 
                  title="Không thể tải dữ liệu sản phẩm" 
                  message={errorState} 
                  onRetry={fetchProducts} 
                  className="w-full max-w-md shadow-lg bg-card"
                />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Không tìm thấy sản phẩm</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Không có sản phẩm nào phù hợp với bộ lọc hiện tại. Vui lòng thử tìm kiếm với từ khóa khác.
                </p>
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="mt-4 text-primary text-sm font-medium hover:underline">
                    Xóa tìm kiếm
                  </button>
                )}
              </div>
            ) : null}

            <table className="w-full text-sm text-left relative">
              <thead className="bg-muted/30 border-b border-border text-muted-foreground uppercase text-xs sticky top-0 backdrop-blur-md z-0">
                <tr>
                  <th className="px-5 py-3.5 font-medium whitespace-nowrap">Ảnh</th>
                  <th className="px-5 py-3.5 font-medium min-w-[200px]">Sản phẩm</th>
                  <th className="px-5 py-3.5 font-medium hidden md:table-cell whitespace-nowrap">Nhóm</th>
                  <th className="px-5 py-3.5 font-medium text-right whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className={`hover:bg-muted/30 transition-colors ${p.deleted ? "opacity-60 bg-muted/10" : ""}`}>
                    <td className="px-5 py-3 w-16">
                      {p.image_url ? (
                        <img 
                          src={p.image_url} 
                          alt={p.name} 
                          loading="lazy"
                          decoding="async"
                          className={`w-11 h-11 object-cover rounded-md border border-border shadow-sm ${p.deleted ? "grayscale-[50%]" : ""}`}
                          onError={(e) => {
                            (e.target as HTMLImageElement).onerror = null;
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="%23ccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                          }}
                        />
                      ) : (
                        <div className="w-11 h-11 bg-muted/50 flex items-center justify-center rounded-md border border-border shadow-sm"><ImageIcon className="w-4 h-4 text-muted-foreground/40"/></div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-semibold text-foreground line-clamp-1 flex items-center gap-2">
                        {p.name || "Sản phẩm không tên"} 
                        {p.deleted && <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full uppercase font-bold tracking-wider shrink-0">Đã ẩn</span>}
                        {!p.link_url && !p.deleted && <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider shrink-0" title="Thiếu link công bố">Thiếu Link</span>}
                      </div>
                      <div className="text-muted-foreground text-xs line-clamp-1 mt-1 leading-relaxed">{p.desc || "Chưa có mô tả"}</div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell text-muted-foreground font-medium">
                      {p.section}
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditForm(p)} className="p-2 text-primary hover:bg-primary/10 rounded-md transition-colors" title="Sửa">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {p.deleted ? (
                          <button onClick={() => handleRestore(p.id, p.name)} className="p-2 text-emerald-600 hover:bg-emerald-600/10 rounded-md transition-colors" title="Khôi phục hiển thị">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                          </button>
                        ) : (
                          <button onClick={() => handleDelete(p.id, p.name)} className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors" title="Ẩn sản phẩm">
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
          </div>
        )}
      </main>

      {/* Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => !isSaving && setIsFormOpen(false)} />
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg z-10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-4 md:p-6 border-b border-border flex justify-between items-center bg-muted/10 rounded-t-xl">
              <h3 className="font-bold text-lg">{editingId ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}</h3>
              <button onClick={() => !isSaving && setIsFormOpen(false)} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleSave} className="overflow-y-auto p-4 md:p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Tên sản phẩm <span className="text-destructive">*</span></label>
                <input required value={name} onChange={e=>setName(e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary focus:border-primary text-sm shadow-sm" placeholder="Nhập tên sản phẩm..." />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Nhóm sản phẩm <span className="text-destructive">*</span></label>
                  <select required value={section} onChange={e=>setSection(e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary focus:border-primary text-sm shadow-sm">
                    {sectionOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Thương hiệu <span className="text-destructive">*</span></label>
                  <select required value={formBrand} onChange={e=>setFormBrand(e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary focus:border-primary text-sm shadow-sm">
                    <option value="desembre">Desembre</option>
                    <option value="dermagarden">Dermagarden</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Mô tả ngắn</label>
                <textarea value={desc} onChange={e=>setDesc(e.target.value)} className="w-full min-h-[80px] p-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary focus:border-primary text-sm resize-y shadow-sm" placeholder="Mô tả công dụng..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Link công bố 1</label>
                  <input value={linkUrl} onChange={e=>setLinkUrl(e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary focus:border-primary text-sm shadow-sm" placeholder="https://..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Link công bố 2 (Tuỳ chọn)</label>
                  <input value={linkUrl2} onChange={e=>setLinkUrl2(e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary focus:border-primary text-sm shadow-sm" placeholder="https://..." />
                </div>
              </div>

              <div className="space-y-1.5 pt-4 border-t border-border">
                <label className="text-sm font-semibold">Hình ảnh sản phẩm</label>
                <div className="flex items-center gap-4 mt-2 bg-muted/20 p-3 rounded-lg border border-border">
                  <div className="w-16 h-16 rounded-md border border-border bg-background flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    {imageFile ? (
                      <img src={URL.createObjectURL(imageFile)} alt="preview" className="w-full h-full object-cover" />
                    ) : imageUrl ? (
                      <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="image/jpeg, image/png, image/webp" 
                      onChange={handleFileChange}
                      className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-2">JPG, PNG, WEBP (Max: 5MB)</p>
                  </div>
                </div>
              </div>

            </form>
            
            <div className="p-4 md:p-6 border-t border-border bg-muted/10 flex justify-end gap-3 rounded-b-xl">
              <button type="button" onClick={() => setIsFormOpen(false)} disabled={isSaving} className="px-5 py-2 font-medium text-sm rounded-md border border-input bg-background hover:bg-muted transition-colors shadow-sm">
                Hủy
              </button>
              <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-primary text-primary-foreground font-medium text-sm rounded-md hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm active:scale-95">
                {isSaving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Đang lưu...
                  </>
                ) : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
