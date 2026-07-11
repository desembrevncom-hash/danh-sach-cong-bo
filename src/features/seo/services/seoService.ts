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

  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/seo_pages?route_path=eq.${encodeURIComponent(routePath)}&is_active=eq.true&select=*&limit=1`;
    const res = await fetch(url, {
      headers: {
        "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch seo page: ${res.statusText}`);
    }

    const data = await res.json();
    if (!data || data.length === 0) {
      throw new Error("No SEO data found");
    }

    const row = data[0];
    const pageInfo: SeoPage = {
      id: row.id,
      routePath: row.route_path,
      pageKey: row.page_key,
      title: row.title,
      description: row.description,
      canonicalUrl: row.canonical_url,
      ogTitle: row.og_title,
      ogDescription: row.og_description,
      ogImageUrl: row.og_image_url,
      robots: row.robots,
      schemaJson: row.schema_json as Record<string, unknown> | null,
      isActive: row.is_active,
      updatedAt: row.updated_at
    };
    
    seoCache.set(routePath, pageInfo);
    return pageInfo;
  } catch (error) {
    console.error('Lỗi khi tải cấu hình SEO:', error instanceof Error ? error.message : String(error));
    return {
      id: `default-${routePath}`,
      isActive: true,
      ...getDefaultSeoByRoute(routePath),
    } as SeoPage;
  }
}

export async function fetchAllSeoPagesForAdmin(): Promise<{ ok: boolean; data?: SeoPage[]; error?: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    
    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/seo_pages?select=*&order=created_at.asc`;
    const res = await fetch(url, {
      headers: {
        "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Authorization": `Bearer ${token || ''}`,
      },
      cache: "no-store"
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return { ok: false, error: `Failed to fetch seo pages: ${errText}` };
    }

    const data = await res.json();
    const pages: SeoPage[] = data.map((d: any) => ({
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
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function updateSeoPage(id: string, payload: Partial<SeoPage>): Promise<{ ok: boolean; error?: string }> {
  try {
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

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    
    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/seo_pages?id=eq.${id}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Authorization": `Bearer ${token || ''}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(updateData),
      cache: "no-store"
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return { ok: false, error: `Failed to update seo page: ${errText}` };
    }

    // Clear cache for the updated route if possible
    seoCache.clear();

    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
