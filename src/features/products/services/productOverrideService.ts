import { supabase } from "@/integrations/supabase/client";
import type { ProductOverrideRow, SaveProductOverridePayload, SaveProductOrderPayload } from "../types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export async function fetchAllProductOverrides() {
  const { data, error } = await supabase.from("product_overrides").select("*");
  if (error) {
    return { ok: false as const, error: error.message ?? "Không thể tải dữ liệu từ Supabase" };
  }
  return { ok: true as const, data: data as ProductOverrideRow[] };
}

/**
 * Save a product override by calling the Edge Function.
 * No direct DB writes — Edge Function is the single source of truth.
 * No fallback: if the Edge Function fails, we surface the error.
 */
export async function saveProductOverride(payload: SaveProductOverridePayload, accessToken: string) {
  if (!accessToken) {
    return { ok: false as const, error: "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại." };
  }

  console.log("[add-product:edge-save:raw-fetch:start]");
  
  const url = `${SUPABASE_URL}/functions/v1/save-product-override`;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 30000);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    console.error("[add-product:edge-save:raw-fetch:error]", err);
    if (err instanceof Error && err.name === 'AbortError') {
      return { ok: false as const, error: "Lưu sản phẩm quá lâu. Vui lòng thử lại." };
    }
    return { ok: false as const, error: "Lỗi mạng hoặc hệ thống khi lưu sản phẩm." };
  } finally {
    clearTimeout(timeoutId);
  }

  console.log("[add-product:edge-save:raw-fetch:status]", { status: res.status });

  let data: Record<string, unknown> | null = null;
  try {
    data = await res.json();
  } catch (e) {
    console.error("Failed to parse edge function JSON:", e);
  }

  if (!res.ok) {
    console.error("[add-product:edge-save:raw-fetch:error]", { status: res.status, data });
    
    if (res.status === 401) {
      return { ok: false as const, error: "Phiên đăng nhập hết hạn hoặc bạn cần đăng nhập Admin." };
    }
    if (res.status === 403) {
      return { ok: false as const, error: "Bạn không có quyền thực hiện thao tác này." };
    }
    if (res.status === 409) {
      return { ok: false as const, error: data?.message || data?.error || "Dữ liệu bị trùng lặp." };
    }
    if (res.status === 400 || res.status === 500) {
      return { ok: false as const, error: data?.message || data?.error || (res.status === 400 ? "Dữ liệu không hợp lệ." : "Lỗi hệ thống máy chủ.") };
    }
    
    return { ok: false as const, error: data?.message || data?.error || `Lỗi không xác định (${res.status}).` };
  }

  console.log("[add-product:edge-save:raw-fetch:success]");

  if (data?.error) {
    return { ok: false as const, error: data.error as string };
  }
  return { ok: true as const, row: data?.row as ProductOverrideRow | undefined };
}

export async function saveProductOrder(payload: SaveProductOrderPayload) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const { data, error, status } = await supabase.functions.invoke("save-product-order", {
    body: payload,
    headers,
  });

  if (status === 401) {
    return { ok: false as const, error: "Phiên đăng nhập hết hạn hoặc bạn cần đăng nhập Admin." };
  }
  if (status === 403) {
    return { ok: false as const, error: "Bạn không có quyền thực hiện thao tác này." };
  }
  if (status === 400) {
    return { ok: false as const, error: data?.error || "Dữ liệu không hợp lệ." };
  }
  if (status === 500) {
    return { ok: false as const, error: "Lỗi hệ thống máy chủ." };
  }

  if (error) {
    return { ok: false as const, error: error.message ?? "Lỗi mạng khi gọi Edge Function" };
  }
  if (data?.error) {
    return { ok: false as const, error: data.error as string };
  }
  return { ok: true as const, rows: data?.rows as ProductOverrideRow[] | undefined };
}
