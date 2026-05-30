import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ProductOverrideRow, SaveProductOverridePayload } from "../types";

export async function fetchAllProductOverrides() {
  const { data, error } = await supabase.from("product_overrides").select("*");
  if (error) {
    return { ok: false as const, error: error.message ?? "Không thể tải dữ liệu từ Supabase" };
  }
  return { ok: true as const, data: data as ProductOverrideRow[] };
}

// Convert base64 data URL to Blob and upload directly to Supabase storage bucket
async function uploadImageDirectly(no: number, dataUrl: string): Promise<string> {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) throw new Error("Ảnh không hợp lệ");
  const mime = match[1];
  const ext = mime.split("/")[1].split("+")[0].replace("jpeg", "jpg");
  const binary = atob(match[2]);
  const array = [];
  for (let i = 0; i < binary.length; i++) {
    array.push(binary.charCodeAt(i));
  }
  const blob = new Blob([new Uint8Array(array)], { type: mime });
  const path = `product-${no}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, blob, { contentType: mime, upsert: true });
  if (error) throw error;
  const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
  return pub.publicUrl;
}

// Direct database mutation fallback (completely bypasses Edge Functions)
async function saveProductOverrideDirectly(payload: SaveProductOverridePayload) {
  try {
    if (payload.action === "hard_delete") {
      const { error } = await supabase.from("product_overrides").delete().eq("no", payload.no);
      if (error) return { ok: false as const, error: error.message };
      return { ok: true as const };
    }

    // Shifting logic direct DB
    if (payload.original_no && payload.no && payload.original_no !== payload.no && payload.action !== "create") {
      const originalNo = payload.original_no;
      const no = payload.no;
      const isMovingUp = originalNo > no;
      const minNo = isMovingUp ? no : originalNo + 1;
      const maxNo = isMovingUp ? originalNo - 1 : no;

      const { data: toShift } = await supabase
        .from("product_overrides")
        .select("*")
        .gte("no", minNo)
        .lte("no", maxNo)
        .order("no", { ascending: isMovingUp ? false : true });

      if (toShift && toShift.length > 0) {
        // Delete original first to prevent PK collision
        await supabase.from("product_overrides").delete().eq("no", originalNo);
        for (const item of toShift) {
          const newNo = isMovingUp ? item.no + 1 : item.no - 1;
          await supabase.from("product_overrides").update({ no: newNo }).eq("no", item.no);
        }
      }
    }

    // Handle optional client-side storage upload
    let image_url = payload.image_url;
    if (payload.image_data_url) {
      image_url = await uploadImageDirectly(payload.no, payload.image_data_url);
    }

    const row = {
      no: payload.no,
      image_url: image_url === undefined ? null : image_url,
      link_url: payload.link_url ?? null,
      section: payload.section ?? null,
      name: payload.name ?? null,
      desc: payload.desc ?? null,
      deleted: payload.deleted ?? false,
      is_custom: payload.is_custom ?? false,
      updated_at: new Date().toISOString(),
    };

    const { data: saved, error } = await supabase
      .from("product_overrides")
      .upsert(row, { onConflict: "no" })
      .select()
      .maybeSingle();

    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, row: saved as ProductOverrideRow };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Không thể thực hiện tác vụ trực tiếp" };
  }
}

export async function saveProductOverride(payload: SaveProductOverridePayload) {
  // Allocate ID for custom items
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

  try {
    // Try calling Edge Function first
    const { data, error } = await supabase.functions.invoke("save-product-override", {
      body: payload,
    });
    
    if (error) {
      console.warn("Edge Function failed, falling back to direct database writes:", error);
      return await saveProductOverrideDirectly(payload);
    }
    
    if (data?.error) {
      return { ok: false as const, error: data.error as string };
    }
    return { ok: true as const, row: data?.row as ProductOverrideRow | undefined };
  } catch (e) {
    console.warn("Edge Function failed with exception, falling back to direct database writes:", e);
    return await saveProductOverrideDirectly(payload);
  }
}
