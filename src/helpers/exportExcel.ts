// src/helpers/exportExcel.ts

import * as XLSX from "xlsx";

/**
 * Download array of objects sebagai file Excel (.xlsx).
 *
 * @param data     - Array objek yang mau di-export
 * @param filename - Nama file tanpa ekstensi (contoh: "stok-obat")
 * @param labels   - (Opsional) Mapping key → label kolom
 * @param sheetName - (Opsional) Nama sheet di dalam Excel, default "Data"
 */
export function downloadExcel(
  data: Record<string, unknown>[],
  filename: string,
  labels?: Record<string, string>,
  sheetName: string = "Data"
): void {
  if (data.length === 0) return;

  const keys = Object.keys(data[0]);

  // ── Transformasi: ganti key dengan label ──
  const transformed = data.map((item) => {
    const row: Record<string, unknown> = {};
    for (const key of keys) {
      const header = labels?.[key] ?? key;
      row[header] = item[key];
    }
    return row;
  });

  // ── Buat worksheet ──
  const ws = XLSX.utils.json_to_sheet(transformed);

  // ── Atur lebar kolom otomatis ──
  ws["!cols"] = keys.map((key) => {
    const header = labels?.[key] ?? key;
    let maxLen = header.length;
    for (const item of data) {
      const val = String(item[key] ?? "");
      if (val.length > maxLen) maxLen = val.length;
    }
    return { wch: Math.min(maxLen + 4, 40) };
  });

  // ── Buat workbook & trigger download ──
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}