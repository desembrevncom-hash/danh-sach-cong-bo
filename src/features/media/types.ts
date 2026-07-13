export type MediaAssetType =
  | "favicon"
  | "apple_touch_icon"
  | "web_app_icon"
  | "og_image"
  | "brand_logo"
  | "product_image"
  | "misc";

export type MediaAsset = {
  id: string;
  bucket: string;
  path: string;
  publicUrl: string;
  assetType: MediaAssetType;
  fileName: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  width?: number | null;
  height?: number | null;
  altText?: string | null;
  brand?: string | null;
  usedFor?: string | null;
  createdAt: string;
  updatedAt: string;
};
