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

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });
  if (!EDIT_PASSWORD) return json(500, { error: "Lỗi hệ thống" });

  let body: { password?: string; section?: string; ordered_nos?: number[] };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Yêu cầu không hợp lệ" });
  }

  const password = String(body.password ?? "");
  if (!password || password.length > 256 || !safeEqual(password, EDIT_PASSWORD)) {
    await new Promise((r) => setTimeout(r, 250));
    return json(401, { error: "Thông tin không hợp lệ" });
  }

  const section = body.section;
  const orderedNos = body.ordered_nos;
  if (!section || !Array.isArray(orderedNos)) {
    return json(400, { error: "Dữ liệu không hợp lệ: thiếu section hoặc ordered_nos" });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Prepare batch upsert rows. PostgREST partial upsert will ONLY update the specified fields,
  // preserving existing name, desc, link_url, image_url, etc.
  const updates = orderedNos.map((no, idx) => ({
    no: Number(no),
    sort_order: idx + 1,
    section: String(section),
    updated_at: new Date().toISOString(),
  }));

  const { data: saved, error } = await supabase
    .from("product_overrides")
    .upsert(updates, { onConflict: "no" })
    .select();

  if (error) {
    return json(500, { error: error.message });
  }

  return json(200, { ok: true, rows: saved });
});
