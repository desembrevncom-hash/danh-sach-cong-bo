import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export type AdminAuthResult =
  | {
      ok: true;
      userId: string;
      method: "jwt";
    }
  | {
      ok: false;
      status: 401 | 403;
      error: string;
    };

export async function requireAdminAccess(req: Request): Promise<AdminAuthResult> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  const authHeader = req.headers.get("Authorization");
  
  if (authHeader && authHeader.startsWith("Bearer ") && SUPABASE_URL && SERVICE_ROLE) {
    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE);
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (!userError && userData?.user) {
      const currentUserId = userData.user.id;
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("role")
        .eq("user_id", currentUserId)
        .single();
        
      if (profile?.role === "admin") {
        return {
          ok: true,
          userId: currentUserId,
          method: "jwt"
        };
      } else {
        return {
          ok: false,
          status: 403,
          error: "Admin permission required"
        };
      }
    }
  }

  // Delay to prevent brute force timing attacks against tokens
  await new Promise((r) => setTimeout(r, 250));

  return {
    ok: false,
    status: 401,
    error: "Unauthorized"
  };
}
