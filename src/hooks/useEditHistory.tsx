import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { saveProductOverride, type OverrideRow } from "@/lib/saveOverride";
import { useEditUnlock } from "@/hooks/useEditUnlock";
import { toast } from "sonner";

type Snapshot = {
  no: number;
  prev: OverrideRow | null; // null = row didn't exist
  label: string;
};

type Ctx = {
  canUndo: boolean;
  count: number;
  snapshot: (no: number, prev: OverrideRow | undefined | null, label: string) => void;
  undo: () => Promise<void>;
  clear: () => void;
};

const HistoryContext = createContext<Ctx | null>(null);

const MAX_HISTORY = 10;

type Props = {
  children: ReactNode;
  applyRestore: (no: number, row: OverrideRow | null) => void;
};

const HISTORY_KEY = "desembre-edit-history-v1";

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

  const snapshot = useCallback(
    (no: number, prev: OverrideRow | undefined | null, label: string) => {
      setStack((s) => {
        const next = [...s, { no, prev: prev ?? null, label }];
        if (next.length > MAX_HISTORY) next.shift();
        try {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [],
  );

  const undo = useCallback(async () => {
    if (busy) return;
    const last = stack[stack.length - 1];
    if (!last) return;
    const password = getPassword();
    if (!password) {
      toast.error("Cần mở khoá KEY");
      return;
    }
    setBusy(true);
    try {
      if (!last.prev) {
        // Row didn't exist before — remove it entirely
        const res = await saveProductOverride({ password, action: "hard_delete", no: last.no });
        if (!res.ok) {
          toast.error(res.error ?? "Hoàn tác thất bại");
          return;
        }
        applyRestore(last.no, null);
      } else {
        const p = last.prev;
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
        if (!res.ok || !res.row) {
          toast.error(res.error ?? "Hoàn tác thất bại");
          return;
        }
        applyRestore(p.no, res.row);
      }
      setStack((s) => {
        const next = s.slice(0, -1);
        try {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
      toast.success(`Đã hoàn tác: ${last.label}`);
    } finally {
      setBusy(false);
    }
  }, [stack, busy, getPassword, applyRestore]);

  const clear = useCallback(() => {
    setStack([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {}
  }, []);

  return (
    <HistoryContext.Provider
      value={{ canUndo: stack.length > 0 && !busy, count: stack.length, snapshot, undo, clear }}
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
