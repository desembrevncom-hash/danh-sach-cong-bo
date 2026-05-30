import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const EDIT_PASSWORD = Deno.env.get("EDIT_PASSWORD");
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

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
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
  if (!EDIT_PASSWORD) return json(200, { error: "Lỗi hệ thống: Chưa cấu hình EDIT_PASSWORD" });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(200, { error: "Yêu cầu không hợp lệ" });
  }

  const password = String(body.password ?? "");
  if (!password || password.length > 256 || !safeEqual(password, EDIT_PASSWORD)) {
    await new Promise((r) => setTimeout(r, 250));
    return json(200, { error: "Thông tin không hợp lệ" });
  }

  // --- Validate Payload ---
  if ("no" in body && typeof body.no !== "number") return json(200, { error: "Dữ liệu không hợp lệ: no" });
  if ("original_no" in body && typeof body.original_no !== "number") return json(200, { error: "Dữ liệu không hợp lệ: original_no" });
  if ("name" in body && typeof body.name === "string" && body.name.length > 255) return json(200, { error: "Tên quá dài" });
  if ("desc" in body && typeof body.desc === "string" && body.desc.length > 2000) return json(200, { error: "Mô tả quá dài" });
  if ("section" in body && typeof body.section === "string" && body.section.length > 100) return json(200, { error: "Section quá dài" });
  if ("deleted" in body && typeof body.deleted !== "boolean") return json(200, { error: "Dữ liệu không hợp lệ: deleted" });
  if ("is_custom" in body && typeof body.is_custom !== "boolean") return json(200, { error: "Dữ liệu không hợp lệ: is_custom" });
  if ("link_url" in body && body.link_url !== null && typeof body.link_url !== "string") return json(200, { error: "Dữ liệu không hợp lệ: link_url" });
  if ("image_url" in body && body.image_url !== null && typeof body.image_url !== "string") return json(200, { error: "Dữ liệu không hợp lệ: image_url" });

  const actionStr = String(body.action ?? "upsert");
  if (!["upsert", "create", "hard_delete"].includes(actionStr) && !Array.isArray(body.products)) {
    return json(200, { error: "Hành động không hợp lệ" });
  }
  // -------------------------

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  // Bulk upsert support
  if (Array.isArray(body.products)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const products = body.products.map((p: any) => ({
      no: Number(p.no),
      name: p.name,
      desc: p.desc,
      section: p.section,
      image_url: p.image_url ?? null,
      link_url: p.link_url ?? null,
      deleted: Boolean(p.deleted ?? false),
      is_custom: Boolean(p.is_custom ?? false),
      updated_at: new Date().toISOString(),
    }));
    const { data: saved, error } = await supabase.from("product_overrides").upsert(products, { onConflict: "no" }).select();
    if (error) return json(200, { error: `Lỗi DB: ${error.message}` });
    return json(200, { ok: true, count: saved?.length });
  }

  const action = String(body.action ?? "upsert");

  // Hard delete a custom product (or unset deleted flag — handled via upsert)
  if (action === "hard_delete") {
    const no = Number(body.no);
    if (!Number.isInteger(no)) return json(200, { error: "no không hợp lệ" });
    const { error } = await supabase.from("product_overrides").delete().eq("no", no);
    if (error) return json(200, { error: `Lỗi DB: ${error.message}` });
    return json(200, { ok: true });
  }

  // Upsert / create
  let no: number;
  if (action === "create") {
    // Allocate next no >= 1000 for custom items
    const { data: maxRow } = await supabase
      .from("product_overrides")
      .select("no")
      .gte("no", 1000)
      .order("no", { ascending: false })
      .limit(1)
      .maybeSingle();
    no = (maxRow?.no ?? 999) + 1;
  } else {
    no = Number(body.no);
    if (!Number.isInteger(no) || no < 1 || no > 99999) {
      return json(200, { error: "Sản phẩm không hợp lệ" });
    }
  }

  // Fetch existing record
  const { data: existing } = await supabase
    .from("product_overrides")
    .select("*")
    .eq("no", no)
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
      const path = `product-${no}-${Date.now()}.${ext}`;
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
  const section = pickStr("section");
  const name = pickStr("name");
  const desc = pickStr("desc");

  const deleted = "deleted" in body ? Boolean(body.deleted) : undefined;
  const is_custom = action === "create" ? true : ("is_custom" in body ? Boolean(body.is_custom) : undefined);

  const row: Record<string, unknown> = {
    no,
    image_url: image_url === undefined ? existing?.image_url ?? null : image_url,
    link_url: link_url === undefined ? existing?.link_url ?? null : link_url,
    section: section === undefined ? existing?.section ?? null : section,
    name: name === undefined ? existing?.name ?? null : name,
    desc: desc === undefined ? existing?.desc ?? null : desc,
    deleted: deleted === undefined ? existing?.deleted ?? false : deleted,
    is_custom: is_custom === undefined ? existing?.is_custom ?? false : is_custom,
    updated_at: new Date().toISOString(),
  };

  const { data: saved, error } = await supabase
    .from("product_overrides")
    .upsert(row, { onConflict: "no" })
    .select()
    .maybeSingle();
  if (error) return json(200, { error: `Lỗi DB: ${error.message}` });

  return json(200, { ok: true, row: saved });
});
