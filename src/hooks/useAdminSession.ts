import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

/**
 * Hook kiểm tra phiên đăng nhập Admin qua Supabase Auth.
 * Không yêu cầu mật khẩu KEY cũ — chỉ dựa vào session Supabase.
 */
export function useAdminSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkRole(currentSession: Session | null) {
      if (!currentSession) {
        if (isMounted) {
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", currentSession.user.id)
          .maybeSingle();

        if (isMounted) {
          if (error) {
            console.error("[useAdminSession] Error fetching role:", error);
            setIsAdmin(false);
          } else {
            setIsAdmin(data?.role === "admin");
          }
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error("[useAdminSession] Unexpected error:", err);
          setIsAdmin(false);
          setLoading(false);
        }
      }
    }

    // Lấy session hiện tại
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        setSession(session);
        checkRole(session);
      }
    });

    // Lắng nghe thay đổi auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setSession(session);
        setLoading(true); // reset loading while checking new role
        checkRole(session);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    isAdmin,
    session,
    loading,
  };
}
