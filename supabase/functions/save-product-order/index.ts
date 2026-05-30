import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const EDIT_PASSWORD = Deno.env.get("EDIT_PASSWORD");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ALLOWED_ORIGINS_ENV = Deno.env.get("ALLOWED_ORIGINS") || "";
const allowedOrigins = ALLOWED_ORIGINS_ENV.split(",").map((s) => s.trim()).filter(Boolean);

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

  let body: { password?: unknown; section?: unknown; ordered_nos?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(200, { error: "Yêu cầu không hợp lệ" });
  }

  // Auth
  const password = String(body.password ?? "");
  if (!password || password.length > 256 || !safeEqual(password, EDIT_PASSWORD)) {
    await new Promise((r) => setTimeout(r, 250));
    return json(200, { error: "Mật khẩu không hợp lệ" });
  }

  // Validate section
  const section = body.section;
  if (typeof section !== "string" || section.trim() === "" || section.length > 100) {
    return json(200, { error: "Dữ liệu không hợp lệ: section phải là chuỗi không rỗng" });
  }

  // Validate ordered_nos
  const orderedNos = body.ordered_nos;
  if (!Array.isArray(orderedNos)) {
    return json(200, { error: "Dữ liệu không hợp lệ: ordered_nos phải là mảng" });
  }
  if (orderedNos.length === 0) {
    return json(200, { error: "Dữ liệu không hợp lệ: ordered_nos không được rỗng" });
  }
  if (orderedNos.length > 500) {
    return json(200, { error: "Dữ liệu không hợp lệ: ordered_nos quá dài (tối đa 500)" });
  }
  for (const no of orderedNos) {
    if (!Number.isInteger(no) || no < 1 || no > 99999) {
      return json(200, { error: `Dữ liệu không hợp lệ: no=${no} không phải số nguyên hợp lệ` });
    }
  }
  // Check duplicates
  const nosSet = new Set(orderedNos);
  if (nosSet.size !== orderedNos.length) {
    return json(200, { error: "Dữ liệu không hợp lệ: ordered_nos có chứa giá trị trùng lặp" });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Fetch existing override rows for these nos to preserve all existing fields
  const { data: existingRows, error: fetchError } = await supabase
    .from("product_overrides")
    .select("*")
    .in("no", orderedNos);

  if (fetchError) {
    return json(200, { error: `Lỗi Database khi đọc dữ liệu: ${fetchError.message}` });
  }

  // Build a lookup map: no → existing row
  const existingMap: Record<number, Record<string, unknown>> = {};
  for (const row of (existingRows ?? [])) {
    existingMap[row.no] = row;
  }

  // Build upsert rows: preserve all existing fields, only update sort_order + section
  const now = new Date().toISOString();
  const updates = (orderedNos as number[]).map((no, idx) => {
    const existing = existingMap[no];
    if (existing) {
      // Preserve all existing fields, only update sort_order (+ section for safety, keep existing if different)
      return {
        ...existing,
        no,
        sort_order: idx + 1,
        section: existing.section ?? section, // keep existing section if already set
        updated_at: now,
      };
    } else {
      // Base product with no override row yet — create a safe minimal row
      return {
        no,
        section: section,
        sort_order: idx + 1,
        name: null,
        desc: null,
        image_url: null,
        link_url: null,
        deleted: false,
        is_custom: false,
        updated_at: now,
      };
    }
  });

  const { data: saved, error } = await supabase
    .from("product_overrides")
    .upsert(updates, { onConflict: "no" })
    .select();

  if (error) {
    return json(200, {
      error: `Lỗi Database: ${error.message}. (Gợi ý: Kiểm tra xem đã chạy migration thêm cột sort_order chưa)`,
    });
  }

  return json(200, { ok: true, rows: saved });
});
