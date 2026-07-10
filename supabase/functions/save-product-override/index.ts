import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAdminAccess } from "../_shared/adminAuth.ts";


const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ALLOWED_ORIGINS_ENV = Deno.env.get("ALLOWED_ORIGINS") || "";
const allowedOrigins = ALLOWED_ORIGINS_ENV.split(",").map(s => s.trim()).filter(Boolean);

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const isAllowed = allowedOrigins.length === 0 || allowedOrigins.includes(origin);
  const allowOrigin = isAllowed ? (origin || "*") : (allowedOrigins[0] || "*");
  
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}


// TODO: Milestone 4B - Audit Log & Backup JSON
// async function uploadAuditLog(action: string, payload: any, result: any, req: Request) {
//   // Example: Save JSON to admin-audit-logs bucket
// }

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(200, { error: "Method not allowed" });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(400, { success: false, error: "Yêu cầu không hợp lệ" });
  }



  const authResult = await requireAdminAccess(req);
  if (!authResult.ok) {
    return json(authResult.status, { success: false, error: authResult.error });
  }
  const currentUserId = authResult.userId;


  // --- Validate Payload ---
        if ("productId" in body && typeof body.productId !== "string") return json(400, { success: false, error: "Dữ liệu không hợp lệ: productId" });
if ("name" in body && typeof body.name === "string" && body.name.length > 255) return json(400, { success: false, error: "Tên quá dài" });
  if ("desc" in body && typeof body.desc === "string" && body.desc.length > 2000) return json(400, { success: false, error: "Mô tả quá dài" });
  if ("section" in body && typeof body.section === "string" && body.section.length > 100) return json(400, { success: false, error: "Section quá dài" });
  if ("deleted" in body && typeof body.deleted !== "boolean") return json(400, { success: false, error: "Dữ liệu không hợp lệ: deleted" });
  if ("is_custom" in body && typeof body.is_custom !== "boolean") return json(400, { success: false, error: "Dữ liệu không hợp lệ: is_custom" });
  if ("link_url" in body && body.link_url !== null && typeof body.link_url !== "string") return json(400, { success: false, error: "Dữ liệu không hợp lệ: link_url" });
  if ("link_url_2" in body && body.link_url_2 !== null && typeof body.link_url_2 !== "string") return json(400, { success: false, error: "Dữ liệu không hợp lệ: link_url_2" });
  if ("image_url" in body && body.image_url !== null && typeof body.image_url !== "string") return json(400, { success: false, error: "Dữ liệu không hợp lệ: image_url" });

  const actionStr = String(body.action ?? "upsert");
  if (!["upsert", "create", "hard_delete"].includes(actionStr) && !Array.isArray(body.products)) {
    return json(400, { success: false, error: "Hành động không hợp lệ" });
  }
  // -------------------------

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  // Bulk upsert support
  const action = String(body.action ?? "upsert");

  // Hard delete a custom product (or unset deleted flag — handled via upsert)
  
  let productId: string;
  let legacy_no: number;
  let brand: string = "desembre"; // default

  if (action === "create") {
    brand = ("brand" in body && typeof body.brand === "string" && body.brand.trim() !== "") ? body.brand.trim() : "desembre";

    // Allocate next no >= 1000 for custom items per brand
    const { data: maxRow } = await supabase
      .from("product_identities")
      .select("legacy_no")
      .eq("brand", brand)
      .gte("legacy_no", 1000)
      .order("legacy_no", { ascending: false })
      .limit(1)
      .maybeSingle();
    legacy_no = (maxRow?.legacy_no ?? 999) + 1;

    // Insert into product_identities
    const { data: newIdentity, error: idErr } = await supabase
      .from("product_identities")
      .insert({ brand, legacy_no })
      .select("id")
      .single();
    
    if (idErr) return json(500, { success: false, error: "Lỗi tạo Identity: " + idErr.message });
    productId = newIdentity.id;

  } else {
    productId = String(body.productId);
    if (!productId || productId === "undefined") {
      return json(400, { success: false, error: "Thiếu productId" });
    }

    // COMPATIBILITY BOUNDARY (Round 6)
    // Lookup legacy_no from product_identities.
    // In the future (Round 7), product_overrides.no will be dropped,
    // and we will mutate product_overrides using productId directly.
    const { data: idRow, error: idErr } = await supabase
      .from("product_identities")
      .select("legacy_no, brand")
      .eq("id", productId)
      .single();
    
    if (idErr || !idRow) return json(400, { success: false, error: "Không tìm thấy Product Identity UUID" });
    legacy_no = idRow.legacy_no;
    brand = idRow.brand;
  }

  if (action === "hard_delete") {
    const { error } = await supabase.from("product_overrides").delete().eq("id", productId);
    if (error) return json(500, { success: false, error: `Lỗi DB: ${error.message}` });
    return json(200, { success: true });
  }

  // Fetch existing record
  const { data: existing } = await supabase
    .from("product_overrides")
    .select("*")
    .eq("id", productId)
    .maybeSingle();

  // Optional image upload
  let image_url: string | null | undefined = undefined;
  if ("image_data_url" in body) {
    const dataUrl = body.image_data_url as string | null;
    if (dataUrl === null || dataUrl === "") {
      image_url = null;
    } else if (typeof dataUrl === "string" && dataUrl.startsWith("data:")) {
      const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!match) return json(200, { error: "Ảnh không hợp lệ" });
      const mime = match[1];
      const ext = mime.split("/")[1].split("+")[0].replace("jpeg", "jpg");
      const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
      if (bytes.length > 2 * 1024 * 1024) return json(200, { error: "Ảnh quá lớn (tối đa 2MB)" });
      const path = `product-${legacy_no}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, bytes, { contentType: mime, upsert: true });
      if (upErr) {
        console.error("Storage upload error:", upErr);
        return json(500, { error: `Không thể tải ảnh lên Storage. Chi tiết: ${upErr.message}` });
      }
      const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
      image_url = pub.publicUrl;
    }
  } else if ("image_url" in body) {
    const v = body.image_url;
    image_url = v === null || v === "" ? null : String(v);
  }

  const pickStr = (k: string): string | null | undefined => {
    if (!(k in body)) return undefined;
    const v = body[k];
    if (v === null || v === "") return null;
    return String(v);
  };
  const link_url = pickStr("link_url");
  const link_url_2 = pickStr("link_url_2");
  const section = pickStr("section");
  const name = pickStr("name");
  const desc = pickStr("desc");

  const deleted = "deleted" in body ? Boolean(body.deleted) : undefined;
  const is_custom = action === "create" ? true : ("is_custom" in body ? Boolean(body.is_custom) : undefined);

  const row: Record<string, unknown> = {
    id: productId,
    // Round 7B-1: no longer writing `no` to product_overrides.
    // legacy_no lives in product_identities; product_overrides uses id as PK.
    brand,
    image_url: image_url === undefined ? existing?.image_url ?? null : image_url,
    link_url: link_url === undefined ? existing?.link_url ?? null : link_url,
    link_url_2: link_url_2 === undefined ? existing?.link_url_2 ?? null : link_url_2,
    section: section === undefined ? existing?.section ?? null : section,
    name: name === undefined ? existing?.name ?? null : name,
    desc: desc === undefined ? existing?.desc ?? null : desc,
    deleted: deleted === undefined ? existing?.deleted ?? false : deleted,
    is_custom: is_custom === undefined ? existing?.is_custom ?? false : is_custom,
    updated_at: new Date().toISOString(),
  };

  const { data: saved, error } = await supabase
    .from("product_overrides")
    .upsert(row, { onConflict: "id" })
    .select()
    .maybeSingle();
  if (error) return json(500, { success: false, error: `Lỗi DB: ${error.message}` });

  // Update audit log placeholder (TODO)
  // ...

  return json(200, { success: true, row: { ...saved, productId } });

});
