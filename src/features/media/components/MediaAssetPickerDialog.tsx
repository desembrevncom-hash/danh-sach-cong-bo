import React, { useState, useEffect, useRef } from 'react';
import { MediaAsset, MediaAssetType } from '../types';
import { listMediaAssets, uploadMediaAsset } from '../services/mediaAssetService';
import { validateMediaFile } from '../utils/mediaValidation';
import { toast } from 'sonner';
import { X, Upload, RefreshCw, Image as ImageIcon } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  defaultAssetType?: MediaAssetType | '';
};

export function MediaAssetPickerDialog({ isOpen, onClose, onSelect, defaultAssetType = '' }: Props) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filterType, setFilterType] = useState<MediaAssetType | ''>(defaultAssetType);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFilterType(defaultAssetType);
      fetchAssets(defaultAssetType);
    }
  }, [isOpen, defaultAssetType]);

  const fetchAssets = async (type: MediaAssetType | '') => {
    setLoading(true);
    const { ok, data, error } = await listMediaAssets(type ? { assetType: type } : undefined);
    if (ok && data) {
      setAssets(data);
    } else {
      toast.error(error || 'Không thể tải thư viện ảnh');
    }
    setLoading(false);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as MediaAssetType | '';
    setFilterType(newType);
    fetchAssets(newType);
  };

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
    const { ok, data, error } = await uploadMediaAsset(file, { assetType });

    if (ok && data) {
      toast.success('Tải ảnh lên thành công');
      fetchAssets(filterType);
      // Auto select the new image
      onSelect(data.publicUrl);
      onClose();
    } else {
      toast.error(error || 'Lỗi khi tải ảnh lên');
    }
    setUploading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-4xl max-h-[85vh] rounded-xl shadow-lg border border-border flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
          <h2 className="text-lg font-semibold text-foreground">Chọn ảnh từ thư viện</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-border flex flex-wrap gap-4 items-center justify-between bg-card">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Lọc theo:</span>
            <select 
              value={filterType} 
              onChange={handleFilterChange}
              className="p-1.5 border border-input rounded-md bg-background text-sm min-w-[150px]"
            >
              <option value="">Tất cả loại ảnh</option>
              <option value="favicon">Favicon</option>
              <option value="apple_touch_icon">Apple Touch Icon</option>
              <option value="web_app_icon">Web App Icon</option>
              <option value="og_image">OG Image</option>
              <option value="brand_logo">Brand Logo</option>
              <option value="product_image">Product Image</option>
              <option value="misc">Khác</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
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
              className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Tải ảnh mới
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-muted/10">
          {loading ? (
            <div className="py-12 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="mt-2 text-muted-foreground">Đang tải...</p>
            </div>
          ) : assets.length === 0 ? (
            <div className="py-16 text-center">
              <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground opacity-30 mb-4" />
              <p className="text-muted-foreground mb-4">Chưa có ảnh nào phù hợp.</p>
              <button onClick={() => fileInputRef.current?.click()} className="text-primary font-medium hover:underline">Tải lên ngay</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {assets.map(asset => (
                <div 
                  key={asset.id} 
                  onClick={() => {
                    onSelect(asset.publicUrl);
                    onClose();
                  }}
                  className="bg-card border border-border rounded-lg overflow-hidden flex flex-col group cursor-pointer hover:border-primary transition-colors"
                >
                  <div className="aspect-square bg-muted/30 relative flex items-center justify-center overflow-hidden p-2">
                    <img src={asset.publicUrl} alt={asset.fileName} className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="p-2 text-[10px] sm:text-xs border-t border-border flex-1">
                    <div className="font-medium truncate" title={asset.fileName}>{asset.fileName}</div>
                    <div className="text-muted-foreground mt-0.5">
                      {asset.width && asset.height ? `${asset.width}x${asset.height}` : 'No dims'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
