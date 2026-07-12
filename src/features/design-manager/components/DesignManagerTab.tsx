import React, { useState, useEffect } from 'react';
import { Save, Image as ImageIcon, RefreshCw, X, LayoutTemplate, Eye as EyeIcon } from 'lucide-react';
import { fetchSiteSettings, updateSiteSettings, type SiteSettings, type GalleryImage } from '@/features/seo/services/siteSettingsService';
import { MediaAssetPickerDialog } from '@/features/media/components/MediaAssetPickerDialog';
import { DashboardErrorState } from '@/components/ui/dashboard-error';
import { useSiteSettings } from '@/features/seo/components/SiteSettingsProvider';
import { withTimeout, getErrorMessage } from '@/lib/asyncState';
import { toast } from 'sonner';
import { BrandLogo } from "@/components/ui/BrandLogo";
import { SupportedBrandKey } from "../utils/brandLogoResolver";

export function DesignManagerTab() {
  const { refreshSettings } = useSiteSettings();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  
  // Pickers
  const [pickerOpen, setPickerOpen] = useState(false);
  const [currentBrandTarget, setCurrentBrandTarget] = useState<string | number | null>(null);

  // Form State
  const [logoDesembre, setLogoDesembre] = useState('');
  const [logoHyunjin, setLogoHyunjin] = useState('');
  const [logoDermagarden, setLogoDermagarden] = useState('');
  const [imageDesembre, setImageDesembre] = useState('');
  const [imageDermagarden, setImageDermagarden] = useState('');
  const [bannerDesktop, setBannerDesktop] = useState('');
  const [bannerMobile, setBannerMobile] = useState('');
  
  const [catalogBannerDesembreDesktop, setCatalogBannerDesembreDesktop] = useState('');
  const [catalogBannerDesembreMobile, setCatalogBannerDesembreMobile] = useState('');
  const [catalogBannerDermagardenDesktop, setCatalogBannerDermagardenDesktop] = useState('');
  const [catalogBannerDermagardenMobile, setCatalogBannerDermagardenMobile] = useState('');
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  
  const [pickerFilter, setPickerFilter] = useState<string>('brand_logo');

  const requestIdRef = React.useRef(0);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setErrorState(null);
    try {
      const res = await withTimeout(fetchSiteSettings(), 10000);
      if (requestId !== requestIdRef.current) return;

      if (res.ok && res.data) {
        setSettings(res.data);
        setLogoDesembre(res.data.headerLogoDesembreUrl || '');
        setLogoHyunjin(res.data.headerLogoHyunjinUrl || '');
        setLogoDermagarden(res.data.headerLogoDermagardenUrl || '');
        setImageDesembre(res.data.homeBrandDesembreImageUrl || '');
        setImageDermagarden(res.data.homeBrandDermagardenImageUrl || '');
        setBannerDesktop(res.data.homeHeroBannerImageUrl || '');
        setBannerMobile(res.data.homeHeroBannerMobileImageUrl || '');
        setCatalogBannerDesembreDesktop(res.data.catalogDesembreBannerImageUrl || '');
        setCatalogBannerDesembreMobile(res.data.catalogDesembreBannerMobileImageUrl || '');
        setCatalogBannerDermagardenDesktop(res.data.catalogDermagardenBannerImageUrl || '');
        setCatalogBannerDermagardenMobile(res.data.catalogDermagardenBannerMobileImageUrl || '');
        setGalleryImages(res.data.homeProductGalleryImages || []);
      } else {
        setErrorState(res.error || 'Lỗi không tải được Site Settings');
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setErrorState(getErrorMessage(err));
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    // Validate URLs basic
    const isValidUrl = (url: string) => {
      if (!url) return true; // allow empty to clear
      try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    };

    if (!isValidUrl(logoDesembre) || !isValidUrl(logoHyunjin) || !isValidUrl(logoDermagarden) || !isValidUrl(imageDesembre) || !isValidUrl(imageDermagarden) || !isValidUrl(bannerDesktop) || !isValidUrl(bannerMobile) || !isValidUrl(catalogBannerDesembreDesktop) || !isValidUrl(catalogBannerDesembreMobile) || !isValidUrl(catalogBannerDermagardenDesktop) || !isValidUrl(catalogBannerDermagardenMobile)) {
      toast.error('URL không hợp lệ. Không hỗ trợ data/blob URL.');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<SiteSettings> = {
        headerLogoDesembreUrl: logoDesembre || null,
        headerLogoHyunjinUrl: logoHyunjin || null,
        headerLogoDermagardenUrl: logoDermagarden || null,
        homeBrandDesembreImageUrl: imageDesembre || null,
        homeBrandDermagardenImageUrl: imageDermagarden || null,
        homeHeroBannerImageUrl: bannerDesktop || null,
        homeHeroBannerMobileImageUrl: bannerMobile || null,
        catalogDesembreBannerImageUrl: catalogBannerDesembreDesktop || null,
        catalogDesembreBannerMobileImageUrl: catalogBannerDesembreMobile || null,
        catalogDermagardenBannerImageUrl: catalogBannerDermagardenDesktop || null,
        catalogDermagardenBannerMobileImageUrl: catalogBannerDermagardenMobile || null,
        homeProductGalleryImages: galleryImages,
      };

      const { ok, error } = await updateSiteSettings(payload);
      if (ok) {
        toast.success('Đã lưu thiết kế thành công!');
        // Update local state
        setSettings(prev => prev ? { ...prev, ...payload } : null);
        await refreshSettings();
      } else {
        toast.error(error || 'Lỗi khi lưu thiết kế');
      }
    } catch (err) {
      toast.error('Lỗi ngoại lệ: ' + getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const openPicker = (target: 'desembre' | 'hyunjin' | 'dermagarden') => {
    setCurrentBrandTarget(target);
    setPickerFilter('brand_logo');
    setPickerOpen(true);
  };

  const openImagePicker = (target: 'desembre' | 'dermagarden') => {
    setCurrentBrandTarget(target); // reuse state
    setPickerFilter(''); // no specific filter for card images, could be products
    setPickerOpen(true);
  };

  const handlePickerSelect = (url: string) => {
    if (pickerFilter === 'brand_logo') {
      if (currentBrandTarget === 'desembre') setLogoDesembre(url);
      if (currentBrandTarget === 'hyunjin') setLogoHyunjin(url);
      if (currentBrandTarget === 'dermagarden') setLogoDermagarden(url);
    } else {
      if (currentBrandTarget === 'desembre') setImageDesembre(url);
      if (currentBrandTarget === 'dermagarden') setImageDermagarden(url);
      if (currentBrandTarget === 'bannerDesktop') setBannerDesktop(url);
      if (currentBrandTarget === 'bannerMobile') setBannerMobile(url);
      if (currentBrandTarget === 'catalogBannerDesembreDesktop') setCatalogBannerDesembreDesktop(url);
      if (currentBrandTarget === 'catalogBannerDesembreMobile') setCatalogBannerDesembreMobile(url);
      if (currentBrandTarget === 'catalogBannerDermagardenDesktop') setCatalogBannerDermagardenDesktop(url);
      if (currentBrandTarget === 'catalogBannerDermagardenMobile') setCatalogBannerDermagardenMobile(url);
      if (typeof currentBrandTarget === 'number') {
        setGalleryImages(prev => {
          const next = [...prev];
          if (next[currentBrandTarget]) next[currentBrandTarget].url = url;
          return next;
        });
      }
    }
  };

  if (loading) {
    return <div className="p-8 text-center"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" /></div>;
  }

  if (errorState) {
    return <div className="p-8"><DashboardErrorState message={errorState} onRetry={loadSettings} /></div>;
  }

  return (
    <div className="space-y-6">
      {/* SECTION: Header Thương Hiệu */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <LayoutTemplate className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Header Thương hiệu</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Thay đổi logo điều hướng ngoài website. Khuyến nghị dùng PNG/WebP nền trong suốt, canvas 600x180px (Tỉ lệ 10:3), dung lượng dưới 500KB.
        </p>

        {/* Cấu hình Logo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Logo Desembre */}
          <LogoCard 
            title="Logo Desembre" 
            value={logoDesembre}
            onChange={setLogoDesembre}
            onOpenPicker={() => openPicker('desembre')}
            brand="desembre"
          />

          {/* Logo HYUNJIN */}
          <LogoCard 
            title="Logo HYUNJIN" 
            value={logoHyunjin}
            onChange={setLogoHyunjin}
            onOpenPicker={() => openPicker('hyunjin')}
            brand="hyunjin"
          />

          {/* Logo Dermagarden */}
          <LogoCard 
            title="Logo Dermagarden" 
            value={logoDermagarden}
            onChange={setLogoDermagarden}
            onOpenPicker={() => openPicker('dermagarden')}
            brand="dermagarden"
          />
        </div>

        {/* Xem trước Header */}
        <div className="mt-8 border-t border-border pt-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2 text-foreground/80">
            <EyeIcon className="w-4 h-4" /> Xem trước Header
          </h3>
          
          <div className="bg-[#f8f5ef] dark:bg-background border border-black/5 rounded-md p-4 space-y-6">
            {/* Desktop Preview */}
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Desktop (Max 1024px)</span>
              <div className="h-[72px] bg-white dark:bg-card border border-border shadow-sm flex items-center justify-around px-6 relative overflow-hidden">
                <PreviewLogo src={logoDesembre} brand="desembre" isDesktop />
                <PreviewLogo src={logoHyunjin} brand="hyunjin" isDesktop active />
                <PreviewLogo src={logoDermagarden} brand="dermagarden" isDesktop />
              </div>
            </div>

            {/* Mobile Preview */}
            <div className="space-y-1 max-w-[420px] mx-auto">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Mobile (390px - 420px)</span>
              <div className="h-[60px] bg-white dark:bg-card border border-border shadow-sm flex items-center justify-between px-2 relative overflow-hidden">
                <PreviewLogo src={logoDesembre} brand="desembre" />
                <PreviewLogo src={logoHyunjin} brand="hyunjin" active />
                <PreviewLogo src={logoDermagarden} brand="dermagarden" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-4 border-t border-border mt-4">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Lưu thiết kế
          </button>
        </div>
      </div>

      {/* SECTION: Gallery sản phẩm trang chủ */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold">Gallery sản phẩm trang chủ</h2>
          </div>
          <span className="text-sm text-muted-foreground font-medium">{galleryImages.length}/12 ảnh</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Ảnh dùng cho gallery sản phẩm ở trang chủ. Trang chủ sẽ hiển thị khoảng 6 ảnh cùng lúc và tự thay phiên ảnh để tạo chuyển động.<br/>
          <strong>Chuẩn đề xuất:</strong> 1000×1000px · Tỉ lệ 1:1 · PNG/JPG/WebP · &lt;600KB/ảnh. Ưu tiên ảnh sản phẩm nền sáng hoặc nền trong suốt.
        </p>

        <div className="space-y-4">
          {galleryImages.map((img, index) => (
            <div key={img.id || index} className="flex flex-col md:flex-row gap-4 p-4 border border-border rounded-lg bg-background relative group transition-colors hover:border-primary/50">
              {/* Preview */}
              <div className="w-24 h-24 shrink-0 bg-muted rounded-md overflow-hidden border border-border/50 relative flex items-center justify-center">
                {img.url ? (
                  <img src={img.url} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                )}
              </div>
              
              {/* Fields */}
              <div className="flex-1 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">URL Ảnh</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={img.url} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setGalleryImages(prev => {
                            const next = [...prev];
                            next[index].url = val;
                            return next;
                          });
                        }}
                        className="flex-1 bg-background border border-input rounded-md px-3 py-1.5 text-sm" 
                        placeholder="https://..." 
                      />
                      <button 
                        onClick={() => {
                          setCurrentBrandTarget(index);
                          setPickerFilter('');
                          setPickerOpen(true);
                        }}
                        className="bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md text-sm whitespace-nowrap hover:bg-secondary/80"
                      >
                        Thư viện
                      </button>
                    </div>
                  </div>
                  
                  <div className="w-full sm:w-32 shrink-0">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Thương hiệu</label>
                    <select 
                      value={img.brand} 
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setGalleryImages(prev => {
                          const next = [...prev];
                          next[index].brand = val;
                          return next;
                        });
                      }}
                      className="w-full bg-background border border-input rounded-md px-3 py-1.5 text-sm"
                    >
                      <option value="chung">Chung</option>
                      <option value="desembre">Desembre</option>
                      <option value="dermagarden">Dermagarden</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Mô tả ngắn (Caption)</label>
                    <input 
                      type="text" 
                      value={img.caption} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setGalleryImages(prev => {
                          const next = [...prev];
                          next[index].caption = val;
                          return next;
                        });
                      }}
                      className="w-full bg-background border border-input rounded-md px-3 py-1.5 text-sm" 
                      placeholder="Ví dụ: Kem chống nắng Desembre" 
                    />
                  </div>
                  <div className="flex items-end pb-1.5">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input 
                        type="checkbox" 
                        checked={img.isActive}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setGalleryImages(prev => {
                            const next = [...prev];
                            next[index].isActive = val;
                            return next;
                          });
                        }}
                        className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
                      />
                      <span className="font-medium text-foreground">Hiển thị</span>
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Controls */}
              <div className="flex flex-row md:flex-col justify-end md:justify-center gap-2 absolute md:static top-4 right-4">
                <div className="flex bg-muted rounded-md overflow-hidden border border-border/50">
                  <button 
                    title="Lên"
                    disabled={index === 0}
                    onClick={() => {
                      setGalleryImages(prev => {
                        const next = [...prev];
                        const temp = next[index - 1];
                        next[index - 1] = next[index];
                        next[index] = temp;
                        return next;
                      });
                    }}
                    className="p-1.5 text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-30 transition-colors"
                  >
                    ↑
                  </button>
                  <div className="w-px bg-border/50" />
                  <button 
                    title="Xuống"
                    disabled={index === galleryImages.length - 1}
                    onClick={() => {
                      setGalleryImages(prev => {
                        const next = [...prev];
                        const temp = next[index + 1];
                        next[index + 1] = next[index];
                        next[index] = temp;
                        return next;
                      });
                    }}
                    className="p-1.5 text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-30 transition-colors"
                  >
                    ↓
                  </button>
                </div>
                <button 
                  title="Xóa"
                  onClick={() => {
                    if(confirm("Bạn có chắc chắn muốn xóa ảnh này khỏi danh sách?")) {
                      setGalleryImages(prev => prev.filter((_, i) => i !== index));
                    }
                  }}
                  className="p-1.5 text-destructive/70 hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors border border-transparent md:mt-2"
                >
                  <X className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {galleryImages.length < 12 && (
          <button
            onClick={() => {
              setGalleryImages(prev => [
                ...prev, 
                { id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(), url: '', alt: 'Gallery Image', brand: 'chung', caption: '', isActive: true }
              ]);
            }}
            className="w-full py-4 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-primary/50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            + Thêm ảnh ({galleryImages.length}/12)
          </button>
        )}
        
        {/* Action Button */}
        <div className="flex justify-end pt-4 border-t border-border mt-4">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Lưu danh sách ảnh
          </button>
        </div>
      </div>

      {/* SECTION: Banner Hero trang chủ */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <ImageIcon className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Banner Hero trang chủ</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Ảnh nền lớn hiển thị ở phần đầu trang chủ. Khuyến nghị dùng ảnh JPG/WebP/PNG kích thước 2400×1200px, tỉ lệ 2:1, dung lượng dưới 1.5MB. Tránh đặt chữ, logo hoặc chi tiết quan trọng sát mép ảnh.
        </p>
        <p className="text-xs text-muted-foreground italic">
          * Nếu không cấu hình banner mobile, hệ thống sẽ tự dùng banner desktop và căn giữa.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BannerCard 
            title="Banner desktop" 
            helperText="Chuẩn đề xuất: 2400×1200px · Tỉ lệ 2:1 · JPG/WebP/PNG · <1.5MB"
            aspectRatio="aspect-[2/1]"
            value={bannerDesktop}
            onChange={setBannerDesktop}
            onOpenPicker={() => {
              setCurrentBrandTarget('bannerDesktop');
              setPickerFilter('');
              setPickerOpen(true);
            }}
          />
          <BannerCard 
            title="Banner mobile (tùy chọn)" 
            helperText="Chuẩn đề xuất: 1200×1600px · Tỉ lệ 3:4 hoặc 4:5 · JPG/WebP/PNG · <1MB"
            aspectRatio="aspect-[3/4]"
            value={bannerMobile}
            onChange={setBannerMobile}
            onOpenPicker={() => {
              setCurrentBrandTarget('bannerMobile');
              setPickerFilter('');
              setPickerOpen(true);
            }}
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-border mt-4">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Lưu thiết kế
          </button>
        </div>
      </div>

      {/* SECTION: Ảnh thẻ thương hiệu trang chủ */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <ImageIcon className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Ảnh thẻ thương hiệu trang chủ</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Ảnh hiển thị trong 2 thẻ Desembre và Dermagarden ở Hero trang chủ. Khuyến nghị dùng ảnh PNG/JPG/WebP kích thước 1200×700px, tỉ lệ 12:7, dung lượng dưới 800KB. Ưu tiên ảnh sản phẩm nền trong suốt hoặc nền sáng, đặt sản phẩm ở giữa/dưới khung.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ImageCard 
            title="Ảnh card Desembre" 
            value={imageDesembre}
            onChange={setImageDesembre}
            onOpenPicker={() => openImagePicker('desembre')}
            fallbackType="desembre"
          />
          <ImageCard 
            title="Ảnh card Dermagarden" 
            value={imageDermagarden}
            onChange={setImageDermagarden}
            onOpenPicker={() => openImagePicker('dermagarden')}
            fallbackType="dermagarden"
          />
        </div>

        <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded border border-border/50">
          <strong className="text-foreground">Lưu ý:</strong> Tránh đặt chữ nhỏ, logo hoặc chi tiết quan trọng sát mép ảnh để không bị cắt trên mobile.
        </p>

        <div className="flex justify-end pt-4 border-t border-border mt-4">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Lưu thiết kế
          </button>
        </div>
      </div>

      {/* SECTION: Banner trang danh mục thương hiệu */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <ImageIcon className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Banner trang danh mục thương hiệu</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Ảnh nền hiển thị ở phần đầu trang /desembre và /dermagarden. Khuyến nghị dùng ảnh JPG/WebP/PNG kích thước 2400×900px, tỉ lệ 8:3, dung lượng dưới 1.2MB. Nên đặt sản phẩm/visual ở giữa hoặc bên phải, chừa vùng trái thoáng cho tiêu đề.
        </p>
        <p className="text-xs text-muted-foreground italic">
          * Nếu không cấu hình banner riêng, hệ thống sẽ tự dùng ảnh thẻ thương hiệu hoặc banner trang chủ làm fallback.
        </p>

        {/* Desembre Banners */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 border-b border-border pb-6">
          <BannerCard 
            title="Banner Desembre desktop" 
            helperText="Chuẩn đề xuất: 2400×900px · Tỉ lệ 8:3 · JPG/WebP/PNG · <1.2MB"
            aspectRatio="aspect-[8/3]"
            value={catalogBannerDesembreDesktop}
            onChange={setCatalogBannerDesembreDesktop}
            onOpenPicker={() => {
              setCurrentBrandTarget('catalogBannerDesembreDesktop');
              setPickerFilter('');
              setPickerOpen(true);
            }}
          />
          <BannerCard 
            title="Banner Desembre mobile" 
            helperText="Chuẩn đề xuất: 1200×1400px · Tỉ lệ 6:7 hoặc 4:5 · JPG/WebP/PNG · <1MB"
            aspectRatio="aspect-[6/7]"
            value={catalogBannerDesembreMobile}
            onChange={setCatalogBannerDesembreMobile}
            onOpenPicker={() => {
              setCurrentBrandTarget('catalogBannerDesembreMobile');
              setPickerFilter('');
              setPickerOpen(true);
            }}
          />
        </div>

        {/* Dermagarden Banners */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BannerCard 
            title="Banner Dermagarden desktop" 
            helperText="Chuẩn đề xuất: 2400×900px · Tỉ lệ 8:3 · JPG/WebP/PNG · <1.2MB"
            aspectRatio="aspect-[8/3]"
            value={catalogBannerDermagardenDesktop}
            onChange={setCatalogBannerDermagardenDesktop}
            onOpenPicker={() => {
              setCurrentBrandTarget('catalogBannerDermagardenDesktop');
              setPickerFilter('');
              setPickerOpen(true);
            }}
          />
          <BannerCard 
            title="Banner Dermagarden mobile" 
            helperText="Chuẩn đề xuất: 1200×1400px · Tỉ lệ 6:7 hoặc 4:5 · JPG/WebP/PNG · <1MB"
            aspectRatio="aspect-[6/7]"
            value={catalogBannerDermagardenMobile}
            onChange={setCatalogBannerDermagardenMobile}
            onOpenPicker={() => {
              setCurrentBrandTarget('catalogBannerDermagardenMobile');
              setPickerFilter('');
              setPickerOpen(true);
            }}
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-border mt-4">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Lưu thiết kế
          </button>
        </div>
      </div>

      <MediaAssetPickerDialog
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePickerSelect}
        defaultTypeFilter={pickerFilter === 'brand_logo' ? 'brand_logo' : undefined}
      />
    </div>
  );
}

// ----------------------------------------------------------------------
// Sub Components
// ----------------------------------------------------------------------

function LogoCard({ 
  title,
  value,
  onChange,
  onOpenPicker,
  brand
}: { 
  title: string; 
  value: string; 
  onChange: (val: string) => void;
  onOpenPicker: () => void;
  brand: SupportedBrandKey;
}) {
  return (
    <div className="border border-border rounded-md p-4 space-y-4 bg-muted/20">
      <h3 className="font-semibold text-sm">{title}</h3>
      
      <div className="h-20 bg-white dark:bg-card border border-border rounded flex items-center justify-center p-2 relative overflow-hidden group">
        <BrandLogo 
          brand={brand} 
          src={value} 
          className="h-full w-full"
          imgClassName="max-h-full max-w-full"
          textClassName="text-xs font-bold uppercase tracking-widest text-muted-foreground"
        />
        {!value && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <span className="text-xs font-medium text-muted-foreground px-2 py-1 bg-background rounded-sm">Mặc định</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <input 
          type="text" 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="w-full text-xs p-2 border border-input rounded-md bg-background focus:ring-1 focus:ring-primary outline-none"
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <button 
            onClick={onOpenPicker}
            className="flex-1 flex justify-center items-center gap-1 bg-secondary text-secondary-foreground text-xs py-1.5 px-2 rounded hover:bg-secondary/80 transition-colors"
          >
            <ImageIcon className="w-3.5 h-3.5" /> Thư viện
          </button>
          <div className="flex gap-2">
            <button 
              onClick={() => onChange('')}
              title="Dùng logo mặc định"
              className="px-2 py-1.5 bg-muted text-muted-foreground rounded hover:bg-muted/80 text-xs transition-colors"
            >
              Mặc định
            </button>
            <button 
              onClick={() => onChange('')}
              title="Xóa URL"
              className="px-2 py-1.5 text-destructive bg-destructive/10 rounded hover:bg-destructive/20 text-xs transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewLogo({ src, brand, isDesktop = false, active = false }: { src: string, brand: SupportedBrandKey, isDesktop?: boolean, active?: boolean }) {
  return (
    <div className={`relative flex items-center justify-center flex-1 h-full px-1 ${active ? 'opacity-100' : 'opacity-60'}`}>
      <BrandLogo 
        brand={brand} 
        src={src}
        className="w-full h-full flex items-center justify-center"
        imgClassName={`transition-transform ${isDesktop ? 'max-h-[34px] max-w-[132px]' : 'max-h-[24px] max-w-[88px]'} ${active ? (isDesktop ? 'scale-[1.12]' : 'scale-[1.06]') : ''}`}
        textClassName={`tracking-[0.16em] sm:tracking-[0.28em] font-semibold text-foreground ${isDesktop ? 'text-xs' : 'text-[10px]'}`}
      />
      {active && (
        <div className={`absolute bottom-2 h-[2px] bg-[#b89b5e] rounded-full shadow-sm ${isDesktop ? 'w-8' : 'w-6'}`} />
      )}
    </div>
  );
}

function ImageCard({ 
  title,
  value,
  onChange,
  onOpenPicker,
  fallbackType
}: { 
  title: string; 
  value: string; 
  onChange: (val: string) => void;
  onOpenPicker: () => void;
  fallbackType: 'desembre' | 'dermagarden';
}) {
  return (
    <div className="border border-border rounded-md p-4 space-y-4 bg-muted/20">
      <div>
        <h3 className="font-semibold text-sm">{title}</h3>
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Chuẩn đề xuất: 1200×700px · Tỉ lệ 12:7 · PNG/JPG/WebP · &lt;800KB</p>
      </div>
      
      <div className="aspect-[12/7] w-full bg-[#f8f5ef] dark:bg-card border border-border rounded flex items-center justify-center relative overflow-hidden group">
        {value ? (
          <img 
            src={value} 
            alt="Preview" 
            className="w-full h-full object-contain object-bottom" 
            onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('bg-destructive/10'); }}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${fallbackType === 'desembre' ? 'bg-orange-100/50 dark:bg-orange-950/20' : 'bg-emerald-100/50 dark:bg-emerald-950/20'}`}>
             <span className="text-xs font-medium text-muted-foreground">Mặc định (Gradient)</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <input 
          type="text" 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="w-full text-xs p-2 border border-input rounded-md bg-background focus:ring-1 focus:ring-primary outline-none"
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <button 
            onClick={onOpenPicker}
            className="flex-1 flex justify-center items-center gap-1 bg-secondary text-secondary-foreground text-xs py-1.5 px-2 rounded hover:bg-secondary/80 transition-colors"
          >
            <ImageIcon className="w-3.5 h-3.5" /> Thư viện
          </button>
          <div className="flex gap-2">
            <button 
              onClick={() => onChange('')}
              title="Dùng ảnh mặc định"
              className="px-2 py-1.5 bg-muted text-muted-foreground rounded hover:bg-muted/80 text-xs transition-colors"
            >
              Mặc định
            </button>
            <button 
              onClick={() => onChange('')}
              title="Xóa URL"
              className="px-2 py-1.5 text-destructive bg-destructive/10 rounded hover:bg-destructive/20 text-xs transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BannerCard({ 
  title,
  helperText,
  aspectRatio,
  value,
  onChange,
  onOpenPicker
}: { 
  title: string; 
  helperText: string;
  aspectRatio: string;
  value: string; 
  onChange: (val: string) => void;
  onOpenPicker: () => void;
}) {
  return (
    <div className="border border-border rounded-md p-4 space-y-4 bg-muted/20">
      <div>
        <h3 className="font-semibold text-sm">{title}</h3>
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{helperText}</p>
      </div>
      
      <div className={`${aspectRatio} w-full max-w-[400px] mx-auto bg-[#f8f5ef] dark:bg-card border border-border rounded flex items-center justify-center relative overflow-hidden group`}>
        {value ? (
          <img 
            src={value} 
            alt="Preview" 
            className="w-full h-full object-cover" 
            onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('bg-destructive/10'); }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/50">
             <span className="text-xs font-medium text-muted-foreground">Mặc định (Gradient)</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <input 
          type="text" 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="w-full text-xs p-2 border border-input rounded-md bg-background focus:ring-1 focus:ring-primary outline-none"
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <button 
            onClick={onOpenPicker}
            className="flex-1 flex justify-center items-center gap-1 bg-secondary text-secondary-foreground text-xs py-1.5 px-2 rounded hover:bg-secondary/80 transition-colors"
          >
            <ImageIcon className="w-3.5 h-3.5" /> Thư viện
          </button>
          <div className="flex gap-2">
            <button 
              onClick={() => onChange('')}
              title="Dùng ảnh mặc định"
              className="px-2 py-1.5 bg-muted text-muted-foreground rounded hover:bg-muted/80 text-xs transition-colors"
            >
              Mặc định
            </button>
            <button 
              onClick={() => onChange('')}
              title="Xóa URL"
              className="px-2 py-1.5 text-destructive bg-destructive/10 rounded hover:bg-destructive/20 text-xs transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
