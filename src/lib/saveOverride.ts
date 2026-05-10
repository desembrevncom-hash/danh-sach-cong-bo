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
  // The Edge Function handles deletion during shifting, no need for client-side delete.
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
