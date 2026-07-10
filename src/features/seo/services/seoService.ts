import { supabase } from '@/integrations/supabase/client';
import { SeoPage } from '../types';
import { getDefaultSeoByRoute } from '../defaults';

// Simple in-memory cache for public routes to prevent excessive DB calls
const seoCache = new Map<string, SeoPage>();

export async function fetchSeoPageByRoute(routePath: string): Promise<SeoPage> {
  // Check cache first
  if (seoCache.has(routePath)) {
    return seoCache.get(routePath)!;
  }

  const { data, error } = await supabase
    .from('seo_pages')
    .select('*')
    .eq('route_path', routePath)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error('Lỗi khi tải cấu hình SEO:', error.message);
    }
    // Return default but don't cache it, so we can retry later
    return {
      id: `default-${routePath}`,
      isActive: true,
      ...getDefaultSeoByRoute(routePath),
    } as SeoPage;
  }

  const pageInfo: SeoPage = {
    id: data.id,
    routePath: data.route_path,
    pageKey: data.page_key,
    title: data.title,
    description: data.description,
    canonicalUrl: data.canonical_url,
    ogTitle: data.og_title,
    ogDescription: data.og_description,
    ogImageUrl: data.og_image_url,
    robots: data.robots,
    schemaJson: data.schema_json as Record<string, unknown> | null,
    isActive: data.is_active,
    updatedAt: data.updated_at
  };

  seoCache.set(routePath, pageInfo);
  return pageInfo;
}

export async function fetchAllSeoPagesForAdmin(): Promise<{ ok: boolean; data?: SeoPage[]; error?: string }> {
  const { data, error } = await supabase
    .from('seo_pages')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    return { ok: false, error: error.message };
  }

  const pages: SeoPage[] = data.map(d => ({
    id: d.id,
    routePath: d.route_path,
    pageKey: d.page_key,
    title: d.title,
    description: d.description,
    canonicalUrl: d.canonical_url,
    ogTitle: d.og_title,
    ogDescription: d.og_description,
    ogImageUrl: d.og_image_url,
    robots: d.robots,
    schemaJson: d.schema_json as Record<string, unknown> | null,
    isActive: d.is_active,
    updatedAt: d.updated_at
  }));

  return { ok: true, data: pages };
}

export async function updateSeoPage(id: string, payload: Partial<SeoPage>): Promise<{ ok: boolean; error?: string }> {
  const updateData: Record<string, unknown> = {};
  
  if (payload.title !== undefined) updateData.title = payload.title;
  if (payload.description !== undefined) updateData.description = payload.description;
  if (payload.canonicalUrl !== undefined) updateData.canonical_url = payload.canonicalUrl;
  if (payload.ogTitle !== undefined) updateData.og_title = payload.ogTitle;
  if (payload.ogDescription !== undefined) updateData.og_description = payload.ogDescription;
  if (payload.ogImageUrl !== undefined) updateData.og_image_url = payload.ogImageUrl;
  if (payload.robots !== undefined) updateData.robots = payload.robots;
  if (payload.schemaJson !== undefined) updateData.schema_json = payload.schemaJson;
  if (payload.isActive !== undefined) updateData.is_active = payload.isActive;
  
  updateData.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('seo_pages')
    .update(updateData)
    .eq('id', id);

  if (error) {
    return { ok: false, error: error.message };
  }

  // Clear cache for the updated route if possible, but since we don't know the route path directly from id here
  // easily without another query, we can just clear the whole cache. Admin updates are rare.
  seoCache.clear();

  return { ok: true };
}
