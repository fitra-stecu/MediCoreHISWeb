// src/helpers/exportPdf.ts

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Download array of objects sebagai file PDF.
 *
 * @param data     - Array objek yang mau di-export
 * @param filename - Nama file tanpa ekstensi (contoh: "stok-obat")
 * @param labels   - (Opsional) Mapping key → label kolom
 * @param title    - (Opsional) Judul yang tampil di atas tabel
 *
 * Contoh:
 *   downloadPDF(drugs, "stok-obat", { id: "ID Obat", nama: "Nama Obat" }, "Laporan Stok Obat")
 */
export function downloadPDF(
  data: Record<string, unknown>[],
  filename: string,
  labels?: Record<string, string>,
  title: string = "Laporan Data"
): void {
  if (data.length === 0) return;

  const keys = Object.keys(data[0]);

  // ── Siapkan header & baris data ──
  const head = [keys.map((k) => labels?.[k] ?? k)];
  const body = data.map((item) =>
    keys.map((k) => String(item[k] ?? ""))
  );

  // ── Buat dokumen PDF (landscape supaya kolomnya muat) ──
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // ── Judul ──
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 18);

  // ── Subtitle: tanggal & jumlah data ──
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  const tanggal = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  doc.text(`Dicetak: ${tanggal}  |  Total: ${data.length} baris`, 14, 25);

  // ── Tabel ──
  autoTable(doc, {
    head,
    body,
    startY: 30,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [220, 220, 220],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [21, 73, 160],   // warna header: #1549A0
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],  // baris genap: abu-abu sangat tipis
    },
    // Kolom "Status" diwarnai sesuai nilainya
    didParseCell: (hookData) => {
      const colIndex = hookData.column.index;
      const key = keys[colIndex];
      const val = String(hookData.cell.raw ?? "").toLowerCase();

      // Cari kolom "status" berdasarkan label
      if (labels?.[key] === "Status" || key === "status") {
        if (val === "kritis") {
          hookData.cell.styles.textColor = [220, 38, 38];
          hookData.cell.styles.fontStyle = "bold";
        } else if (val === "rendah") {
          hookData.cell.styles.textColor = [217, 119, 6];
          hookData.cell.styles.fontStyle = "bold";
        } else if (val === "normal") {
          hookData.cell.styles.textColor = [5, 150, 105];
        }
      }
    },
  });

  // ── Footer di setiap halaman ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(160);
    doc.text(
      `Halaman ${i} dari ${pageCount}  |  MediCore HIS - Hospital Information System`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
  }

  // ── Trigger download ──
  doc.save(`${filename}.pdf`);
}