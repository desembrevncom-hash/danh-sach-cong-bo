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

  // --- Validate Payload ---
  if ("productId" in body && typeof body.productId !== "string" && body.productId !== null) return json(400, { success: false, error: "Dữ liệu không hợp lệ: productId" });
  if ("name" in body && typeof body.name === "string" && body.name.length > 255) return json(400, { success: false, error: "Tên quá dài" });
  if ("desc" in body && typeof body.desc === "string" && body.desc.length > 2000) return json(400, { success: false, error: "Mô tả quá dài" });
  if ("section" in body && typeof body.section === "string" && body.section.length > 100) return json(400, { success: false, error: "Section quá dài" });
  if ("deleted" in body && typeof body.deleted !== "boolean") return json(400, { success: false, error: "Dữ liệu không hợp lệ: deleted" });
  if ("is_custom" in body && typeof body.is_custom !== "boolean") return json(400, { success: false, error: "Dữ liệu không hợp lệ: is_custom" });
  if ("link_url" in body && body.link_url !== null && typeof body.link_url !== "string") return json(400, { success: false, error: "Dữ liệu không hợp lệ: link_url" });
  if ("link_url_2" in body && body.link_url_2 !== null && typeof body.link_url_2 !== "string") return json(400, { success: false, error: "Dữ liệu không hợp lệ: link_url_2" });
  if ("image_url" in body && body.image_url !== null && typeof body.image_url !== "string") return json(400, { success: false, error: "Dữ liệu không hợp lệ: image_url" });

  const actionStr = String(body.action ?? "upsert");
  if (!["upsert", "create", "hard_delete"].includes(actionStr)) {
    return json(400, { success: false, error: "Hành động không hợp lệ" });
  }
  // -------------------------

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const action = actionStr;
  
  let productId: string;
  let legacy_no: number;
  let brand: string = "desembre";

  if (action === "create") {
    brand = ("brand" in body && typeof body.brand === "string" && body.brand.trim() !== "") ? body.brand.trim() : "desembre";

    // Allocate next no >= 1000 for custom items per brand safely
    const { data: maxRow, error: maxErr } = await supabase
      .from("product_identities")
      .select("legacy_no")
      .eq("brand", brand)
      .gte("legacy_no", 1000)
      .order("legacy_no", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maxErr) {
      console.error("Lỗi lấy max legacy_no:", maxErr);
      return json(500, { success: false, error: "Lỗi tạo Identity: Không thể lấy số thứ tự." });
    }

    legacy_no = (maxRow?.legacy_no ?? 999) + 1;

    // Insert into product_identities
    const { data: newIdentity, error: idErr } = await supabase
      .from("product_identities")
      .insert({ brand, legacy_no })
      .select("id")
      .single();
    
    if (idErr) {
      console.error("Lỗi insert identity:", idErr);
      return json(500, { success: false, error: "Lỗi tạo Identity: " + idErr.message });
    }
    productId = newIdentity.id;

  } else {
    productId = String(body.productId);
    if (!productId || productId === "undefined" || productId === "null") {
      return json(400, { success: false, error: "Thiếu productId cho update" });
    }

    const { data: idRow, error: idErr } = await supabase
      .from("product_identities")
      .select("legacy_no, brand")
      .eq("id", productId)
      .single();
    
    if (idErr || !idRow) {
      console.error("Lỗi tìm identity:", idErr);
      return json(400, { success: false, error: "Không tìm thấy Product Identity UUID" });
    }
    legacy_no = idRow.legacy_no;
    brand = idRow.brand;
  }

  if (action === "hard_delete") {
    const { error } = await supabase.from("product_overrides").delete().eq("id", productId);
    if (error) return json(500, { success: false, error: `Lỗi DB: ${error.message}` });
    return json(200, { success: true });
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
  const image_url = pickStr("image_url");

  // Ensure catalog_sections exists for the given brand + section
  if (section) {
    const { data: existingSec } = await supabase
      .from("catalog_sections")
      .select("id")
      .eq("brand", brand)
      .eq("value", section)
      .maybeSingle();

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
        console.error("Lỗi tạo catalog_section:", secErr);
        return json(500, { success: false, error: "Lỗi DB khi tạo nhóm sản phẩm: " + secErr.message });
      }
    }
  }

  // Fetch existing record
  const { data: existing } = await supabase
    .from("product_overrides")
    .select("*")
    .eq("id", productId)
    .maybeSingle();

  const deleted = "deleted" in body ? Boolean(body.deleted) : undefined;
  const is_custom = action === "create" ? true : ("is_custom" in body ? Boolean(body.is_custom) : undefined);

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
    console.error("Lỗi upsert override:", error);
    return json(500, { success: false, error: `Lỗi DB: ${error.message}` });
  }

  return json(200, { ok: true, success: true, row: { ...saved, productId }, mode: action === "create" ? "created" : "updated", productId });
});
