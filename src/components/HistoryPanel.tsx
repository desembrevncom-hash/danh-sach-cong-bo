import { useState } from "react";
import { History, Undo2, Trash2, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { useEditHistory } from "@/hooks/useEditHistory";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function HistoryPanel() {
  const { stack, canUndo, count, undo, undoTo, clear } = useEditHistory();
  const [open, setOpen] = useState(false);

  if (!canUndo && count === 0) return null;

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  };

  const displayStack = [...stack].reverse(); // newest first

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!canUndo && count === 0}
        className="h-11 px-4 rounded-md border border-border bg-card text-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-muted/50 transition disabled:opacity-40 disabled:cursor-not-allowed"
        title="Xem lịch sử chỉnh sửa"
      >
        <History className="w-4 h-4" />
        <span className="hidden sm:inline">Lịch sử</span>
        {count > 0 && (
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black"
            style={{ background: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))" }}>
            {count}
          </span>
        )}
      </button>

      {/* History dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Lịch sử chỉnh sửa
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                {count} bước / tối đa 20
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {displayStack.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Chưa có lịch sử chỉnh sửa</p>
            ) : (
              displayStack.map((snap, displayIdx) => {
                const realIndex = stack.length - 1 - displayIdx; // index in original stack
                const isLatest = displayIdx === 0;
                return (
                  <div key={snap.timestamp}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      isLatest
                        ? "border-accent/60 bg-accent/10"
                        : "border-border bg-card hover:bg-muted/50"
                    }`}>
                    {/* Step info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {isLatest && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider"
                            style={{ background: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))" }}>
                            Mới nhất
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground font-mono">{formatTime(snap.timestamp)}</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground mt-0.5 truncate">{snap.label}</p>
                      <p className="text-xs text-muted-foreground">Sản phẩm #{String(snap.no).padStart(2, "0")}</p>
                    </div>

                    {/* Restore button */}
                    <button
                      type="button"
                      onClick={async () => {
                        await undoTo(realIndex);
                        setOpen(false);
                      }}
                      className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border border-border hover:bg-muted transition"
                      title={`Quay lại trước bước "${snap.label}"`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Quay lại
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer actions */}
          {count > 0 && (
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <button
                type="button"
                onClick={async () => { await undo(); if (count <= 1) setOpen(false); }}
                disabled={!canUndo}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold border border-border hover:bg-muted transition disabled:opacity-40"
              >
                <Undo2 className="w-4 h-4" />
                Hoàn tác bước cuối
              </button>
              <button
                type="button"
                onClick={() => { clear(); setOpen(false); }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-destructive border border-destructive/30 hover:bg-destructive/10 transition"
              >
                <Trash2 className="w-4 h-4" />
                Xoá lịch sử
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
