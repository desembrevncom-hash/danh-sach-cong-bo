import { supabase } from "@/integrations/supabase/client";
import { MediaAsset, MediaAssetType } from "../types";
import { generateSafeFileName } from "../utils/mediaValidation";

export type UploadOptions = {
  assetType: MediaAssetType;
  brand?: string;
  usedFor?: string;
};

// Helper function to get image dimensions
const getImageDimensions = (file: File): Promise<{ width: number; height: number } | null> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      return resolve(null);
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
};

// Map DB snake_case to camelCase
function mapMediaAsset(row: Record<string, unknown>): MediaAsset {
  return {
    id: String(row.id),
    bucket: String(row.bucket),
    path: String(row.path),
    publicUrl: String(row.public_url),
    assetType: row.asset_type as MediaAssetType,
    fileName: String(row.file_name),
    mimeType: row.mime_type as string | null,
    sizeBytes: row.size_bytes as number | null,
    width: row.width as number | null,
    height: row.height as number | null,
    altText: row.alt_text as string | null,
    brand: row.brand as string | null,
    usedFor: row.used_for as string | null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function uploadMediaAsset(file: File, options: UploadOptions): Promise<{ ok: boolean; data?: MediaAsset; error?: string }> {
  try {
    // 1. Get image dimensions client-side
    const dimensions = await getImageDimensions(file);

    // 2. Generate stable path
    const safeName = generateSafeFileName(file.name);
    const path = `${options.assetType}/${safeName}`;

    // 3. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('site-assets')
      .upload(path, file, {
        cacheControl: '31536000', // 1 year cache
        upsert: false
      });

    if (uploadError) {
      return { ok: false, error: `Upload failed: ${uploadError.message}` };
    }

    // 4. Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('site-assets')
      .getPublicUrl(path);

    const publicUrl = publicUrlData.publicUrl;

    // 5. Insert media_assets row
    const insertPayload = {
      bucket: 'site-assets',
      path,
      public_url: publicUrl,
      asset_type: options.assetType,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      width: dimensions?.width || null,
      height: dimensions?.height || null,
      brand: options.brand || null,
      used_for: options.usedFor || null,
    };

    const { data: dbData, error: dbError } = await supabase
      .from('media_assets')
      .insert(insertPayload)
      .select()
      .single();

    if (dbError) {
      return { ok: false, error: `Database insert failed: ${dbError.message}` };
    }

    return { ok: true, data: mapMediaAsset(dbData) };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function listMediaAssets(filters?: { assetType?: MediaAssetType, brand?: string }): Promise<{ ok: boolean; data?: MediaAsset[]; error?: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    
    let url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/media_assets?select=*&deleted_at=is.null&order=created_at.desc`;
    if (filters?.assetType) url += `&asset_type=eq.${filters.assetType}`;
    if (filters?.brand) url += `&brand=eq.${filters.brand}`;

    const res = await fetch(url, {
      headers: {
        "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Authorization": `Bearer ${token || ''}`,
      },
      cache: "no-store"
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return { ok: false, error: `Failed to fetch media assets: ${errText}` };
    }
    const data = await res.json();
    return { ok: true, data: data.map(mapMediaAsset) };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function softDeleteMediaAsset(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    
    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/media_assets?id=eq.${id}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Authorization": `Bearer ${token || ''}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({ deleted_at: new Date().toISOString() }),
      cache: "no-store"
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return { ok: false, error: `Failed to delete media asset: ${errText}` };
    }
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
