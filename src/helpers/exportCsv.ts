// src/helpers/exportCsv.ts

/**
 * Download array of objects sebagai file CSV.
 *
 * @param data     - Array objek yang mau di-export
 * @param filename - Nama file hasil download (contoh: "stok-obat.csv")
 * @param labels   - (Opsional) Mapping key → label kolom yang lebih mudah dibaca
 *
 * Contoh pemakaian:
 *   downloadCSV(drugs, "stok-obat.csv", { id: "ID Obat", nama: "Nama Obat" })
 */
export function downloadCSV(
  data: Record<string, unknown>[],
  filename: string,
  labels?: Record<string, string>
): void {
  if (data.length === 0) return;

  const keys = Object.keys(data[0]);

  // ── Baris 1: Header kolom ──
  const rows: string[] = [];
  rows.push(
    keys
      .map((k) => `"${(labels?.[k] ?? k).replace(/"/g, '""')}"`)
      .join(",")
  );

  // ── Baris 2+: Data ──
  for (const item of data) {
    rows.push(
      keys.map((k) => {
        const raw = String(item[k] ?? "");
        return `"${raw.replace(/"/g, '""')}"`;
      }).join(",")
    );
  }

  // ── Buat Blob & trigger download ──
  // \uFEFF = BOM UTF-8, supaya Excel baca karakter Indonesia dengan benar
  const csv = "\uFEFF" + rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  // Bersihkan dari DOM & memori
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}