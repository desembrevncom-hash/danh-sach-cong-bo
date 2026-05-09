import { supabase } from "@/integrations/supabase/client";

export type OverrideRow = {
  no: number;
  image_url: string | null;
  link_url: string | null;
  section: string | null;
  name: string | null;
  desc: string | null;
  deleted: boolean;
  is_custom: boolean;
};

type SavePayload = {
  no?: number;
  original_no?: number;
  password: string;
  action?: "upsert" | "create" | "hard_delete";
  image_data_url?: string | null;
  image_url?: string | null;
  link_url?: string | null;
  section?: string | null;
  name?: string | null;
  desc?: string | null;
  deleted?: boolean;
};

export async function saveProductOverride(payload: SavePayload) {
  if (payload.original_no && payload.original_no !== payload.no) {
    // If we are renumbering, delete the old record first
    await supabase.from('product_overrides').delete().eq('no', payload.original_no);
  }

  const { data, error } = await supabase.functions.invoke("save-product-override", {
    body: payload,
  });
  if (error) {
    return { ok: false as const, error: error.message ?? "Lỗi mạng" };
  }
  if (data?.error) {
    return { ok: false as const, error: data.error as string };
  }
  return { ok: true as const, row: data?.row as OverrideRow | undefined };
}
