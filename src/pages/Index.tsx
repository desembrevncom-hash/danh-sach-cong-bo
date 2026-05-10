import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, RotateCcw, Lock, LockOpen, Plus, Pencil, Trash2, Undo2, FileDown } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { ProductPDF } from "@/components/ProductPDF";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { sections, flatProducts, type FlatProduct } from "@/data/desembreProducts";
import ProductImageCell from "@/components/ProductImageCell";
import ProductLinkCell from "@/components/ProductLinkCell";
import UnlockDialog from "@/components/UnlockDialog";
import ProductEditDialog, { type ProductDialogInitial } from "@/components/ProductEditDialog";
import { useEditUnlock } from "@/hooks/useEditUnlock";
import { supabase } from "@/integrations/supabase/client";
import { saveProductOverride, type OverrideRow } from "@/lib/saveOverride";
import { EditHistoryProvider, useEditHistory } from "@/hooks/useEditHistory";
import { toast } from "sonner";

const ALL = "ALL";

const IndexInner = ({
  overrides,
  setOverrides,
  refreshOverrides,
}: {
  overrides: Record<number, OverrideRow>;
  setOverrides: React.Dispatch<React.SetStateAction<Record<number, OverrideRow>>>;
  refreshOverrides: () => Promise<void>;
}) => {
  const { unlocked, lock, getPassword } = useEditUnlock();
  const history = useEditHistory();
  const [askUnlock, setAskUnlock] = useState(false);
  const [query, setQuery] = useState("");
  const [section, setSection] = useState<string>(ALL);
  const [editOpen, setEditOpen] = useState(false);
  const [editInitial, setEditInitial] = useState<ProductDialogInitial | null>(null);
  const [exporting, setExporting] = useState(false);
  const tableWrapRef = useRef<HTMLDivElement>(null);

  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);

  // We no longer need the old handleExportPdf since react-pdf handles it via PDFDownloadLink

  const upsertOverride = useCallback(
    (row: OverrideRow, options?: { snapshotLabel?: string }) => {
      if (options?.snapshotLabel) {
        history.snapshot(row.no, overrides[row.no], options.snapshotLabel);
      }
      setOverrides((p) => ({ ...p, [row.no]: row }));
    },
    [history, overrides, setOverrides],
  );

  const setImage = async (no: number, src: string | undefined) => {
    history.snapshot(no, overrides[no], `Ảnh #${String(no).padStart(2, "0")}`);
    setOverrides((p) => ({
      ...p,
      [no]: { ...(p[no] ?? defaultOverride(no)), image_url: src ?? null },
    }));
  };

  const setLink = async (no: number, href: string | undefined) => {
    history.snapshot(no, overrides[no], `Liên kết #${String(no).padStart(2, "0")}`);
    setOverrides((p) => ({
      ...p,
      [no]: { ...(p[no] ?? defaultOverride(no)), link_url: href ?? null },
    }));
  };

  // Build merged product list: base + overrides + custom; minus deleted
  const merged: FlatProduct[] = useMemo(() => {
    const list: FlatProduct[] = [];
    for (const p of flatProducts) {
      const o = overrides[p.no];
      if (o?.deleted) continue;
      list.push({
        ...p,
        name: o?.name ?? p.name,
        desc: o?.desc ?? p.desc,
        section: o?.section ?? p.section,
        link: o?.link_url ?? p.link,
      });
    }
    // Custom products (no >= 1000)
    for (const o of Object.values(overrides)) {
      if (!o.is_custom || o.deleted) continue;
      const sec = sections.find((s) => s.title === (o.section ?? ""));
      list.push({
        no: o.no,
        name: o.name ?? "(Chưa có tên)",
        desc: o.desc ?? "",
        section: o.section ?? "OTHER",
        sectionVi: sec?.vi,
        link: o.link_url ?? undefined,
      });
    }
    return list;
  }, [overrides]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return merged.filter((p) => {
      const matchesSection = section === ALL || p.section === section;
      const matchesQuery =
        !q || p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q);
      return matchesSection && matchesQuery;
    });
  }, [query, section, merged]);

  const grouped = useMemo(() => {
    const map = new Map<string, FlatProduct[]>();
    for (const p of filtered) {
      const arr = map.get(p.section) ?? [];
      arr.push(p);
      map.set(p.section, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const sectionTitles = useMemo(() => {
    const set = new Set<string>(sections.map((s) => s.title));
    for (const o of Object.values(overrides)) if (o.section) set.add(o.section);
    return Array.from(set);
  }, [overrides]);

  const reset = () => {
    setQuery("");
    setSection(ALL);
  };

  const openCreate = () => {
    setEditInitial({ section: section === ALL ? "" : section, name: "", desc: "" });
    setEditOpen(true);
  };

  const openEdit = (p: FlatProduct) => {
    setEditInitial({ no: p.no, section: p.section, name: p.name, desc: p.desc });
    setEditOpen(true);
  };

  const handleDelete = async (p: FlatProduct) => {
    const password = getPassword();
    if (!password) {
      toast.error("Cần mở khoá KEY");
      return;
    }
    if (!confirm(`Xoá sản phẩm "${p.name}"?`)) return;
    const prev = overrides[p.no];
    const isCustom = !!prev?.is_custom;
    if (isCustom) {
      const res = await saveProductOverride({ password, action: "hard_delete", no: p.no });
      if (!res.ok) return toast.error(res.error ?? "Xoá thất bại");
      history.snapshot(p.no, prev, `Xoá "${p.name}"`);
      setOverrides((prev2) => {
        const n = { ...prev2 };
        delete n[p.no];
        return n;
      });
    } else {
      const res = await saveProductOverride({ password, no: p.no, deleted: true });
      if (!res.ok || !res.row) return toast.error(res.error ?? "Xoá thất bại");
      upsertOverride(res.row, { snapshotLabel: `Xoá "${p.name}"` });
    }
    toast.success("Đã xoá — có thể hoàn tác");
  };

  const handleRenameSection = async (oldTitle: string, rows: FlatProduct[]) => {
    const password = getPassword();
    if (!password) return toast.error("Cần mở khoá KEY");
    const next = window.prompt(`Đổi tên nhóm "${oldTitle}" thành:`, oldTitle);
    if (!next) return;
    const newTitle = next.trim();
    if (!newTitle || newTitle === oldTitle) return;
    toast.info(`Đang đổi tên ${rows.length} sản phẩm…`);
    let failed = 0;
    for (const r of rows) {
      const res = await saveProductOverride({
        password,
        no: r.no,
        section: newTitle,
      });
      if (!res.ok || !res.row) {
        failed++;
        continue;
      }
      upsertOverride(res.row, { snapshotLabel: `Đổi nhóm #${String(r.no).padStart(2, "0")}` });
    }
    if (failed) toast.error(`${failed} sản phẩm lỗi`);
    else toast.success(`Đã đổi nhóm thành "${newTitle}"`);
  };

  const isFiltered = query !== "" || section !== ALL;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-12 text-center">
          <p className="text-[11px] uppercase tracking-[0.4em] text-muted-foreground mb-4">
            www.desembrevn.com · 2026 Catalog
          </p>
          <h1 className="elegant-title text-4xl md:text-5xl lg:text-6xl font-semibold text-primary leading-tight">
            Danh Sách Công Bố Sản Phẩm Desembre
          </h1>
          <div className="mx-auto mt-6 h-[2px] w-24 bg-accent" />
          <p className="mt-5 text-sm text-muted-foreground max-w-xl mx-auto">
            Bộ sưu tập đầy đủ các dòng sản phẩm chăm sóc da chuyên nghiệp Desembre — đã công bố lưu hành tại Việt Nam.
          </p>
        </div>
      </header>

      <section className="container mx-auto px-4 md:px-6 pt-4 md:pt-8 sticky top-0 z-50 bg-background/80 backdrop-blur-sm pb-2">
        <div className="bg-card border border-border rounded-lg p-3 md:p-5 shadow-md flex flex-col md:flex-row gap-2 md:gap-3 md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên hoặc mô tả sản phẩm..."
              className="w-full h-11 pl-10 pr-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>

          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="h-11 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition md:w-64"
          >
            <option value={ALL}>Tất cả nhóm sản phẩm</option>
            {sectionTitles.map((s) => {
              const meta = sections.find((x) => x.title === s);
              return (
                <option key={s} value={s}>
                  {s}
                  {meta?.vi ? ` — ${meta.vi}` : ""}
                </option>
              );
            })}
          </select>

          <button
            type="button"
            onClick={reset}
            disabled={!isFiltered}
            className="h-11 px-5 rounded-md bg-primary text-primary-foreground text-sm font-semibold tracking-wide inline-flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>

          <PDFDownloadLink
            document={<ProductPDF products={filtered.map(p => ({
              ...p,
              image: overrides[p.no]?.image_url ?? undefined
            }))} />}
            fileName="danh-sach-san-pham-desembre.pdf"
            className="h-11 px-4 rounded-md border border-border bg-card text-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-muted/50 transition"
          >
            {({ loading }) => (
              <>
                <FileDown className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
                {loading ? "Đang tạo…" : "Xuất PDF"}
              </>
            )}
          </PDFDownloadLink>

          {unlocked && (
            <>
              <button
                type="button"
                onClick={openCreate}
                className="h-11 px-4 rounded-md bg-accent text-accent-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90 transition"
              >
                <Plus className="w-4 h-4" />
                Thêm sản phẩm
              </button>
              <button
                type="button"
                onClick={() => history.undo()}
                disabled={!history.canUndo}
                title={history.canUndo ? "Hoàn tác thay đổi gần nhất" : "Chưa có thay đổi để hoàn tác"}
                className="h-11 px-4 rounded-md border border-border bg-card text-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-muted/50 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Undo2 className="w-4 h-4" />
                Hoàn tác{history.count > 0 ? ` (${history.count})` : ""}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!confirm("Thao tác này sẽ đồng bộ toàn bộ 67 sản phẩm gốc lên máy chủ để tính năng tự động đẩy số thứ tự hoạt động chính xác. Bạn có muốn tiếp tục?")) return;
                  const pwd = getPassword();
                  if (!pwd) return;
                  try {
                    let count = 0;
                    toast.info(`Bắt đầu đồng bộ ${flatProducts.length} sản phẩm. Quá trình này có thể mất 15-30 giây...`);
                    for (const p of flatProducts) {
                      count++;
                      if (count % 10 === 0) toast.info(`Đang đồng bộ ${count}/${flatProducts.length}...`);
                      await saveProductOverride({
                        password: pwd,
                        action: "upsert",
                        no: p.no,
                        section: p.section,
                        name: p.name,
                        desc: p.desc,
                        link_url: p.link,
                      });
                    }
                    toast.success(`Đã đồng bộ thành công ${count} sản phẩm lên máy chủ`);
                    refreshOverrides();
                  } catch (e: any) {
                    toast.error("Lỗi: " + e.message);
                  }
                }}
                className="h-11 px-4 rounded-md bg-yellow-500/20 text-yellow-600 border border-yellow-500/30 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-yellow-500/30 transition"
              >
                <RotateCcw className="w-4 h-4" />
                Đồng bộ Database
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => (unlocked ? lock() : setAskUnlock(true))}
            className={`h-11 px-4 rounded-md text-sm font-semibold tracking-wide inline-flex items-center justify-center gap-2 transition border ${
              unlocked
                ? "bg-accent/20 text-foreground border-accent hover:bg-accent/30"
                : "bg-card text-foreground border-border hover:bg-muted/50"
            }`}
          >
            {unlocked ? <LockOpen className="w-4 h-4 text-accent-foreground" /> : <Lock className="w-4 h-4" />}
            {unlocked ? "Đã mở khoá" : "Mở khoá KEY"}
          </button>
        </div>

        <UnlockDialog open={askUnlock} onOpenChange={setAskUnlock} />
        <ProductEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          initial={editInitial}
          sectionOptions={sectionTitles}
          onSaved={(row) => {
            if (editInitial?.no && editInitial.no !== row.no) {
              refreshOverrides();
              toast.success("Đã sắp xếp lại danh sách");
            } else {
              upsertOverride(row, {
                snapshotLabel: editInitial?.no
                  ? `Sửa "${editInitial?.name ?? row.name ?? row.no}"`
                  : `Thêm "${row.name ?? row.no}"`,
              });
            }
          }}
        />

        <Dialog
          open={exporting}
          onOpenChange={(o) => {
            // Only allow closing when finished or errored
            if (!o && exportProgress && (exportProgress.phase === "done" || exportProgress.phase === "error")) {
              setExporting(false);
              setExportProgress(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {exportProgress?.phase === "done" ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    Xuất PDF hoàn tất
                  </>
                ) : exportProgress?.phase === "error" ? (
                  <>
                    <AlertCircle className="w-5 h-5 text-destructive" />
                    Xuất PDF thất bại
                  </>
                ) : (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    Đang xuất PDF…
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {exportProgress?.message ?? "Đang chuẩn bị…"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 pt-2">
              <Progress value={exportProgress?.percent ?? 0} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {exportProgress?.phase === "done"
                    ? "Tệp đã được tải xuống"
                    : exportProgress?.phase === "error"
                      ? "Vui lòng thử lại"
                      : "Vui lòng không đóng tab trong khi xuất"}
                </span>
                <span className="font-mono">{exportProgress?.percent ?? 0}%</span>
              </div>
              {(exportProgress?.phase === "done" || exportProgress?.phase === "error") && (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setExporting(false);
                      setExportProgress(null);
                    }}
                    className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90"
                  >
                    Đóng
                  </button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <p className="text-xs text-muted-foreground mt-3 px-1">
          Hiển thị <span className="font-semibold text-foreground">{filtered.length}</span> / {merged.length} sản phẩm
        </p>
      </section>

      <main className="container mx-auto px-4 md:px-6 py-6 flex-1 w-full">
        {/* Desktop Table */}
        <div className="hidden md:block bg-card rounded-lg shadow-sm border border-border overflow-hidden mx-auto" style={{ maxWidth: "95%" }}>
          <div className="table-wrap" ref={tableWrapRef}>
            <table className="product-table">
              <thead>
                <tr>
                  <th style={{ width: "150px" }}>Section</th>
                  <th style={{ width: "70px" }}>No.</th>
                  <th style={{ width: "120px" }}>Hình ảnh</th>
                  <th>Product</th>
                  <th style={{ width: "120px" }}>Công bố</th>
                  {unlocked && <th style={{ width: "90px" }}>Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {grouped.length === 0 && (
                  <tr>
                    <td colSpan={unlocked ? 6 : 5} className="text-center py-12 text-muted-foreground text-sm">
                      Không tìm thấy sản phẩm phù hợp.
                    </td>
                  </tr>
                )}
                {(() => {
                  let seq = 0;
                  return grouped.map(([sectionTitle, rows]) =>
                    rows.map((row, idx) => {
                      seq += 1;
                      const sec = sections.find((s) => s.title === sectionTitle);
                      return (
                        <tr key={row.no}>
                          {idx === 0 && (
                            <td rowSpan={rows.length} className="section-cell">
                              <div className="inline-flex items-center gap-1.5">
                                <span>{sectionTitle}</span>
                                {unlocked && (
                                  <button
                                    type="button"
                                    onClick={() => handleRenameSection(sectionTitle, rows)}
                                    title="Đổi tên nhóm"
                                    className="opacity-60 hover:opacity-100 transition"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              {sec?.vi && (
                                <div className="text-[11px] font-normal text-muted-foreground mt-1 normal-case tracking-normal">
                                  {sec.vi}
                                </div>
                              )}
                            </td>
                          )}
                          <td className="text-center font-semibold text-foreground">
                            {String(seq).padStart(2, "0")}
                          </td>
                          <td className="overflow-visible">
                            <ProductImageCell
                              productNo={row.no}
                              src={overrides[row.no]?.image_url ?? undefined}
                              onChange={(src) => setImage(row.no, src)}
                            />
                          </td>
                          <td>
                            <div className="product-name">{row.name}</div>
                            <div className="product-desc">{row.desc}</div>
                          </td>
                          <td className="text-center overflow-visible">
                            <ProductLinkCell
                              productNo={row.no}
                              href={row.link}
                              onChange={(href) => setLink(row.no, href)}
                            />
                          </td>
                          {unlocked && (
                            <td className="text-center">
                              <div className="inline-flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEdit(row)}
                                  className="w-7 h-7 inline-flex items-center justify-center rounded border border-border hover:bg-accent/20"
                                  title="Chỉnh sửa"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(row)}
                                  className="w-7 h-7 inline-flex items-center justify-center rounded border border-border text-destructive hover:bg-destructive/10"
                                  title="Xoá"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    }),
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden space-y-3">
          {grouped.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Không tìm thấy sản phẩm phù hợp.
            </div>
          )}
          {(() => {
            let seq = 0;
            return grouped.map(([sectionTitle, rows]) => {
              const sec = sections.find((s) => s.title === sectionTitle);
              return (
                <div key={sectionTitle}>
                  {/* Section Header */}
                  <div className="flex items-center gap-2 mb-3 mt-4">
                    <div className="flex-1 h-[1px] bg-border" />
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                      style={{ background: "hsl(var(--header-bg))", color: "hsl(var(--header-text))" }}>
                      <span className="text-xs font-black uppercase tracking-widest">{sectionTitle}</span>
                      {unlocked && (
                        <button
                          type="button"
                          onClick={() => handleRenameSection(sectionTitle, rows)}
                          title="Đổi tên nhóm"
                          className="opacity-60 hover:opacity-100 transition"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="flex-1 h-[1px] bg-border" />
                  </div>
                  {sec?.vi && (
                    <p className="text-center text-xs text-muted-foreground mb-3 -mt-1">{sec.vi}</p>
                  )}

                  {/* Product Cards */}
                  {rows.map((row) => {
                    seq += 1;
                    const currentSeq = seq;
                    return (
                      <div key={row.no}
                        className="bg-card border border-border rounded-xl shadow-sm mb-3 overflow-hidden">
                        {/* Card Top: image left, info right */}
                        <div className="flex items-start gap-3 p-3">
                          {/* Image */}
                          <div className="flex-shrink-0">
                            <ProductImageCell
                              productNo={row.no}
                              src={overrides[row.no]?.image_url ?? undefined}
                              onChange={(src) => setImage(row.no, src)}
                            />
                          </div>
                          {/* Text info */}
                          <div className="flex-1 min-w-0 pt-1">
                            {/* STT badge */}
                            <span className="inline-block text-[10px] font-black px-2 py-0.5 rounded mb-1.5"
                              style={{ background: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))" }}>
                              {String(currentSeq).padStart(2, "0")}
                            </span>
                            <div className="font-bold text-sm leading-tight text-foreground mb-1 uppercase tracking-wide">
                              {row.name}
                            </div>
                            <div className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                              {row.desc}
                            </div>
                          </div>
                          {/* Admin buttons */}
                          {unlocked && (
                            <div className="flex flex-col gap-1 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => openEdit(row)}
                                className="w-7 h-7 inline-flex items-center justify-center rounded border border-border hover:bg-accent/20"
                                title="Chỉnh sửa"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(row)}
                                className="w-7 h-7 inline-flex items-center justify-center rounded border border-border text-destructive hover:bg-destructive/10"
                                title="Xoá"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                        {/* Card Bottom: Link button */}
                        {row.link && (
                          <div className="border-t border-border px-3 py-2">
                            <ProductLinkCell
                              productNo={row.no}
                              href={row.link}
                              onChange={(href) => setLink(row.no, href)}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            });
          })()}
        </div>
      </main>

      <footer className="footer-gradient mt-10">
        <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p className="text-sm md:text-base font-semibold tracking-[0.2em] text-primary-foreground">
            www.desembrevn.com
          </p>
          <div className="md:text-right">
            <p className="elegant-title text-xl md:text-2xl text-primary-foreground leading-tight">
              List of Desembre
            </p>
            <p className="elegant-title text-2xl md:text-3xl text-accent font-semibold tracking-wide">
              PRODUCTS 2026
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

function defaultOverride(no: number): OverrideRow {
  return {
    no,
    image_url: null,
    link_url: null,
    section: null,
    name: null,
    desc: null,
    deleted: false,
    is_custom: false,
  };
}

const Index = () => {
  const [overrides, setOverrides] = useState<Record<number, OverrideRow>>({});

  const refreshOverrides = useCallback(async () => {
    const { data, error } = await supabase.from("product_overrides").select("*");
    if (error) {
      console.error("Fetch error:", error);
      toast.error(`Không thể tải dữ liệu từ Supabase: ${error.message}`);
      return;
    }
    if (!data) return;
    const map: Record<number, OverrideRow> = {};
    for (const r of data as OverrideRow[]) map[r.no] = r;
    setOverrides(map);
  }, []);

  useEffect(() => {
    refreshOverrides();
  }, [refreshOverrides]);

  const applyRestore = useCallback((no: number, row: OverrideRow | null) => {
    setOverrides((prev) => {
      const n = { ...prev };
      if (row) n[no] = row;
      else delete n[no];
      return n;
    });
  }, []);

  return (
    <EditHistoryProvider applyRestore={applyRestore}>
      <IndexInner overrides={overrides} setOverrides={setOverrides} refreshOverrides={refreshOverrides} />
    </EditHistoryProvider>
  );
};

export default Index;
