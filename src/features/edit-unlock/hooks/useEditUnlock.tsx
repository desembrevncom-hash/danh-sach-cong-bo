import * as React from "react";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type EditUnlockState = {
  isUnlocked: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  error: string | null;
  lock: () => void;
  refreshAdminStatus: () => Promise<void>;
  
  // Expose these for UI if needed
  user: unknown | null;
  role: string | null;
};

const EditUnlockContext = createContext<EditUnlockState | null>(null);

export const EditUnlockProvider = ({ children }: { children: ReactNode }) => {
  const [manuallyLocked, setManuallyLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Supabase Auth State
  const [user, setUser] = useState<unknown | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const fetchRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      setRole(data?.role ?? null);
    } catch (e) {
      console.error("Failed to fetch role:", e);
      setRole(null);
    }
  }, []);

  const refreshAdminStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      
      if (session?.user) {
        setUser(session.user);
        await fetchRole(session.user.id);
      } else {
        setUser(null);
        setRole(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load session");
      setUser(null);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  }, [fetchRole]);

  useEffect(() => {
    let mounted = true;

    refreshAdminStatus().then(() => {
      if (!mounted) return;
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        await fetchRole(session.user.id);
      } else {
        setUser(null);
        setRole(null);
      }
      setManuallyLocked(false); // reset lock state on auth change
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [refreshAdminStatus, fetchRole]);

  const isAdmin = role === 'admin';
  const isUnlocked = isAdmin && !manuallyLocked;

  const lock = useCallback(() => {
    setManuallyLocked(true);
  }, []);

  return (
    <EditUnlockContext.Provider value={{ 
      isUnlocked,
      isLoading,
      isAdmin,
      error,
      lock,
      refreshAdminStatus,
      user,
      role
    }}>
      {children}
    </EditUnlockContext.Provider>
  );
};

export const useEditUnlock = () => {
  const ctx = useContext(EditUnlockContext);
  if (!ctx) throw new Error("useEditUnlock must be used within EditUnlockProvider");
  return ctx;
};
