import React, { useState, useEffect } from 'react';
import { SeoPage } from '../types';
import { fetchAllSeoPagesForAdmin, updateSeoPage } from '../services/seoService';
import { validateSeoCanonicalUrl, validateSeoImageUrl, validateSeoRobots, validateSeoSchemaJson } from '../utils/seoValidation';
import { toast } from 'sonner';
import { Edit2, Save, X, RefreshCw, Eye } from 'lucide-react';

export function SeoManagementTab() {
  const [pages, setPages] = useState<SeoPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    setLoading(true);
    const { ok, data, error } = await fetchAllSeoPagesForAdmin();
    if (ok && data) {
      setPages(data);
    } else {
      toast.error(error || 'Không thể tải danh sách trang SEO');
    }
    setLoading(false);
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

  if (loading) {
    return <div className="p-8 text-center"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" /></div>;
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
                  <input value={ogImageUrl} onChange={e => setOgImageUrl(e.target.value)} className={`w-full p-2 border rounded-md ${errors.ogImageUrl ? 'border-destructive' : 'border-input'} bg-background`} />
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
                {ogImageUrl ? (
                  <div className="h-48 bg-cover bg-center border-b border-gray-200" style={{ backgroundImage: `url(${ogImageUrl})` }} />
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
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
        <h2 className="font-semibold text-foreground">Quản lý SEO Routes</h2>
        <button onClick={loadPages} className="text-sm flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <RefreshCw className="w-4 h-4" /> Làm mới
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground uppercase">
            <tr>
              <th className="px-6 py-3 font-medium">Route Path</th>
              <th className="px-6 py-3 font-medium">Page Key</th>
              <th className="px-6 py-3 font-medium">Title</th>
              <th className="px-6 py-3 font-medium">Robots</th>
              <th className="px-6 py-3 font-medium text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pages.map((p) => (
              <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-6 py-4 font-mono font-medium">{p.routePath}</td>
                <td className="px-6 py-4">{p.pageKey}</td>
                <td className="px-6 py-4 truncate max-w-[200px]" title={p.title}>{p.title}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.robots.includes('noindex') ? 'bg-destructive/10 text-destructive' : 'bg-green-100 text-green-700'}`}>
                    {p.robots}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleEdit(p)} className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium">
                    <Edit2 className="w-3.5 h-3.5" />
                    Chỉnh sửa
                  </button>
                </td>
              </tr>
            ))}
            {pages.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  Chưa có dữ liệu SEO. Hãy chắc chắn đã chạy script migration.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
