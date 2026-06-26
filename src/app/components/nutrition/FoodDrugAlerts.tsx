// src/app/components/nutrition/FoodDrugAlerts.tsx

import { useState } from "react";
import {
  ChevronDown, X, AlertTriangle, ShieldAlert, ShieldCheck, Shield, Eye, Download,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════
//  EXPORT UTILS (DITAMBAHKAN)
// ═══════════════════════════════════════════════════════════════
function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = String(row[h] ?? "");
          return val.includes(",") || val.includes('"') || val.includes("\n")
            ? `"${val.replace(/"/g, '""')}"`
            : val;
        })
        .join(",")
    ),
  ];
  const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function downloadExcel(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const html = [
    `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">`,
    `<head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Sheet1</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>`,
    `<body><table border="1">`,
    `<tr>${headers.map((h) => `<th style="background:#f0f0f0;font-weight:bold;">${h}</th>`).join("")}</tr>`,
    ...data.map((row) => `<tr>${headers.map((h) => `<td style="mso-number-format:'\\@';">${row[h] ?? ""}</td>`).join("")}</tr>`),
    `</table></body></html>`,
  ].join("");
  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.xls`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// ═══════════════════════════════════════════════════════════════
//  TYPE
// ═══════════════════════════════════════════════════════════════
interface FoodDrugAlert {
  id: number;
  obat: string;
  makanan: string;
  pasien: string;
  severity: "sedang" | "tinggi" | "kritis";
  aksi: string;
}

// ═══════════════════════════════════════════════════════════════
//  DATA AWAL
// ═══════════════════════════════════════════════════════════════
const INITIAL_ALERTS: FoodDrugAlert[] = [
  { id: 1, obat: "Warfarin", makanan: "Bayam, Brokoli (Vit. K tinggi)", pasien: "Agus Salim (P-0891)", severity: "tinggi", aksi: "Batasi konsumsi sayuran hijau" },
  { id: 2, obat: "Tetracycline", makanan: "Susu, Produk Dairy", pasien: "Sri Rahayu (P-0903)", severity: "sedang", aksi: "Jeda 2 jam sebelum/sesudah makan" },
  { id: 3, obat: "Metformin", makanan: "Alkohol", pasien: "Bambang S. (P-0915)", severity: "tinggi", aksi: "Hindari konsumsi alkohol" },
  { id: 4, obat: "MAO Inhibitor", makanan: "Keju tua, Anggur merah (Tyramine)", pasien: "Rini P. (P-0922)", severity: "kritis", aksi: "Restriksi makanan tinggi tyramine" },
  { id: 5, obat: "Levothyroxine", makanan: "Soy products, Kacang kedelai", pasien: "Dewi A. (P-0934)", severity: "sedang", aksi: "Konsumsi obat 30 mnt sebelum makan" },
];

// ═══════════════════════════════════════════════════════════════
//  KONFIGURASI PER SEVERITY
//  Ini pola baru: semua styling & icon dikontrol oleh satu objek
// ═══════════════════════════════════════════════════════════════
const SEVERITY_CONFIG: Record<FoodDrugAlert["severity"], {
  label: string;
  icon: React.ElementType;
  border: string;
  bg: string;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  accent: string;
}> = {
  sedang: {
    label: "SEDANG",
    icon: Shield,
    border: "border-amber-200",
    bg: "bg-amber-50/60",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-700",
    accent: "#D97706",
  },
  tinggi: {
    label: "TINGGI",
    icon: AlertTriangle,
    border: "border-orange-200",
    bg: "bg-orange-50/60",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-700",
    accent: "#EA580C",
  },
  kritis: {
    label: "KRITIS",
    icon: ShieldAlert,
    border: "border-red-200",
    bg: "bg-red-50/60",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
    accent: "#DC2626",
  },
};

// Urutan filter: semua dulu, lalu dari paling parah
type FilterType = "semua" | "kritis" | "tinggi" | "sedang";
const FILTER_ORDER: FilterType[] = ["semua", "kritis", "tinggi", "sedang"];

// ═══════════════════════════════════════════════════════════════
//  MODAL DETAIL
// ═══════════════════════════════════════════════════════════════
function DetailModal({ alert, onClose }: { alert: FoodDrugAlert; onClose: () => void }) {
  const cfg = SEVERITY_CONFIG[alert.severity];
  const Icon = cfg.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header dengan warna sesuai severity */}
        <div className={`flex items-center justify-between p-5 border-b ${cfg.border} ${cfg.bg} rounded-t-2xl`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.iconBg}`}>
              <Icon size={20} className={cfg.iconColor} />
            </div>
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Interaksi Obat & Makanan</div>
              <div className={`text-sm font-bold ${cfg.badgeText}`}>Level: {cfg.label}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/60 transition-colors"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Obat */}
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Obat</div>
            <div className="text-base font-bold text-foreground" style={{ color: cfg.accent }}>{alert.obat}</div>
          </div>

          {/* Makanan yang berinteraksi */}
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Makanan / Zat yang Berinteraksi</div>
            <div className="text-sm font-semibold text-foreground">{alert.makanan}</div>
          </div>

          {/* Pasien */}
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Pasien Terdampak</div>
            <div className="text-sm text-foreground">{alert.pasien}</div>
          </div>

          {/* Aksi — highlight khusus */}
          <div className={`p-4 rounded-xl border ${cfg.border} ${cfg.bg}`}>
            <div className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: cfg.accent }}>Rekomendasi Tindakan</div>
            <div className="text-sm font-semibold text-foreground leading-relaxed">{alert.aksi}</div>
          </div>
        </div>

        <div className="flex justify-end p-4 border-t border-border bg-muted/50 rounded-b-2xl">
          <button className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors" onClick={onClose}>Tutup</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  KOMPONEN UTAMA
