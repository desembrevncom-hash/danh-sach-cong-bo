import { supabase } from "@/integrations/supabase/client";
import type { ProductOverrideRow, SaveProductOverridePayload, SaveProductOrderPayload } from "../types";

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
export async function saveProductOverride(payload: SaveProductOverridePayload) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const { data, error, status } = await supabase.functions.invoke("save-product-override", {
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
    let msg = error.message ?? "Lỗi mạng khi gọi Edge Function";
    if (error.context instanceof Response) {
      try {
        const errData = await error.context.json();
        if (errData && errData.error) {
          msg = errData.error;
        }
      } catch (e) {
        console.error("Failed to parse edge function error response:", e);
      }
    }
    return { ok: false as const, error: msg };
  }
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
