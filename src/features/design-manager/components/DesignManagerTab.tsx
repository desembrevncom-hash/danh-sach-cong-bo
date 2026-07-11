import React, { useState, useEffect } from 'react';
import { Save, Image as ImageIcon, RefreshCw, X, LayoutTemplate, Eye as EyeIcon } from 'lucide-react';
import { fetchSiteSettings, updateSiteSettings, type SiteSettings } from '@/features/seo/services/siteSettingsService';
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
  const [currentBrandTarget, setCurrentBrandTarget] = useState<'desembre' | 'hyunjin' | 'dermagarden' | null>(null);

  // Form State
  const [logoDesembre, setLogoDesembre] = useState('');
  const [logoHyunjin, setLogoHyunjin] = useState('');
  const [logoDermagarden, setLogoDermagarden] = useState('');

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

    if (!isValidUrl(logoDesembre) || !isValidUrl(logoHyunjin) || !isValidUrl(logoDermagarden)) {
      toast.error('URL không hợp lệ. Không hỗ trợ data/blob URL.');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<SiteSettings> = {
        headerLogoDesembreUrl: logoDesembre || null,
        headerLogoHyunjinUrl: logoHyunjin || null,
        headerLogoDermagardenUrl: logoDermagarden || null,
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
    setPickerOpen(true);
  };

  const handlePickerSelect = (url: string) => {
    if (currentBrandTarget === 'desembre') setLogoDesembre(url);
    if (currentBrandTarget === 'hyunjin') setLogoHyunjin(url);
    if (currentBrandTarget === 'dermagarden') setLogoDermagarden(url);
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

      <MediaAssetPickerDialog
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePickerSelect}
        defaultTypeFilter="brand_logo"
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


