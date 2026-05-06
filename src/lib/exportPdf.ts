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

    // 1. Temporarily disable sticky and transitions
    const style = document.createElement("style");
    style.innerHTML = `
      [data-pdf-exporting] .sticky { position: static !important; }
      [data-pdf-exporting] * { transition: none !important; animation: none !important; }
    `;
    document.head.appendChild(style);
    tableEl.setAttribute("data-pdf-exporting", "true");

    report({ phase: "rendering", percent: 20, message: "Đang chụp bảng dữ liệu…" });
    
    // Ensure we capture from the very top
    const canvas = await html2canvas(tableEl, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      windowWidth: tableEl.scrollWidth,
      windowHeight: tableEl.scrollHeight,
      onclone: (clonedDoc) => {
        // Find the table in the cloned document and reset its parent's scroll
        const clonedTable = clonedDoc.querySelector("[data-pdf-exporting]") as HTMLElement;
        if (clonedTable && clonedTable.parentElement) {
          clonedTable.parentElement.scrollTop = 0;
          clonedTable.parentElement.scrollLeft = 0;
        }
      }
    });

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const imgW = pageW - margin * 2;
    
    // Use the actual rendered width for the ratio calculation
    const tableRect = tableEl.getBoundingClientRect();
    const mmPerPx = imgW / tableRect.width;

    // Capture all links with a larger hit area (the entire cell if possible)
    const links = Array.from(tableEl.querySelectorAll("[data-pdf-link]")).map((el) => {
      const rect = el.getBoundingClientRect();
      // If the link is inside a cell (TD), let's try to get the cell's bounds for a bigger hit area
      const cell = el.closest("td");
      const hitRect = cell ? cell.getBoundingClientRect() : rect;
      
      return {
        url: el.getAttribute("data-pdf-link") || "",
        x: hitRect.left - tableRect.left,
        y: hitRect.top - tableRect.top,
        w: hitRect.width,
        h: hitRect.height,
      };
    });

    const addLinksToPage = (pageYpx: number, pageHmm: number) => {
      const pageBottomPx = pageYpx + (pageHmm / mmPerPx);
      
      links.forEach((link) => {
        // Use the center of the link/cell to determine which page it belongs to
        const linkCenterY = link.y + link.h / 2;
        if (linkCenterY >= pageYpx && linkCenterY <= pageBottomPx) {
          const xMm = margin + (link.x * mmPerPx);
          const yMm = margin + ((link.y - pageYpx) * mmPerPx);
          const wMm = link.w * mmPerPx;
          const hMm = link.h * mmPerPx;
          
          // Add the link area to the PDF
          pdf.link(xMm, yMm, wMm, hMm, { url: link.url });
        }
      });
    };

    const imgH = (canvas.height * imgW) / canvas.width;

    if (imgH <= pageH - margin * 2) {
      report({ phase: "saving", percent: 85, message: "Đang ghi tệp PDF…" });
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", margin, margin, imgW, imgH);
      addLinksToPage(0, imgH);
    } else {
      const pxPerMm = canvas.width / imgW;
      const pageHpx = (pageH - margin * 2) * pxPerMm;
      const totalPages = Math.ceil(canvas.height / pageHpx);
      let y = 0;
      let page = 0;
      
      // Calculate CSS pixels per Canvas pixel
      const cssToCanvas = canvas.width / tableRect.width;

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
        
        // Add hyperlinks for this specific page slice (y is canvas px, convert to CSS px)
        addLinksToPage(y / cssToCanvas, sliceMm);

        page += 1;
        y += sliceH;
        const pct = 55 + Math.round((page / totalPages) * 35);
        report({
          phase: "paginating",
          percent: pct,
          message: `Đang dựng trang ${page}/${totalPages}…`,
        });
        await new Promise((r) => setTimeout(r, 10));
      }
    }

    // Cleanup
    tableEl.removeAttribute("data-pdf-exporting");
    document.head.removeChild(style);


    report({ phase: "saving", percent: 95, message: "Đang lưu tệp…" });

    pdf.save(filename);

    report({ phase: "done", percent: 100, message: "Hoàn tất!" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lỗi không xác định";
    report({ phase: "error", percent: 0, message: msg });
    throw err;
  }
}
