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
  const { data, error } = await supabase.functions.invoke("save-product-override", {
    body: payload,
  });

  if (error) {
    return { ok: false as const, error: error.message ?? "Lỗi mạng khi gọi Edge Function" };
  }
  if (data?.error) {
    return { ok: false as const, error: data.error as string };
  }
  return { ok: true as const, row: data?.row as ProductOverrideRow | undefined };
}

export async function saveProductOrder(payload: SaveProductOrderPayload) {
  const { data, error } = await supabase.functions.invoke("save-product-order", {
    body: payload,
  });

  if (error) {
    return { ok: false as const, error: error.message ?? "Lỗi mạng khi gọi Edge Function" };
  }
  if (data?.error) {
    return { ok: false as const, error: data.error as string };
  }
  return { ok: true as const, rows: data?.rows as ProductOverrideRow[] | undefined };
}
