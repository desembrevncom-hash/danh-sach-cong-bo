import * as React from "react";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

const UNLOCK_KEY = "desembre-edit-unlocked-v1";
const PWD_KEY = "desembre-edit-pwd-v1";

type Ctx = {
  unlocked: boolean;
  verifying: boolean;
  unlock: (password: string) => Promise<{ ok: boolean; error?: string }>;
  lock: () => void;
  getPassword: () => string | null;
};

const EditUnlockContext = createContext<Ctx | null>(null);

export const EditUnlockProvider = ({ children }: { children: ReactNode }) => {
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(UNLOCK_KEY) === "1";
  });
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (unlocked) {
      localStorage.setItem(UNLOCK_KEY, "1");
    } else {
      localStorage.removeItem(UNLOCK_KEY);
      localStorage.removeItem(PWD_KEY);
    }
  }, [unlocked]);

  const unlock = useCallback(async (password: string) => {
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-edit-key", {
        body: { password },
      });
      if (error) {
        return { ok: false, error: error.message ?? "Không thể xác thực" };
      }
      if (data?.valid) {
        setUnlocked(true);
        try {
          localStorage.setItem(PWD_KEY, password);
        } catch {
          // ignore
        }
        return { ok: true };
      }
      return { ok: false, error: "Sai mật khẩu" };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Lỗi không xác định" };
    } finally {
      setVerifying(false);
    }
  }, []);

  const lock = useCallback(() => {
    setUnlocked(false);
    try {
      localStorage.removeItem(PWD_KEY);
    } catch {
      // ignore
    }
  }, []);

  const getPassword = useCallback(() => {
    try {
      return localStorage.getItem(PWD_KEY);
    } catch {
      return null;
    }
  }, []);

  return (
    <EditUnlockContext.Provider value={{ unlocked, verifying, unlock, lock, getPassword }}>
      {children}
    </EditUnlockContext.Provider>
  );
};

export const useEditUnlock = () => {
  const ctx = useContext(EditUnlockContext);
  if (!ctx) throw new Error("useEditUnlock must be used within EditUnlockProvider");
  return ctx;
};
