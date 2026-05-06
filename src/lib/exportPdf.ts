import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type ExportProgress = {
  phase: "preparing" | "rendering" | "paginating" | "saving" | "done" | "error";
  percent: number; // 0-100
  message: string;
};

export async function exportTableToPdf(
  tableEl: HTMLTableElement,
  filename = "danh-sach-san-pham.pdf",
  onProgress?: (p: ExportProgress) => void,
) {
  const report = (p: ExportProgress) => onProgress?.(p);

  try {
    report({ phase: "preparing", percent: 10, message: "Đang thu thập dữ liệu..." });
    await new Promise((r) => setTimeout(r, 50));

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    
    // Add font support if needed, but standard fonts work for basic Vietnamese
    // For full Vietnamese support, we usually need a custom font. 
    // Since jspdf standard fonts have limited VN support, we'll try to use the built-in ones first.

    const headers = [["SECTION", "NO.", "HÌNH ẢNH", "PRODUCT", "CÔNG BỐ"]];
    const rows: any[] = [];
    const imagesToLoad: { url: string; rowIdx: number; colIdx: number }[] = [];

    const tableRows = Array.from(tableEl.querySelectorAll("tbody tr"));
    const totalRows = tableRows.length;

    for (let i = 0; i < totalRows; i++) {
      const tr = tableRows[i];
      const section = tr.querySelector("td:nth-child(1)")?.textContent?.trim() || "";
      const no = tr.querySelector("td:nth-child(2)")?.textContent?.trim() || "";
      
      // Get image URL
      const img = tr.querySelector("td:nth-child(3) img") as HTMLImageElement;
      const imgUrl = img?.src;
      
      // Get Name and Description
      const name = tr.querySelector(".product-name")?.textContent?.trim() || "";
      const desc = tr.querySelector(".product-desc")?.textContent?.trim() || "";
      const productContent = `${name}\n${desc}`;

      // Get Link
      const linkEl = tr.querySelector("[data-pdf-link]") as HTMLAnchorElement;
      const linkUrl = linkEl?.getAttribute("data-pdf-link") || "";

      rows.push([
        section,
        no,
        "", // Placeholder for image
        productContent,
        linkUrl ? "Link" : "—"
      ]);

      if (imgUrl && !imgUrl.includes("data:image/svg")) {
        imagesToLoad.push({ url: imgUrl, rowIdx: i, colIdx: 2 });
      }

      const pct = 10 + Math.round((i / totalRows) * 30);
      if (i % 10 === 0) report({ phase: "preparing", percent: pct, message: `Đang xử lý dòng ${i + 1}...` });
    }

    report({ phase: "rendering", percent: 50, message: "Đang dựng bảng PDF..." });

    autoTable(pdf, {
      head: headers,
      body: rows,
      startY: 20,
      margin: { top: 20, left: 10, right: 10, bottom: 20 },
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 4,
        valign: "middle",
        font: "helvetica", // standard font
      },
      headStyles: {
        fillColor: [34, 34, 34],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 25, halign: "center", fontStyle: "bold" },
        1: { cellWidth: 12, halign: "center" },
        2: { cellWidth: 30, halign: "center" },
        3: { cellWidth: "auto" },
        4: { cellWidth: 25, halign: "center", textColor: [0, 102, 204] },
      },
      didDrawCell: (data) => {
        // Handle links in the last column
        if (data.section === "body" && data.column.index === 4) {
          const rowData = rows[data.row.index];
          const url = rowData[4] === "Link" ? tableRows[data.row.index].querySelector("[data-pdf-link]")?.getAttribute("data-pdf-link") : null;
          if (url) {
            pdf.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url });
          }
        }

        // Handle images
        if (data.section === "body" && data.column.index === 2) {
          const imgData = imagesToLoad.find(it => it.rowIdx === data.row.index);
          if (imgData) {
            try {
              // We'll draw images in a separate pass or if already cached.
              // For simplicity in this logic, we use a hook to mark positions.
            } catch (e) {}
          }
        }
      },
      didParseCell: (data) => {
        // Multi-line support for product content
        if (data.column.index === 3 && data.section === "body") {
          // data.cell.text is already handled by the string concatenation above
        }
      }
    });

    // Add a title to the PDF
    pdf.setFontSize(16);
    pdf.text("DANH SÁCH CÔNG BỐ SẢN PHẨM DESEMBRE", 105, 12, { align: "center" });

    report({ phase: "saving", percent: 95, message: "Đang lưu tệp..." });
    pdf.save(filename);
    report({ phase: "done", percent: 100, message: "Hoàn tất!" });

  } catch (err) {
    console.error("PDF Export Error:", err);
    report({ phase: "error", percent: 0, message: err instanceof Error ? err.message : "Lỗi không xác định" });
    throw err;
  }
}