// ═══════════════════════════════════════════════════════════════
export default function FoodDrugAlerts() {
  const [alerts, setAlerts] = useState<FoodDrugAlert[]>(INITIAL_ALERTS);
  const [filter, setFilter] = useState<FilterType>("semua");
  const [selectedAlert, setSelectedAlert] = useState<FoodDrugAlert | null>(null);

  // ── Filter ──
  const filtered = filter === "semua"
    ? alerts
    : alerts.filter((a) => a.severity === filter);

  // ── Hitung per severity ──
  const counts = {
    semua: alerts.length,
    kritis: alerts.filter((a) => a.severity === "kritis").length,
    tinggi: alerts.filter((a) => a.severity === "tinggi").length,
    sedang: alerts.filter((a) => a.severity === "sedang").length,
  };

  // ── Dismiss (hapus satu alert) ──
  const dismiss = (id: number) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  // ── Export Handlers (DITAMBAHKAN) ──
  const handleExportCSV = () => {
    const data = filtered.map((a) => ({
      ID: a.id,
      Obat: a.obat,
      "Makanan Interaksi": a.makanan,
      Pasien: a.pasien,
      Severity: SEVERITY_CONFIG[a.severity].label,
      "Rekomendasi Aksi": a.aksi,
    }));
    downloadCSV(data, "Peringatan_Interaksi_Obat_Makanan");
  };

  const handleExportExcel = () => {
    const data = filtered.map((a) => ({
      ID: a.id,
      Obat: a.obat,
      "Makanan Interaksi": a.makanan,
      Pasien: a.pasien,
      Severity: SEVERITY_CONFIG[a.severity].label,
      "Rekomendasi Aksi": a.aksi,
    }));
    downloadExcel(data, "Peringatan_Interaksi_Obat_Makanan");
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>MediCore HIS</span>
            <ChevronDown size={10} className="rotate-[-90deg]" />
            <span>Modul 17 – Clinical Nutrition</span>
            <ChevronDown size={10} className="rotate-[-90deg]" />
            <span className="text-foreground font-medium">Food & Drug Interaction</span>
          </div>
          {/* Tombol Export (DITAMBAHKAN) */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-white text-muted-foreground hover:bg-muted transition-colors"
            >
              <Download size={13} /> CSV
            </button>
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-white text-muted-foreground hover:bg-muted transition-colors"
            >
              <Download size={13} /> Excel
            </button>
          </div>
        </div>
        <h2 className="text-xl font-bold text-foreground">Peringatan Interaksi Obat & Makanan</h2>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <ShieldCheck size={18} className="text-blue-600 shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-semibold text-blue-800">Monitoring Otomatis</div>
          <div className="text-xs text-blue-600 mt-0.5 leading-relaxed">
            Sistem mendeteksi potensi interaksi obat dengan makanan berdasarkan resep dokter dan diet plan pasien. Review dan ambil tindakan yang disarankan.
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTER_ORDER.map((f) => {
          const isActive = filter === f;
          const isKritis = f === "kritis" && counts.kritis > 0;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-all ${
                isActive
                  ? isKritis
                    ? "bg-red-600 text-white border-red-600 shadow-sm"
                    : "bg-primary text-white border-primary shadow-sm"
                  : "bg-white text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {f === "semua" ? "Semua" : f.charAt(0).toUpperCase() + f.slice(1)}
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-muted text-muted-foreground"
              }`}>
                {counts[f]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Alert cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <ShieldCheck size={48} className="mx-auto mb-3 text-emerald-300" />
          <div className="font-semibold text-foreground mb-1">Tidak ada peringatan</div>
          <div className="text-sm text-muted-foreground">Semua interaksi sudah ditangani.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => {
            const cfg = SEVERITY_CONFIG[alert.severity];
            const Icon = cfg.icon;

            return (
              <div
                key={alert.id}
                className={`bg-white rounded-xl border-2 ${cfg.border} ${cfg.bg} p-5 transition-all hover:shadow-md`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
                    <Icon size={22} className={cfg.iconColor} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Top row: obat + badge + tombol */}
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-base font-bold" style={{ color: cfg.accent }}>
                        {alert.obat}
                      </span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.badgeBg} ${cfg.badgeText}`}>
                        {cfg.label}
                      </span>
                    </div>

                    {/* Makanan */}
                    <div className="text-sm text-foreground mb-1">
                      Berinteraksi dengan: <strong>{alert.makanan}</strong>
                    </div>

                    {/* Pasien */}
                    <div className="text-xs text-muted-foreground mb-2.5">
                      Pasien: {alert.pasien}
                    </div>

                    {/* Aksi */}
                    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${cfg.border} bg-white/70`}>
                      <Icon size={13} className={cfg.iconColor} />
                      <span className="text-xs font-semibold text-foreground">{alert.aksi}</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setSelectedAlert(alert)}
                      className="p-2 rounded-lg hover:bg-white/80 transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye size={16} className="text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => dismiss(alert.id)}
                      className="p-2 rounded-lg hover:bg-white/80 transition-colors"
                      title="Dismiss"
                    >
                      <X size={16} className="text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {selectedAlert && (
        <DetailModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
      )}
    </div>
  );
}