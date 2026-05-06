import { useState } from "react";
import { Lock, Loader2 } from "lucide-react";
import { useEditUnlock } from "@/hooks/useEditUnlock";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnlocked?: () => void;
};

const UnlockDialog = ({ open, onOpenChange, onUnlocked }: Props) => {
  const { unlock, verifying } = useEditUnlock();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await unlock(password);
    if (res.ok) {
      setPassword("");
      onOpenChange(false);
      onUnlocked?.();
    } else {
      setError(res.error ?? "Sai mật khẩu");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4"
      onClick={() => onOpenChange(false)}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 inline-flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="elegant-title text-lg font-semibold text-foreground leading-tight">
              Mở khoá chỉnh sửa
            </h2>
            <p className="text-xs text-muted-foreground">
              Nhập KEY để được phép sửa link sản phẩm
            </p>
          </div>
        </div>

        <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
          Mật khẩu KEY
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          placeholder="••••••••"
          className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />

        {error && (
          <p className="text-xs text-destructive mt-2">{error}</p>
        )}

        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-10 px-4 rounded-md border border-border text-sm text-foreground hover:bg-muted/50"
          >
            Huỷ
          </button>
          <button
            type="submit"
            disabled={verifying || !password}
            className="h-10 px-5 rounded-md bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
          >
            {verifying && <Loader2 className="w-4 h-4 animate-spin" />}
            Mở khoá
          </button>
        </div>
      </form>
    </div>
  );
};

export default UnlockDialog;
