import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MediaAsset, MediaAssetType } from '../types';
import { listMediaAssets, uploadMediaAsset, softDeleteMediaAsset } from '../services/mediaAssetService';
import { validateMediaFile } from '../utils/mediaValidation';
import { toast } from 'sonner';
import { Upload, Trash2, Copy, RefreshCw, Image as ImageIcon, Filter } from 'lucide-react';
import { DashboardErrorState } from '@/components/ui/dashboard-error';
import { withTimeout, getErrorMessage } from '@/lib/asyncState';

const ASSET_TYPES: { value: MediaAssetType; label: string }[] = [
  { value: 'favicon', label: 'Favicon' },
  { value: 'apple_touch_icon', label: 'Apple Touch Icon' },
  { value: 'web_app_icon', label: 'Web App Icon' },
  { value: 'og_image', label: 'OG Image' },
  { value: 'brand_logo', label: 'Brand Logo' },
  { value: 'product_image', label: 'Product Image' },
  { value: 'misc', label: 'Khác' },
];

export function MediaLibraryTab() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const requestIdRef = useRef(0);
  
  // Filters
  const [filterType, setFilterType] = useState<MediaAssetType | ''>('');
  const [filterBrand, setFilterBrand] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssets = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setErrorState(null);
    const filters: Record<string, string> = {};
    if (filterType) filters.assetType = filterType;
    if (filterBrand) filters.brand = filterBrand;

    try {
      const result = await withTimeout(listMediaAssets(filters as { assetType?: MediaAssetType, brand?: string }), 12000);
      if (requestId !== requestIdRef.current) return;
      if (result.ok && result.data) {
        setAssets(result.data);
      } else {
        setErrorState(result.error || 'Không thể tải thư viện ảnh');
      }
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setErrorState(getErrorMessage(error));
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [filterType, filterBrand]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = '';

    const assetType = filterType || 'misc';
    
    const validationError = validateMediaFile(file, assetType);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setUploading(true);
    const { ok, error } = await uploadMediaAsset(file, {
      assetType,
      brand: filterBrand || undefined
    });

    if (ok) {
      toast.success('Tải ảnh lên thành công');
      fetchAssets();
    } else {
      toast.error(error || 'Lỗi khi tải ảnh lên');
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa ảnh này (soft delete)?')) return;
    
    const { ok, error } = await softDeleteMediaAsset(id);
    if (ok) {
      toast.success('Đã xóa ảnh');
      fetchAssets();
    } else {
      toast.error(error || 'Không thể xóa ảnh');
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Đã copy URL');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-lg border border-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select 
              value={filterType} 
              onChange={e => setFilterType(e.target.value as MediaAssetType | '')}
              className="p-2 border border-input rounded-md bg-background text-sm min-w-[150px]"
            >
              <option value="">Tất cả loại ảnh</option>
              {ASSET_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <select 
            value={filterBrand} 
            onChange={e => setFilterBrand(e.target.value)}
            className="p-2 border border-input rounded-md bg-background text-sm min-w-[120px]"
          >
            <option value="">Tất cả Brand</option>
            <option value="Desembre">Desembre</option>
            <option value="Dermagarden">Dermagarden</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchAssets} className="p-2 border border-input rounded-md hover:bg-muted" title="Làm mới">
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
            accept="image/png, image/jpeg, image/webp, image/x-icon" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Đang tải lên...' : 'Tải ảnh lên'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Đang tải thư viện ảnh...</p>
        </div>
      ) : errorState ? (
        <DashboardErrorState message={errorState} onRetry={fetchAssets} />
      ) : assets.length === 0 ? (
        <div className="py-16 text-center bg-card border border-border border-dashed rounded-lg">
          <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-4" />
          <h3 className="text-lg font-medium text-foreground">Không có ảnh nào</h3>
          <p className="text-muted-foreground mb-4">Hãy tải ảnh lên để quản lý ở đây.</p>
          <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-primary/10 text-primary rounded-md font-medium">Tải ảnh đầu tiên</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {assets.map(asset => (
            <div key={asset.id} className="bg-card border border-border rounded-lg overflow-hidden flex flex-col group">
              <div className="aspect-square bg-muted/30 relative flex items-center justify-center overflow-hidden p-4">
                <img 
                  src={asset.publicUrl} 
                  alt={asset.fileName} 
                  loading="lazy" 
                  decoding="async"
                  className="max-w-full max-h-full object-contain" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).onerror = null;
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%23ccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                  }}
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => handleCopyUrl(asset.publicUrl)} className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white" title="Copy URL">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(asset.id)} className="p-2 bg-destructive/80 hover:bg-destructive rounded-full text-white" title="Xóa">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-3 text-xs border-t border-border flex flex-col justify-between flex-1">
                <div className="font-medium text-foreground truncate mb-1" title={asset.fileName}>{asset.fileName}</div>
                <div className="text-muted-foreground flex justify-between">
                  <span>{ASSET_TYPES.find(t => t.value === asset.assetType)?.label || asset.assetType}</span>
                  {asset.sizeBytes && <span>{(asset.sizeBytes / 1024).toFixed(0)} KB</span>}
                </div>
                {asset.width && asset.height && (
                  <div className="text-muted-foreground mt-1">
                    {asset.width}x{asset.height}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
