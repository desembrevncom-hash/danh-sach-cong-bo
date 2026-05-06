import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export type ExportProgress = {
  phase: "preparing" | "rendering" | "paginating" | "saving" | "done" | "error";
  percent: number; // 0-100
  message: string;
};

export async function exportTableToPdf(
  tableEl: HTMLElement,
  filename = "danh-sach-san-pham.pdf",
  onProgress?: (p: ExportProgress) => void,
) {
  const report = (p: ExportProgress) => onProgress?.(p);

  try {
    report({ phase: "preparing", percent: 5, message: "Chuẩn bị nội dung…" });
    // Yield to UI so the progress modal paints before heavy work begins.
    await new Promise((r) => setTimeout(r, 50));

    report({ phase: "rendering", percent: 20, message: "Đang chụp bảng dữ liệu…" });
    const canvas = await html2canvas(tableEl, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      // Ensure off-screen content (e.g. link badges) renders fully
      windowWidth: tableEl.scrollWidth,
      windowHeight: tableEl.scrollHeight,
    });
    report({ phase: "rendering", percent: 55, message: "Đã chụp xong, tạo trang PDF…" });

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const imgW = pageW - margin * 2;
    const imgH = (canvas.height * imgW) / canvas.width;

    if (imgH <= pageH - margin * 2) {
      report({ phase: "saving", percent: 85, message: "Đang ghi tệp PDF…" });
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", margin, margin, imgW, imgH);
    } else {
      const pxPerMm = canvas.width / imgW;
      const pageHpx = (pageH - margin * 2) * pxPerMm;
      const totalPages = Math.ceil(canvas.height / pageHpx);
      let y = 0;
      let page = 0;
      while (y < canvas.height) {
        const sliceH = Math.min(pageHpx, canvas.height - y);
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceH;
        const ctx = sliceCanvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
        if (page > 0) pdf.addPage();
        const sliceMm = sliceH / pxPerMm;
        pdf.addImage(
          sliceCanvas.toDataURL("image/jpeg", 0.9),
          "JPEG",
          margin,
          margin,
          imgW,
          sliceMm,
        );
        page += 1;
        y += sliceH;
        const pct = 55 + Math.round((page / totalPages) * 35);
        report({
          phase: "paginating",
          percent: pct,
          message: `Đang dựng trang ${page}/${totalPages}…`,
        });
        // Let the UI breathe between pages
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    report({ phase: "saving", percent: 95, message: "Đang lưu tệp…" });
    pdf.save(filename);
    report({ phase: "done", percent: 100, message: "Hoàn tất!" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lỗi không xác định";
    report({ phase: "error", percent: 0, message: msg });
    throw err;
  }
}
