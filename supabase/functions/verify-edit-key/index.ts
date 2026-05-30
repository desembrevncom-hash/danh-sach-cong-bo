const EDIT_PASSWORD = Deno.env.get("EDIT_PASSWORD");
const ALLOWED_ORIGINS_ENV = Deno.env.get("ALLOWED_ORIGINS") || "";
const allowedOrigins = ALLOWED_ORIGINS_ENV.split(",").map(s => s.trim()).filter(Boolean);

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  // If allowedOrigins is set, check it. Otherwise default to * for backward compatibility if env var is missing.
  const isAllowed = allowedOrigins.length === 0 || allowedOrigins.includes(origin);
  const allowOrigin = isAllowed ? (origin || "*") : (allowedOrigins[0] || "*");
  
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

// In-memory rate limiting map
// key: IP address, value: { count: number, resetAt: number }
interface RateLimitData {
  count: number;
  resetAt: number;
}
const rateLimits = new Map<string, RateLimitData>();

function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return req.headers.get("cf-connecting-ip") || "unknown";
}

// Constant-time string comparison to mitigate timing attacks
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!EDIT_PASSWORD) {
    return new Response(
      JSON.stringify({ error: "Lỗi hệ thống" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Rate Limiting check
  const ip = getClientIp(req);
  const now = Date.now();
  const rateLimitWindow = 60 * 1000; // 60 seconds
  const maxAttempts = 5;

  let limitData = rateLimits.get(ip);
  if (limitData && now > limitData.resetAt) {
    // Expired window, reset
    limitData = { count: 0, resetAt: now + rateLimitWindow };
    rateLimits.set(ip, limitData);
  } else if (!limitData) {
    limitData = { count: 0, resetAt: now + rateLimitWindow };
    rateLimits.set(ip, limitData);
  }

  if (limitData.count >= maxAttempts) {
    // Delay or 429
    return new Response(
      JSON.stringify({ valid: false, error: "Vượt quá số lần thử. Vui lòng thử lại sau." }),
      {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Yêu cầu không hợp lệ" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const password =
    typeof body === "object" && body !== null && "password" in body
      ? String((body as Record<string, unknown>).password ?? "")
      : "";

  if (!password || password.length > 256) {
    // Record fail
    limitData.count += 1;
    rateLimits.set(ip, limitData);
    
    return new Response(
      JSON.stringify({ valid: false, error: "Thông tin không hợp lệ" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const valid = safeEqual(password, EDIT_PASSWORD);

  if (!valid) {
    // Record fail
    limitData.count += 1;
    rateLimits.set(ip, limitData);
    
    // Small delay to slow brute-force attempts inside the valid window
    await new Promise((r) => setTimeout(r, 250));
    
    return new Response(
      JSON.stringify({ valid: false, error: "Thông tin không hợp lệ" }),
      {
        status: 200, // Returning 200 with valid: false to maintain frontend behavior
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Success: reset attempts
  rateLimits.delete(ip);

  return new Response(JSON.stringify({ valid: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
