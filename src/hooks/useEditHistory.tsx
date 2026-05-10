import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { saveProductOverride, type OverrideRow } from "@/lib/saveOverride";
import { useEditUnlock } from "@/hooks/useEditUnlock";
import { toast } from "sonner";

export type Snapshot = {
  no: number;
  prev: OverrideRow | null; // null = row didn't exist
  label: string;
  timestamp: number;
};

type Ctx = {
  canUndo: boolean;
  count: number;
  stack: Snapshot[];
  snapshot: (no: number, prev: OverrideRow | undefined | null, label: string) => void;
  undo: () => Promise<void>;
  undoTo: (index: number) => Promise<void>;
  clear: () => void;
};

const HistoryContext = createContext<Ctx | null>(null);

const MAX_HISTORY = 20;

type Props = {
  children: ReactNode;
  applyRestore: (no: number, row: OverrideRow | null) => void;
};

const HISTORY_KEY = "desembre-edit-history-v2";

export const EditHistoryProvider = ({ children, applyRestore }: Props) => {
  const { getPassword } = useEditUnlock();
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
  const [busy, setBusy] = useState(false);

  const persist = (s: Snapshot[]) => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(s));
    } catch {}
  };

  const snapshot = useCallback(
    (no: number, prev: OverrideRow | undefined | null, label: string) => {
      setStack((s) => {
        const next = [...s, { no, prev: prev ?? null, label, timestamp: Date.now() }];
        if (next.length > MAX_HISTORY) next.shift();
        persist(next);
        return next;
      });
    },
    [],
  );

  const restoreSnapshot = async (
    snap: Snapshot,
    password: string,
  ): Promise<boolean> => {
    if (!snap.prev) {
      const res = await saveProductOverride({ password, action: "hard_delete", no: snap.no });
      if (!res.ok) { toast.error(res.error ?? "Hoàn tác thất bại"); return false; }
      applyRestore(snap.no, null);
    } else {
      const p = snap.prev;
      const res = await saveProductOverride({
        password,
        no: p.no,
        image_url: p.image_url,
        link_url: p.link_url,
        section: p.section,
        name: p.name,
        desc: p.desc,
        deleted: p.deleted,
      });
      if (!res.ok || !res.row) { toast.error(res.error ?? "Hoàn tác thất bại"); return false; }
      applyRestore(p.no, res.row);
    }
    return true;
  };

  // Undo the last 1 step
  const undo = useCallback(async () => {
    if (busy) return;
    const last = stack[stack.length - 1];
    if (!last) return;
    const password = getPassword();
    if (!password) { toast.error("Cần mở khoá KEY"); return; }
    setBusy(true);
    try {
      const ok = await restoreSnapshot(last, password);
      if (!ok) return;
      setStack((s) => {
        const next = s.slice(0, -1);
        persist(next);
        return next;
      });
      toast.success(`Đã hoàn tác: ${last.label}`);
    } finally {
      setBusy(false);
    }
  }, [stack, busy, getPassword, applyRestore]);

  // Undo all steps back to (and including) the given index
  const undoTo = useCallback(async (index: number) => {
    if (busy) return;
    const password = getPassword();
    if (!password) { toast.error("Cần mở khoá KEY"); return; }
    // Steps to undo: from the end of stack down to `index`
    const stepsToUndo = stack.slice(index).reverse();
    if (stepsToUndo.length === 0) return;
    setBusy(true);
    let undoneCount = 0;
    try {
      for (const snap of stepsToUndo) {
        const ok = await restoreSnapshot(snap, password);
        if (!ok) break;
        undoneCount++;
      }
      setStack((s) => {
        const next = s.slice(0, index);
        persist(next);
        return next;
      });
      toast.success(`Đã hoàn tác ${undoneCount} bước — quay về trạng thái: "${stack[index]?.label ?? "ban đầu"}"`);
    } finally {
      setBusy(false);
    }
  }, [stack, busy, getPassword, applyRestore]);

  const clear = useCallback(() => {
    setStack([]);
    try { localStorage.removeItem(HISTORY_KEY); } catch {}
  }, []);

  return (
    <HistoryContext.Provider
      value={{ canUndo: stack.length > 0 && !busy, count: stack.length, stack, snapshot, undo, undoTo, clear }}
    >
      {children}
    </HistoryContext.Provider>
  );
};

export const useEditHistory = () => {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error("useEditHistory must be used within EditHistoryProvider");
  return ctx;
};
