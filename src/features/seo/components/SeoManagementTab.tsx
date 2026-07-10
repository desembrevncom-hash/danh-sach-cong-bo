import React, { useState, useEffect } from 'react';
import { SeoPage } from '../types';
import { fetchAllSeoPagesForAdmin, updateSeoPage } from '../services/seoService';
import { validateSeoCanonicalUrl, validateSeoImageUrl, validateSeoRobots, validateSeoSchemaJson } from '../utils/seoValidation';
import { fetchSiteSettings, updateSiteSettings, type SiteSettings } from '../services/siteSettingsService';
import { MediaAssetPickerDialog } from '@/features/media/components/MediaAssetPickerDialog';
import { MediaAssetType } from '@/features/media/types';
import { toast } from 'sonner';
import { Edit2, Save, X, RefreshCw, Eye, Globe, Image as ImageIcon, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { DashboardErrorState } from '@/components/ui/dashboard-error';
import { withTimeout, getErrorMessage } from '@/lib/asyncState';

export function SeoManagementTab() {
  const [pages, setPages] = useState<SeoPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const requestIdRef = React.useRef(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Site Settings State
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [editingSite, setEditingSite] = useState(false);
  const [siteForm, setSiteForm] = useState<Partial<SiteSettings>>({});
  const [siteErrors, setSiteErrors] = useState<Record<string, string>>({});
  const [savingSite, setSavingSite] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');
  const [ogImageUrl, setOgImageUrl] = useState('');
  const [robots, setRobots] = useState('index,follow');
  const [schemaJson, setSchemaJson] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Media Picker State
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerType, setPickerType] = useState<MediaAssetType | ''>('');
  const [pickerTarget, setPickerTarget] = useState<'site_favicon' | 'site_apple' | 'site_app192' | 'site_app512' | 'site_og' | 'route_og' | null>(null);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setErrorState(null);
    try {
      const [seoRes, siteRes] = await Promise.all([
        withTimeout(fetchAllSeoPagesForAdmin(), 8000),
        withTimeout(fetchSiteSettings(), 8000)
      ]);

      if (requestId !== requestIdRef.current) return;

      if (seoRes.ok && seoRes.data) setPages(seoRes.data);
      else toast.error(seoRes.error || 'Không thể tải danh sách trang SEO');

      if (siteRes.ok && siteRes.data) setSiteSettings(siteRes.data);
      else toast.error(siteRes.error || 'Không thể tải cấu hình Site Assets');
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setErrorState(getErrorMessage(error));
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const handleEdit = (p: SeoPage) => {
    setEditingId(p.id);
    setTitle(p.title);
    setDescription(p.description);
    setCanonicalUrl(p.canonicalUrl || '');
    setOgTitle(p.ogTitle || '');
    setOgDescription(p.ogDescription || '');
    setOgImageUrl(p.ogImageUrl || '');
    setRobots(p.robots);
    setSchemaJson(p.schemaJson ? JSON.stringify(p.schemaJson, null, 2) : '');
    setErrors({});
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title không được để trống';
    if (!description.trim()) newErrors.description = 'Description không được để trống';
    
    const canErr = validateSeoCanonicalUrl(canonicalUrl);
    if (canErr) newErrors.canonicalUrl = canErr;

    const imgErr = validateSeoImageUrl(ogImageUrl);
    if (imgErr) newErrors.ogImageUrl = imgErr;

    const robErr = validateSeoRobots(robots);
    if (robErr) newErrors.robots = robErr;

    const schemErr = validateSeoSchemaJson(schemaJson);
    if (schemErr) newErrors.schemaJson = schemErr;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !editingId) return;

    setSaving(true);
    const payload: Partial<SeoPage> = {
      title: title.trim(),
      description: description.trim(),
      canonicalUrl: canonicalUrl.trim() || null,
      ogTitle: ogTitle.trim() || null,
      ogDescription: ogDescription.trim() || null,
      ogImageUrl: ogImageUrl.trim() || null,
      robots: robots.trim(),
      schemaJson: schemaJson.trim() ? JSON.parse(schemaJson) : null
    };

    const { ok, error } = await updateSeoPage(editingId, payload);
    if (ok) {
      toast.success('Cập nhật SEO thành công');
      setEditingId(null);
      loadPages();
    } else {
      toast.error(error || 'Có lỗi xảy ra khi lưu SEO');
    }
    setSaving(false);
  };

  const handleEditSite = () => {
    if (!siteSettings) return;
    setEditingSite(true);
    setSiteForm({
      siteName: siteSettings.siteName,
      faviconUrl: siteSettings.faviconUrl || '',
      appleTouchIconUrl: siteSettings.appleTouchIconUrl || '',
      webAppIcon192Url: siteSettings.webAppIcon192Url || '',
      webAppIcon512Url: siteSettings.webAppIcon512Url || '',
      defaultOgImageUrl: siteSettings.defaultOgImageUrl || ''
    });
    setSiteErrors({});
  };

  const validateSite = (): boolean => {
    const errors: Record<string, string> = {};
    if (!siteForm.siteName?.trim()) errors.siteName = 'Tên trang không được trống';
    if (siteForm.faviconUrl && siteForm.faviconUrl.startsWith('data:')) errors.faviconUrl = 'Không hỗ trợ data URI. Vui lòng dùng đường dẫn thực.';
    if (siteForm.appleTouchIconUrl && siteForm.appleTouchIconUrl.startsWith('data:')) errors.appleTouchIconUrl = 'Không hỗ trợ data URI.';
    
    setSiteErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveSite = async () => {
    if (!validateSite()) return;
    setSavingSite(true);
    const payload = { ...siteForm };
    const { ok, error } = await updateSiteSettings(payload);
    if (ok) {
      toast.success('Cập nhật Site Assets thành công');
      setEditingSite(false);
      loadPages();
    } else {
      toast.error(error || 'Lỗi khi lưu Site Assets');
    }
    setSavingSite(false);
  };

  const openPicker = (target: typeof pickerTarget, type: MediaAssetType) => {
    setPickerTarget(target);
    setPickerType(type);
    setPickerOpen(true);
  };

  const handlePickerSelect = (url: string) => {
    if (!pickerTarget) return;
    if (pickerTarget.startsWith('site_')) {
      if (pickerTarget === 'site_favicon') setSiteForm(s => ({ ...s, faviconUrl: url }));
      if (pickerTarget === 'site_apple') setSiteForm(s => ({ ...s, appleTouchIconUrl: url }));
      if (pickerTarget === 'site_app192') setSiteForm(s => ({ ...s, webAppIcon192Url: url }));
      if (pickerTarget === 'site_app512') setSiteForm(s => ({ ...s, webAppIcon512Url: url }));
      if (pickerTarget === 'site_og') setSiteForm(s => ({ ...s, defaultOgImageUrl: url }));
    } else if (pickerTarget === 'route_og') {
      setOgImageUrl(url);
    }
  };

  const calculateSeoScore = (page: SeoPage) => {
    let score = 0;
    if (page.title) score += 20;
    if (page.description) score += 20;
    if (!validateSeoCanonicalUrl(page.canonicalUrl || '')) score += 20;
    if (page.robots.includes('index') && page.robots.includes('follow')) score += 10;
    if (page.ogImageUrl || siteSettings?.defaultOgImageUrl) score += 20;
    if (page.schemaJson) score += 10;
    return score;
  };

  if (loading) {
    return <div className="p-8 text-center"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" /></div>;
  }

  if (errorState) {
    return <div className="p-8"><DashboardErrorState message={errorState} onRetry={loadPages} /></div>;
  }

  if (editingId) {
    const page = pages.find(p => p.id === editingId);
    return (
      <div className="bg-card border border-border rounded-lg shadow-sm p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-border pb-4">
          <h2 className="text-xl font-bold">Chỉnh sửa SEO: {page?.routePath}</h2>
          <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title <span className="text-destructive">*</span></label>
              <input value={title} onChange={e => setTitle(e.target.value)} className={`w-full p-2 border rounded-md ${errors.title ? 'border-destructive' : 'border-input'} bg-background`} />
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span className={errors.title ? 'text-destructive' : ''}>{errors.title}</span>
                <span>{title.length}/60</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Meta Description <span className="text-destructive">*</span></label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={`w-full p-2 border rounded-md ${errors.description ? 'border-destructive' : 'border-input'} bg-background`} />
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span className={errors.description ? 'text-destructive' : ''}>{errors.description}</span>
                <span>{description.length}/160</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Canonical URL</label>
              <input value={canonicalUrl} onChange={e => setCanonicalUrl(e.target.value)} placeholder="https://cong-bo.hjcnt.com.vn/..." className={`w-full p-2 border rounded-md ${errors.canonicalUrl ? 'border-destructive' : 'border-input'} bg-background`} />
              {errors.canonicalUrl && <p className="text-xs text-destructive mt-1">{errors.canonicalUrl}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Robots</label>
              <select value={robots} onChange={e => setRobots(e.target.value)} className="w-full p-2 border border-input rounded-md bg-background">
                <option value="index,follow">index, follow</option>
                <option value="noindex,nofollow">noindex, nofollow</option>
                <option value="noindex,follow">noindex, follow</option>
              </select>
              {errors.robots && <p className="text-xs text-destructive mt-1">{errors.robots}</p>}
            </div>
            
            <div className="pt-4 border-t border-border">
              <h3 className="font-semibold mb-3">Open Graph (Mạng xã hội)</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">OG Title (Để trống lấy Title)</label>
                  <input value={ogTitle} onChange={e => setOgTitle(e.target.value)} className="w-full p-2 border border-input rounded-md bg-background" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">OG Description (Để trống lấy Desc)</label>
                  <textarea value={ogDescription} onChange={e => setOgDescription(e.target.value)} rows={2} className="w-full p-2 border border-input rounded-md bg-background" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">OG Image URL</label>
                  <div className="flex gap-2">
                    <input value={ogImageUrl} onChange={e => setOgImageUrl(e.target.value)} className={`flex-1 p-2 border rounded-md ${errors.ogImageUrl ? 'border-destructive' : 'border-input'} bg-background`} />
                    <button onClick={() => openPicker('route_og', 'og_image')} className="px-3 py-2 bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary border border-input rounded-md transition-colors flex items-center gap-1 shrink-0">
                      <ImageIcon className="w-4 h-4" />
                      <span className="hidden sm:inline text-sm font-medium">Chọn từ thư viện</span>
                    </button>
                  </div>
                  {errors.ogImageUrl && <p className="text-xs text-destructive mt-1">{errors.ogImageUrl}</p>}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h3 className="font-semibold mb-3">Structured Data (JSON-LD)</h3>
              <div>
                <textarea value={schemaJson} onChange={e => setSchemaJson(e.target.value)} rows={5} placeholder='{ "@context": "https://schema.org", ... }' className={`w-full p-2 border rounded-md font-mono text-xs ${errors.schemaJson ? 'border-destructive' : 'border-input'} bg-background`} />
                {errors.schemaJson && <p className="text-xs text-destructive mt-1">{errors.schemaJson}</p>}
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="bg-muted/30 p-6 rounded-lg border border-border space-y-8">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-4"><Eye className="w-4 h-4"/> Google Snippet Preview</h3>
              <div className="bg-white p-4 rounded-md shadow-sm">
                <div className="text-sm text-gray-800 truncate mb-1">{canonicalUrl || `https://cong-bo.hjcnt.com.vn${page?.routePath}`}</div>
                <div className="text-xl text-blue-800 font-medium hover:underline cursor-pointer truncate">{title || 'Tiêu đề trang'}</div>
                <div className="text-sm text-gray-600 mt-1 line-clamp-2">{description || 'Mô tả trang sẽ hiển thị ở đây trên kết quả tìm kiếm...'}</div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-4"><Eye className="w-4 h-4"/> Social Card Preview</h3>
              <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
                {ogImageUrl || siteSettings?.defaultOgImageUrl ? (
                  <div className="h-48 bg-cover bg-center border-b border-gray-200" style={{ backgroundImage: `url(${ogImageUrl || siteSettings?.defaultOgImageUrl})` }} />
                ) : (
                  <div className="h-48 bg-gray-100 flex items-center justify-center text-gray-400 border-b border-gray-200">No Image provided</div>
                )}
                <div className="p-4 bg-gray-50">
                  <div className="text-xs text-gray-500 uppercase mb-1">cong-bo.hjcnt.com.vn</div>
                  <div className="font-semibold text-gray-900 truncate">{ogTitle || title || 'Tiêu đề'}</div>
                  <div className="text-sm text-gray-600 line-clamp-1 mt-1">{ogDescription || description || 'Mô tả ngắn gọn...'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button onClick={handleCancel} disabled={saving} className="px-4 py-2 border border-input rounded-md hover:bg-muted font-medium transition-colors">
            Hủy
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 font-medium transition-colors">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu thay đổi
          </button>
        </div>
        
        <MediaAssetPickerDialog 
          isOpen={pickerOpen} 
          onClose={() => setPickerOpen(false)} 
          onSelect={handlePickerSelect} 
          defaultAssetType={pickerType} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Site Assets Section */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
          <h2 className="font-semibold text-foreground flex items-center gap-2"><Globe className="w-5 h-5"/> Site Assets (Cấu hình chung toàn trang)</h2>
          {!editingSite && (
            <button onClick={handleEditSite} className="text-sm flex items-center gap-2 text-primary hover:underline">
              <Edit2 className="w-4 h-4" /> Chỉnh sửa
            </button>
          )}
        </div>
        
        {editingSite ? (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Tên trang web (Site Name)</label>
                <input value={siteForm.siteName || ''} onChange={e => setSiteForm({...siteForm, siteName: e.target.value})} className={`w-full p-2 border rounded-md bg-background ${siteErrors.siteName ? 'border-destructive' : 'border-input'}`} />
                {siteErrors.siteName && <p className="text-xs text-destructive mt-1">{siteErrors.siteName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Favicon URL (1:1, khuyên dùng PNG/SVG)</label>
                <div className="flex gap-2">
                  <input value={siteForm.faviconUrl || ''} onChange={e => setSiteForm({...siteForm, faviconUrl: e.target.value})} placeholder="/favicon.png" className={`flex-1 p-2 border rounded-md bg-background ${siteErrors.faviconUrl ? 'border-destructive' : 'border-input'}`} />
                  <button onClick={() => openPicker('site_favicon', 'favicon')} className="px-3 py-2 bg-muted hover:bg-primary/10 hover:text-primary rounded-md border border-input text-sm font-medium shrink-0">Thư viện</button>
                </div>
                {siteErrors.faviconUrl && <p className="text-xs text-destructive mt-1">{siteErrors.faviconUrl}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Apple Touch Icon URL (180x180)</label>
                <div className="flex gap-2">
                  <input value={siteForm.appleTouchIconUrl || ''} onChange={e => setSiteForm({...siteForm, appleTouchIconUrl: e.target.value})} placeholder="/apple-touch-icon.png" className="flex-1 p-2 border border-input rounded-md bg-background" />
                  <button onClick={() => openPicker('site_apple', 'apple_touch_icon')} className="px-3 py-2 bg-muted hover:bg-primary/10 hover:text-primary rounded-md border border-input text-sm font-medium shrink-0">Thư viện</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Web App Icon 192x192 URL</label>
                <div className="flex gap-2">
                  <input value={siteForm.webAppIcon192Url || ''} onChange={e => setSiteForm({...siteForm, webAppIcon192Url: e.target.value})} placeholder="/icon-192.png" className="flex-1 p-2 border border-input rounded-md bg-background" />
                  <button onClick={() => openPicker('site_app192', 'web_app_icon')} className="px-3 py-2 bg-muted hover:bg-primary/10 hover:text-primary rounded-md border border-input text-sm font-medium shrink-0">Thư viện</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Web App Icon 512x512 URL</label>
                <div className="flex gap-2">
                  <input value={siteForm.webAppIcon512Url || ''} onChange={e => setSiteForm({...siteForm, webAppIcon512Url: e.target.value})} placeholder="/icon-512.png" className="flex-1 p-2 border border-input rounded-md bg-background" />
                  <button onClick={() => openPicker('site_app512', 'web_app_icon')} className="px-3 py-2 bg-muted hover:bg-primary/10 hover:text-primary rounded-md border border-input text-sm font-medium shrink-0">Thư viện</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Default OG Image URL (Hình chia sẻ mặc định)</label>
                <div className="flex gap-2">
                  <input value={siteForm.defaultOgImageUrl || ''} onChange={e => setSiteForm({...siteForm, defaultOgImageUrl: e.target.value})} placeholder="https://..." className="flex-1 p-2 border border-input rounded-md bg-background" />
                  <button onClick={() => openPicker('site_og', 'og_image')} className="px-3 py-2 bg-muted hover:bg-primary/10 hover:text-primary rounded-md border border-input text-sm font-medium shrink-0">Thư viện</button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button onClick={() => setEditingSite(false)} disabled={savingSite} className="px-4 py-2 border border-input rounded-md hover:bg-muted font-medium transition-colors">Hủy</button>
              <button onClick={handleSaveSite} disabled={savingSite} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 font-medium transition-colors">
                {savingSite ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu Assets
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
             <div><span className="text-muted-foreground">Tên trang web:</span> <span className="font-medium">{siteSettings?.siteName || '-'}</span></div>
             <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Favicon:</span> 
                {siteSettings?.faviconUrl ? <img src={siteSettings.faviconUrl} className="w-5 h-5 object-contain rounded-sm" alt="favicon" /> : <span className="text-muted-foreground">Mặc định (/favicon.png)</span>}
             </div>
             <div><span className="text-muted-foreground">Default OG Image:</span> <span className="font-medium truncate max-w-xs inline-block align-bottom">{siteSettings?.defaultOgImageUrl || '-'}</span></div>
          </div>
        )}
      </div>

      {/* Pages SEO Cards */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-foreground text-lg">Quản lý SEO Routes</h2>
          <button onClick={loadPages} className="text-sm flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <RefreshCw className="w-4 h-4" /> Làm mới
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {pages.map((p) => {
            const score = calculateSeoScore(p);
            return (
              <div key={p.id} className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
                {/* Header */}
                <div className="p-4 border-b border-border bg-muted/10 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-foreground">{p.routePath}</span>
                    {p.robots.includes('noindex') ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/10 text-destructive uppercase tracking-wider">Noindex</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wider">Index</span>
                    )}
                  </div>
                  <button onClick={() => handleEdit(p)} className="p-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-md transition-colors" title="Chỉnh sửa">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Body */}
                <div className="p-4 flex-1 space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm line-clamp-2" title={p.title}>{p.title || <span className="text-destructive font-normal italic">Chưa cấu hình Title</span>}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2" title={p.description}>{p.description || <span className="text-destructive font-normal italic">Chưa cấu hình Description</span>}</p>
                  </div>

                  {/* Visual Status Badges */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {score >= 80 ? (
                      <div className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-200">
                        <CheckCircle className="w-3.5 h-3.5" /> Good SEO
                      </div>
                    ) : score >= 50 ? (
                      <div className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                        <Info className="w-3.5 h-3.5" /> Needs tuning
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded-md border border-destructive/20">
                        <AlertTriangle className="w-3.5 h-3.5" /> Poor SEO
                      </div>
                    )}
                    
                    {!p.ogImageUrl && !siteSettings?.defaultOgImageUrl && (
                      <div className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-200" title="Không có Open Graph Image">
                        <ImageIcon className="w-3.5 h-3.5" /> Missing Image
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Score */}
                <div className="px-4 py-3 bg-muted/20 border-t border-border flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">SEO Health Score</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-destructive'}`} 
                        style={{ width: `${Math.min(score, 100)}%` }}
                      />
                    </div>
                    <span className="font-bold w-8 text-right">{score}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <MediaAssetPickerDialog 
        isOpen={pickerOpen && !editingId} // Only show this instance if editing site settings
        onClose={() => setPickerOpen(false)} 
        onSelect={handlePickerSelect} 
        defaultAssetType={pickerType} 
      />
    </div>
  );
}
