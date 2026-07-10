import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

import { requireAdminAccess } from "../_shared/adminAuth.ts";

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

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(400, { success: false, error: "Method not allowed" });

  let body: { section?: unknown; ordered_ids?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { success: false, error: "Yêu cầu không hợp lệ" });
  }

  // Auth
  const authResult = await requireAdminAccess(req);
  if (!authResult.ok) {
    return json(authResult.status, { success: false, error: authResult.error });
  }
  const currentUserId = authResult.userId;

  // Validate section
  const section = body.section;
  if (typeof section !== "string" || section.trim() === "" || section.length > 100) {
    return json(200, { error: "Dữ liệu không hợp lệ: section phải là chuỗi không rỗng" });
  }

  // Validate ordered_ids
  const orderedIds = body.ordered_ids;
  if (!Array.isArray(orderedIds)) {
    return json(200, { error: "Dữ liệu không hợp lệ: ordered_ids phải là mảng" });
  }
  if (orderedIds.length === 0) {
    return json(200, { error: "Dữ liệu không hợp lệ: ordered_ids không được rỗng" });
  }
  if (orderedIds.length > 500) {
    return json(200, { error: "Dữ liệu không hợp lệ: ordered_ids quá dài (tối đa 500)" });
  }
  for (const no of orderedIds) {
    if (typeof no !== "string" || no.trim() === "") {
      return json(200, { error: `Dữ liệu không hợp lệ: no=${no} không hợp lệ` });
    }
  }
  // Check duplicates
  const nosSet = new Set(orderedIds);
  if (nosSet.size !== orderedIds.length) {
    return json(200, { error: "Dữ liệu không hợp lệ: ordered_ids có chứa giá trị trùng lặp" });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Fetch existing override rows for these nos to preserve all existing fields
  const { data: existingRows, error: fetchError } = await supabase
    .from("product_overrides")
    .select("*")
    .in("id", orderedIds);

  if (fetchError) {
    return json(200, { error: `Lỗi Database khi đọc dữ liệu: ${fetchError.message}` });
  }

  // Fetch product identities for legacy_no mapping
  const { data: identityRows, error: idError } = await supabase
    .from("product_identities")
    .select("id, legacy_no, brand")
    .in("id", orderedIds);

  if (idError) {
    return json(200, { error: `Lỗi Database khi đọc identity: ${idError.message}` });
  }

  const identityMap: Record<string, Record<string, unknown>> = {};
  for (const row of (identityRows ?? [])) {
    identityMap[row.id as string] = row;
  }

  // Build a lookup map: id → existing row
  const existingMap: Record<string, Record<string, unknown>> = {};
  for (const row of (existingRows ?? [])) {
    existingMap[row.id as string] = row;
  }

  // Build upsert rows: preserve all existing fields, only update sort_order + section
  const now = new Date().toISOString();
  
  const updates = [];
  for (let idx = 0; idx < orderedIds.length; idx++) {
    const id = orderedIds[idx] as string;
    const existing = existingMap[id];
    
    if (existing) {
      // Preserve all existing fields, only update sort_order (+ section for safety, keep existing if different)
      updates.push({
        ...existing,
        sort_order: idx + 1,
        section: section,
        changed_by: currentUserId,
        updated_at: now
      });
    } else {
      const identity = identityMap[id];
      if (!identity) {
         return json(400, { success: false, error: `Invalid product identity: ${id}` });
      }

      // Round 7B-1: no longer writing `no` to product_overrides.
      // product_overrides uses id as PK; legacy_no lives in product_identities.
      updates.push({
        id: id,
        brand: identity.brand,
        section: section,
        sort_order: idx + 1,
        changed_by: currentUserId,
        updated_at: now
      });
    }
  }

  const { data: saved, error } = await supabase
    .from("product_overrides")
    .upsert(updates, { onConflict: "id" })
    .select();

  if (error) {
    return json(200, {
      error: `Lỗi Database: ${error.message}. (Gợi ý: Kiểm tra xem đã chạy migration thêm cột sort_order chưa)`,
    });
  }

  return json(200, { success: true, rows: saved });
});
