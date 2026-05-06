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
      const tr = tableRows[i] as HTMLTableRowElement;
      
      // Skip helper rows or empty rows if any
      if (!tr.cells || tr.cells.length < 2) continue;

      const section = tr.cells[0]?.textContent?.trim() || "";
      const no = tr.cells[1]?.textContent?.trim() || "";
      
      // Get Name and Description
      const name = tr.querySelector(".product-name")?.textContent?.trim() || "";
      const desc = tr.querySelector(".product-desc")?.textContent?.trim() || "";
      const productContent = `${name}\n${desc}`;

      // Get Link
      const linkEl = tr.querySelector("[data-pdf-link]") as HTMLAnchorElement;
      const linkUrl = linkEl?.getAttribute("data-pdf-link") || null;

      rows.push({
        section,
        no,
        image: "", 
        content: productContent,
        link: linkUrl ? "Link" : "—",
        rawUrl: linkUrl
      });

      const pct = 10 + Math.round((i / totalRows) * 30);
      if (i % 10 === 0) report({ phase: "preparing", percent: pct, message: `Đang xử lý dòng ${i + 1}...` });
    }

    report({ phase: "rendering", percent: 50, message: "Đang dựng bảng PDF..." });

    autoTable(pdf, {
      head: headers,
      body: rows.map(r => [r.section, r.no, r.image, r.content, r.link]),
      startY: 20,
      margin: { top: 20, left: 10, right: 10, bottom: 20 },
      theme: "grid",
      styles: {
        fontSize: 8.5,
        cellPadding: 3,
        valign: "middle",
        font: "helvetica",
      },
      headStyles: {
        fillColor: [34, 34, 34],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 22, halign: "center", fontStyle: "bold" },
        1: { cellWidth: 10, halign: "center" },
        2: { cellWidth: 28, halign: "center" },
        3: { cellWidth: "auto" },
        4: { cellWidth: 20, halign: "center", textColor: [0, 102, 204] },
      },
      didDrawCell: (data) => {
        // Handle links in the last column (index 4)
        if (data.section === "body" && data.column.index === 4) {
          const rowIdx = data.row.index;
          const rowData = rows[rowIdx];
          if (rowData && rowData.rawUrl) {
            pdf.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: rowData.rawUrl });
          }
        }
      },
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

