import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { saveProductOverride } from "@/features/products/services/productOverrideService";
import { useAdminSession } from "@/hooks/useAdminSession";
import type { ProductOverrideRow as OverrideRow } from "@/features/products/types";
import { useEditUnlock } from "@/features/edit-unlock/hooks/useEditUnlock";
import { toast } from "sonner";

export type Snapshot = {
  id: string;
  prev: OverrideRow | null; // null = row didn't exist
  label: string;
  timestamp: number;
};

type Ctx = {
  canUndo: boolean;
  count: number;
  stack: Snapshot[];
  snapshot: (id: string, prev: OverrideRow | undefined | null, label: string) => void;
  undo: () => Promise<void>;
  undoTo: (index: number) => Promise<void>;
  clear: () => void;
};

const HistoryContext = createContext<Ctx | null>(null);

const MAX_HISTORY = 20;

type Props = {
  children: ReactNode;
  applyRestore: (id: string, row: OverrideRow | null) => void;
};

const HISTORY_KEY = "desembre-edit-history-v2";

export const EditHistoryProvider = ({ children, applyRestore }: Props) => {
  const [stack, setStack] = useState<Snapshot[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) return JSON.parse(stored) as Snapshot[];
    } catch {
      // ignore parse errors
    }
    return [];
  });

  const { isAdmin } = useEditUnlock();

  const persist = (s: Snapshot[]) => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(s));
    } catch {
      // ignore localStorage write errors (e.g. quota exceeded)
    }
  };

  const snapshot = useCallback(
    (id: string, prev: OverrideRow | undefined | null, label: string) => {
      setStack((s) => {
        const next = [...s, { id, prev: prev ?? null, label, timestamp: Date.now() }];
        if (next.length > MAX_HISTORY) next.shift();
        persist(next);
        return next;
      });
    },
    [],
  );

  const restoreSnapshot = useCallback(async (
    snap: Snapshot,
  ): Promise<boolean> => {
    if (!snap.prev) {
      if (!session?.access_token) return false;
      const res = await saveProductOverride({ action: "hard_delete", productId: snap.id }, session.access_token);
      if (!res.ok) { toast.error(res.error ?? "Hoàn tác thất bại"); return false; }
      applyRestore(snap.id, null);
    } else {
      const p = snap.prev;
      const res = await saveProductOverride({
        productId: p.id,
        image_url: p.image_url,
        link_url: p.link_url,
        section: p.section,
        name: p.name,
        desc: p.desc,
        deleted: p.deleted,
      }, session?.access_token || "");
      if (!res.ok) { toast.error(res.error ?? "Hoàn tác thất bại"); return false; }
      applyRestore(snap.id, p);
    }
    return true;
  }, [applyRestore]);

  const undo = useCallback(async () => {
    if (stack.length === 0 || !isAdmin) return;
    const last = stack[stack.length - 1];
    
    // Disable interaction while restoring
    toast.loading("Đang hoàn tác...", { id: "undo" });
    const success = await restoreSnapshot(last);
    
    if (success) {
      toast.success(`Đã hoàn tác: ${last.label}`, { id: "undo" });
      setStack((s) => {
        const next = s.slice(0, -1);
        persist(next);
        return next;
      });
    } else {
      toast.dismiss("undo");
    }
  }, [stack, isAdmin, restoreSnapshot]);

  const undoTo = useCallback(async (index: number) => {
    if (index < 0 || index >= stack.length || !isAdmin) return;
    
    toast.loading("Đang khôi phục...", { id: "undoto" });
    const toRestore = stack.slice(index).reverse();
    
    // Restore sequentially from newest to the target index
    let allSuccess = true;
    for (const snap of toRestore) {
      const success = await restoreSnapshot(snap);
      if (!success) {
        allSuccess = false;
        break;
      }
    }
    
    if (allSuccess) {
      toast.success("Đã khôi phục trạng thái cũ", { id: "undoto" });
      setStack((s) => {
        const next = s.slice(0, index);
        persist(next);
        return next;
      });
    } else {
      toast.dismiss("undoto");
    }
  }, [stack, isAdmin, restoreSnapshot]);

  const clear = useCallback(() => {
    setStack([]);
    persist([]);
  }, []);

  return (
    <HistoryContext.Provider
      value={{
        canUndo: stack.length > 0 && isAdmin,
        count: stack.length,
        stack,
        snapshot,
        undo,
        undoTo,
        clear,
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
};

export function useEditHistory() {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error("useEditHistory must be used within EditHistoryProvider");
  return ctx;
};
