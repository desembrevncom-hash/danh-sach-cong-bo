import { supabase } from "@/integrations/supabase/client";
import type { ProductOverrideRow, SaveProductOverridePayload } from "../types";

export async function fetchAllProductOverrides() {
  const { data, error } = await supabase.from("product_overrides").select("*");
  if (error) {
    return { ok: false as const, error: error.message ?? "Không thể tải dữ liệu từ Supabase" };
  }
  return { ok: true as const, data: data as ProductOverrideRow[] };
}

export async function saveProductOverride(payload: SaveProductOverridePayload) {
  // Allocate next ID for custom items client-side
  if (payload.action === "create") {
    const { data: maxRow } = await supabase
      .from("product_overrides")
      .select("no")
      .gte("no", 1000)
      .order("no", { ascending: false })
      .limit(1)
      .maybeSingle();
      
    payload.no = (maxRow?.no ?? 999) + 1;
    payload.action = "upsert";
    payload.is_custom = true;
  }

  // Strictly call Supabase Edge Function (no direct database fallbacks)
  const { data, error } = await supabase.functions.invoke("save-product-override", {
    body: payload,
  });

  if (error) {
    return { ok: false as const, error: error.message ?? "Lỗi mạng" };
  }
  if (data?.error) {
    return { ok: false as const, error: data.error as string };
  }
  return { ok: true as const, row: data?.row as ProductOverrideRow | undefined };
}
