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
    await new Promise((r) => setTimeout(r, 50));

    // 1. Temporarily style the table for perfect capture
    const originalStyle = tableEl.getAttribute("style") || "";
    const style = document.createElement("style");
    style.innerHTML = `
      .pdf-export-mode .sticky { position: static !important; }
      .pdf-export-mode .link-badge { display: inline-block !important; }
      .pdf-export-mode * { transition: none !important; animation: none !important; }
    `;
    document.head.appendChild(style);
    tableEl.classList.add("pdf-export-mode");

    report({ phase: "rendering", percent: 20, message: "Đang chụp bảng dữ liệu…" });

    // Capture the entire table width and height
    const canvas = await html2canvas(tableEl, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      width: tableEl.scrollWidth,
      height: tableEl.scrollHeight,
      windowWidth: tableEl.scrollWidth,
      windowHeight: tableEl.scrollHeight,
    });

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const imgW = pageW - margin * 2;
    const mmPerPx = imgW / tableEl.scrollWidth;

    // Capture link positions BEFORE we cleanup the styles
    // We use offsetTop/offsetLeft relative to the table to be 100% accurate
    const links: { url: string; x: number; y: number; w: number; h: number }[] = [];
    const linkEls = tableEl.querySelectorAll("[data-pdf-link]");
    
    linkEls.forEach((el) => {
      const htmlEl = el as HTMLElement;
      let top = 0;
      let left = 0;
      let curr: HTMLElement | null = htmlEl;
      
      // Calculate offset relative to the tableEl
      while (curr && curr !== tableEl) {
        top += curr.offsetTop;
        left += curr.offsetLeft;
        curr = curr.offsetParent as HTMLElement;
      }

      links.push({
        url: htmlEl.getAttribute("data-pdf-link") || "",
        x: left,
        y: top,
        w: htmlEl.offsetWidth,
        h: htmlEl.offsetHeight,
      });
    });

    const addLinksToPage = (pageYpx: number, pageHmm: number) => {
      const pageBottomPx = pageYpx + (pageHmm / mmPerPx);
      links.forEach((link) => {
        // If the center of the link is on this page
        const centerY = link.y + link.h / 2;
        if (centerY >= pageYpx && centerY <= pageBottomPx) {
          const xMm = margin + (link.x * mmPerPx);
          const yMm = margin + ((link.y - pageYpx) * mmPerPx);
          const wMm = link.w * mmPerPx;
          const hMm = link.h * mmPerPx;
          // Make the link area slightly larger for easier clicking
          pdf.link(xMm - 1, yMm - 1, wMm + 2, hMm + 2, { url: link.url });
        }
      });
    };

    const imgH = (canvas.height * imgW) / canvas.width;

    if (imgH <= pageH - margin * 2) {
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", margin, margin, imgW, imgH);
      addLinksToPage(0, imgH);
    } else {
      const pxPerMm = canvas.width / imgW;
      const canvasScale = canvas.width / tableEl.scrollWidth;
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
        pdf.addImage(sliceCanvas.toDataURL("image/jpeg", 0.9), "JPEG", margin, margin, imgW, sliceMm);
        
        // Add links for this slice. y is in canvas pixels, convert to table CSS pixels
        addLinksToPage(y / canvasScale, sliceMm);

        page += 1;
        y += sliceH;
        report({ phase: "paginating", percent: 50 + Math.round((page / totalPages) * 40), message: `Đang dựng trang ${page}/${totalPages}…` });
        await new Promise((r) => setTimeout(r, 10));
      }
    }

    // Cleanup
    tableEl.classList.remove("pdf-export-mode");
    document.head.removeChild(style);

    report({ phase: "saving", percent: 95, message: "Đang lưu tệp…" });
    pdf.save(filename);
    report({ phase: "done", percent: 100, message: "Hoàn tất!" });
  } catch (err) {
    console.error("PDF Export Error:", err);
    report({ phase: "error", percent: 0, message: err instanceof Error ? err.message : "Lỗi không xác định" });
    throw err;
  }
}


