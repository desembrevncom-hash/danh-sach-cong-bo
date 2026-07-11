import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAdminAccess } from "../_shared/adminAuth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ALLOWED_ORIGINS_ENV = Deno.env.get("ALLOWED_ORIGINS") || "";
const allowedOrigins = ALLOWED_ORIGINS_ENV.split(",").map(s => s.trim()).filter(Boolean);

function getCorsHeaders(req: Request) {
  return {
    "Access-Control-Allow-Origin": req.headers.get("origin") || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(200, { error: "Method not allowed" });

  let step = "init";
  try {
    console.log("[save-product-override:start]");
    
    step = "parse-body";
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json(400, { ok: false, success: false, error: "Yêu cầu không hợp lệ" });
    }

    console.log("[save-product-override:auth:start]");
    step = "auth";
    const authResult = await requireAdminAccess(req);
    if (!authResult.ok) {
      console.error("[save-product-override:auth:failed]", authResult.error);
      return json(authResult.status, { ok: false, success: false, error: authResult.error });
    }
    const userId = authResult.userId;
    console.log("[save-product-override:auth:success]", { userId });

    step = "validate-payload";
    // --- Validate Payload ---
    if ("productId" in body && typeof body.productId !== "string" && body.productId !== null) return json(400, { ok: false, success: false, error: "Dữ liệu không hợp lệ: productId" });
    if ("name" in body && typeof body.name === "string" && body.name.length > 255) return json(400, { ok: false, success: false, error: "Tên quá dài" });
    if ("desc" in body && typeof body.desc === "string" && body.desc.length > 2000) return json(400, { ok: false, success: false, error: "Mô tả quá dài" });
    if ("section" in body && typeof body.section === "string" && body.section.length > 100) return json(400, { ok: false, success: false, error: "Section quá dài" });
    if ("deleted" in body && typeof body.deleted !== "boolean") return json(400, { ok: false, success: false, error: "Dữ liệu không hợp lệ: deleted" });
    if ("is_custom" in body && typeof body.is_custom !== "boolean") return json(400, { ok: false, success: false, error: "Dữ liệu không hợp lệ: is_custom" });
    if ("link_url" in body && body.link_url !== null && typeof body.link_url !== "string") return json(400, { ok: false, success: false, error: "Dữ liệu không hợp lệ: link_url" });
    if ("link_url_2" in body && body.link_url_2 !== null && typeof body.link_url_2 !== "string") return json(400, { ok: false, success: false, error: "Dữ liệu không hợp lệ: link_url_2" });
    if ("image_url" in body && body.image_url !== null && typeof body.image_url !== "string") return json(400, { ok: false, success: false, error: "Dữ liệu không hợp lệ: image_url" });

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    
    // Fallback extractors
    const pickStr = (k: string): string | null | undefined => {
      if (!(k in body)) return undefined;
      const v = body[k];
      if (v === null || v === "") return null;
      return String(v);
    };

    let productId = pickStr("productId") ?? pickStr("id");
    const mode = (!productId) ? "create" : "update";
    let brand = pickStr("brand") || "desembre";
    const section = pickStr("section");
    const name = pickStr("name");
    const desc = pickStr("desc");
    const image_url = pickStr("image_url");
    const link_url = pickStr("link_url");
    const link_url_2 = pickStr("link_url_2");
    const deleted = "deleted" in body ? Boolean(body.deleted) : undefined;
    const is_custom = mode === "create" ? true : ("is_custom" in body ? Boolean(body.is_custom) : undefined);

    console.log("[save-product-override:payload]", { mode, productId, brand, section, name });

    let legacy_no: number;

    if (mode === "create") {
      console.log("[save-product-override:create:start]");
      
      console.log("[save-product-override:legacy-no:start]");
      step = "legacy-no";
      
      // Retry loop for legacy_no generation
      let newIdentityId = null;
      let retries = 0;
      
      while (retries < 3 && !newIdentityId) {
        const { data: maxRow, error: maxErr } = await supabase
          .from("product_identities")
          .select("legacy_no")
          .eq("brand", brand)
          .order("legacy_no", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (maxErr) {
          console.error("[save-product-override:error]", { step, message: "Lỗi lấy max legacy_no", details: maxErr });
          return json(500, { ok: false, success: false, error: "IDENTITY_READ_FAILED", message: "Không thể lấy số thứ tự." });
        }

        // Base off 1000 for custom items if no row exists
        legacy_no = Math.max((maxRow?.legacy_no ?? 999), 999) + 1;
        console.log(`[save-product-override:legacy-no:try] legacyNo=${legacy_no}, retry=${retries}`);

        console.log("[save-product-override:identity-insert:start]");
        step = "identity-insert";
        const { data: newIdentity, error: idErr } = await supabase
          .from("product_identities")
          .insert({ brand, legacy_no })
          .select("id")
          .single();
        
        if (idErr) {
          if (idErr.code === '23505') { // unique violation
             console.warn(`[save-product-override:identity-insert:duplicate] legacyNo=${legacy_no}`);
             retries++;
             continue;
          }
          console.error("[save-product-override:error]", { step, message: "Lỗi insert identity", details: idErr });
          return json(500, { ok: false, success: false, error: "IDENTITY_INSERT_FAILED", message: "Lỗi tạo Identity: " + idErr.message });
        }
        
        newIdentityId = newIdentity.id;
      }
      
      if (!newIdentityId) {
         return json(409, { ok: false, success: false, error: "IDENTITY_INSERT_TIMEOUT", message: "Không thể tạo mã sản phẩm do trùng lặp dữ liệu quá nhiều lần." });
      }

      productId = newIdentityId;
      console.log("[save-product-override:legacy-no:success]", { legacyNo: legacy_no });
      console.log("[save-product-override:identity-insert:success]", { productId });

    } else {
      step = "identity-lookup";
      const { data: idRow, error: idErr } = await supabase
        .from("product_identities")
        .select("legacy_no, brand")
        .eq("id", productId)
        .single();
      
      if (idErr || !idRow) {
        console.error("[save-product-override:error]", { step, message: "Không tìm thấy Product Identity UUID", details: idErr });
        return json(400, { ok: false, success: false, error: "NOT_FOUND", message: "Không tìm thấy Product Identity UUID" });
      }
      legacy_no = idRow.legacy_no;
      brand = idRow.brand;
    }

    const actionStr = String(body.action ?? "upsert");
    if (actionStr === "hard_delete") {
      step = "hard-delete";
      const { error } = await supabase.from("product_overrides").delete().eq("id", productId);
      if (error) {
         console.error("[save-product-override:error]", { step, message: "Lỗi xoá product", details: error });
         return json(500, { ok: false, success: false, error: "DELETE_FAILED", message: `Lỗi DB: ${error.message}` });
      }
      return json(200, { ok: true, success: true });
    }

    // Ensure catalog_sections exists for the given brand + section
    if (section) {
      console.log("[save-product-override:section-upsert:start]");
      step = "section-upsert";
      const { data: existingSec, error: checkSecErr } = await supabase
        .from("catalog_sections")
        .select("id")
        .eq("brand", brand)
        .eq("value", section)
        .maybeSingle();

      if (checkSecErr) {
        console.error("[save-product-override:error]", { step, message: "Lỗi kiểm tra section", details: checkSecErr });
        return json(500, { ok: false, success: false, error: "SECTION_CHECK_FAILED", message: "Lỗi kiểm tra nhóm sản phẩm: " + checkSecErr.message });
      }

      if (!existingSec) {
        const { data: maxOrderSec } = await supabase
          .from("catalog_sections")
          .select("sort_order")
          .eq("brand", brand)
          .order("sort_order", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        const nextSortOrder = (maxOrderSec?.sort_order ?? -10) + 10;
        const { error: secErr } = await supabase
          .from("catalog_sections")
          .insert({
            brand,
            value: section,
            label: section,
            active: true,
            sort_order: nextSortOrder
          });
        if (secErr) {
          console.error("[save-product-override:error]", { step, message: "Lỗi tạo catalog_section", details: secErr });
          return json(500, { ok: false, success: false, error: "SECTION_INSERT_FAILED", message: "Lỗi DB khi tạo nhóm sản phẩm: " + secErr.message });
        }
      }
      console.log("[save-product-override:section-upsert:success]");
    }

    console.log("[save-product-override:override-upsert:start]");
    step = "override-upsert";

    // Fetch existing record
    const { data: existing } = await supabase
      .from("product_overrides")
      .select("*")
      .eq("id", productId)
      .maybeSingle();

    const row: Record<string, unknown> = {
      id: productId,
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
      
    if (error) {
      console.error("[save-product-override:error]", { step, message: "Lỗi upsert override", details: error });
      return json(500, { ok: false, success: false, error: "OVERRIDE_UPSERT_FAILED", message: `Lỗi lưu thông tin sản phẩm: ${error.message}` });
    }
    
    console.log("[save-product-override:override-upsert:success]");
    console.log("[save-product-override:response]");

    return json(200, { ok: true, success: true, row: { ...saved, productId }, mode: mode === "create" ? "created" : "updated", productId });

  } catch (globalErr: unknown) {
    console.error("[save-product-override:error]", { step, message: "Unhandled exception", details: globalErr });
    return json(500, { ok: false, success: false, error: "INTERNAL_SERVER_ERROR", message: "Đã xảy ra lỗi không mong đợi." });
  }
});
