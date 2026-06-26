// src/app/components/adc/PharmacologyAlert.tsx

import { useState, useMemo, useCallback } from "react";
import {
  ChevronRight, Filter, Download, AlertTriangle, AlertCircle, Info,
  Eye, FileText, FileSpreadsheet, File, CheckCircle, Search,
} from "lucide-react";
import { downloadCSV } from "../../../helpers/exportCsv";
import { downloadExcel } from "../../../helpers/exportExcel";
import { downloadPDF } from "../../../helpers/exportPdf";

// ═══════════════════════════════════════════════════════════════
//  PALETTE & UI PRIMITIVES (sama seperti App.tsx)
// ═══════════════════════════════════════════════════════════════
const C = {
  blue: "#1549A0", green: "#00897B", amber: "#F59E0B",
  red: "#EF4444", purple: "#8B5CF6", teal: "#0891B2",
  navy: "#0B2D6B", emerald: "#10B981", orange: "#EA580C",
};

function PageHeader({ title, breadcrumbs, children }: { title: string; breadcrumbs: string[]; children?: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        {breadcrumbs.map((b, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={10} />}
            <span className={i === breadcrumbs.length - 1 ? "text-foreground font-medium" : ""}>{b}</span>
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, color, active, onClick }: {
  label: string; value: string | number; sub: string; icon: React.ElementType; color: string; active?: boolean; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-5 shadow-sm border flex flex-col gap-3 transition-all ${active ? "border-primary ring-2 ring-primary/20 cursor-pointer" : "border-border cursor-pointer hover:shadow-md"}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "18" }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-mono)" }}>{value}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
      </div>
    </div>
  );
}

function SectionCard({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-sm text-foreground">{title}</h3>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Btn({ children, variant = "primary", size = "md", onClick, className = "", disabled }: {
  children: React.ReactNode; variant?: string; size?: string; onClick?: () => void; className?: string; disabled?: boolean;
}) {
  const base = "inline-flex items-center gap-1.5 font-semibold rounded-lg transition-all cursor-pointer border-0";
  const sizes: Record<string, string> = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm" };
  const variants: Record<string, string> = {
    primary: "bg-primary text-white hover:bg-blue-700 shadow-sm",
    ghost: "bg-transparent text-muted-foreground hover:bg-muted",
    outline: "border border-border bg-white text-foreground hover:bg-muted",
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}>
      {children}
    </button>
  );
}

function TableWrapper({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto -mx-5"><table className="w-full text-sm">{children}</table></div>;
}
function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted border-b border-border whitespace-nowrap">{children}</th>;
}
function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return <td className={`px-4 py-3 border-b border-border text-sm text-foreground ${mono ? "font-mono text-xs" : ""}`}>{children}</td>;
}

function Badge({ variant = "default", children }: { variant?: string; children: React.ReactNode }) {
  const cls: Record<string, string> = {
    default: "bg-blue-100 text-blue-700",
    kritis: "bg-red-100 text-red-700",
    tinggi: "bg-orange-100 text-orange-700",
    sedang: "bg-amber-100 text-amber-700",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${cls[variant] || cls.default}`}>{children}</span>;
}

// ═══════════════════════════════════════════════════════════════
//  TYPE & DATA
// ═══════════════════════════════════════════════════════════════
interface DrugAlert {
  obat1: string;
  obat2: string;
  pasien: string;
  severity: "kritis" | "tinggi" | "sedang";
  efek: string;
  aksi: string;
}

const INITIAL_ALERTS: DrugAlert[] = [
  { obat1: "Warfarin",       obat2: "Aspirin",              pasien: "Agus Salim (P-0891)",       severity: "tinggi", efek: "Peningkatan risiko perdarahan serius (99% signifikan)", aksi: "Pantau INR, kurangi dosis Warfarin" },
  { obat1: "Metformin",      obat2: "Kontras Iodine",       pasien: "Slamet Riyadi (P-0896)",    severity: "tinggi", efek: "Risiko asidosis laktat pada prosedur imaging",         aksi: "Hentikan Metformin 48 jam sebelum prosedur" },
  { obat1: "Captopril",      obat2: "Spironolactone",      pasien: "Sri Wahyuni (P-0893)",      severity: "sedang", efek: "Hiperkalemia – pemantauan kalium diperlukan",          aksi: "Monitor elektrolit rutin" },
  { obat1: "Ciprofloxacin",  obat2: "Antasida (Mg/Al)",    pasien: "Dewi Rahayu (P-0895)",     severity: "sedang", efek: "Penurunan absorpsi Ciprofloxacin hingga 90%",          aksi: "Jeda minimal 2 jam antara konsumsi" },
  { obat1: "Amiodarone",     obat2: "Digoxin",             pasien: "Bambang S. (P-0912)",      severity: "kritis", efek: "Toksisitas Digoxin – risiko aritmia fatal",             aksi: "Kurangi dosis Digoxin 50%, monitor serum level" },
];

type FilterType = "semua" | "kritis" | "tinggi" | "sedang";

// Label untuk export
const EXPORT_LABELS = {
  obat1: "Obat 1",
  obat2: "Obat 2",
  pasien: "Pasien",
  severity: "Severity",
  efek: "Efek Interaksi",
  aksi: "Rekomendasi",
};

// ═══════════════════════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════════════════════
interface Toast { id: number; message: string; type: "success" | "info" | "danger"; }

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  const iconMap = { success: <CheckCircle size={16} />, danger: <AlertTriangle size={16} />, info: <Info size={16} /> };
  const colorMap = { success: "bg-emerald-600", danger: "bg-red-600", info: "bg-blue-700" };
  return (
    <div className="fixed top-5 right-5 z-[200] flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-white text-sm font-semibold shadow-lg animate-[slideIn_0.3s_ease] ${colorMap[t.type]}`}>
          {iconMap[t.type]} {t.message}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL DETAIL
// ═══════════════════════════════════════════════════════════════
function DetailModal({ alert, onClose }: { alert: DrugAlert; onClose: () => void }) {
  const colorMap: Record<string, string> = { kritis: C.red, tinggi: C.orange, sedang: C.amber };
  const labelMap: Record<string, string> = { kritis: "KRITIS", tinggi: "TINGGI", sedang: "SEDANG" };
  const c = colorMap[alert.severity];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold text-base">Detail Interaksi Obat</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <span className="lucide-x" style={{ display: "inline-flex", width: 16, height: 16 }}>✕</span>
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Dua obat */}
          <div className="flex items-center gap-3">
            <div className="flex-1 p-3 rounded-xl border-2 text-center" style={{ borderColor: c + "40", backgroundColor: c + "08" }}>
              <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Obat 1</div>
              <div className="text-sm font-bold" style={{ color: c }}>{alert.obat1}</div>
            </div>
            <div className="text-xl font-bold text-red-400">+</div>
            <div className="flex-1 p-3 rounded-xl border-2 text-center" style={{ borderColor: c + "40", backgroundColor: c + "08" }}>
              <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Obat 2</div>
              <div className="text-sm font-bold" style={{ color: c }}>{alert.obat2}</div>
            </div>
          </div>

          {/* Pasien */}
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Pasien Terdampak</div>
            <div className="text-sm font-semibold text-foreground">{alert.pasien}</div>
          </div>

          {/* Severity */}
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Tingkat Severity</div>
            <Badge variant={alert.severity}>{labelMap[alert.severity]}</Badge>
          </div>

          {/* Efek */}
          <div className="p-4 rounded-xl border" style={{ borderColor: c + "30", backgroundColor: c + "06" }}>
            <div className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: c }}>Efek Interaksi</div>
            <div className="text-sm text-foreground leading-relaxed">{alert.efek}</div>
          </div>

          {/* Rekomendasi */}
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
            <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-1.5">Rekomendasi Tindakan</div>
            <div className="text-sm text-blue-800 leading-relaxed">{alert.aksi}</div>
          </div>
        </div>
        <div className="flex justify-end p-4 border-t border-border bg-muted/50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors">Tutup</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  KOMPONEN UTAMA
// ═══════════════════════════════════════════════════════════════
export default function PharmacologyAlert() {
  const [alerts] = useState<DrugAlert[]>(INITIAL_ALERTS);
  const [filter, setFilter] = useState<FilterType>("semua");
  const [openDownload, setOpenDownload] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<DrugAlert | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  // ── Filter ──
  const filtered = useMemo(() => {
    if (filter === "semua") return alerts;
    return alerts.filter((a) => a.severity === filter);
  }, [alerts, filter]);

  // ── Hitung per severity ──
  const counts = {
    semua: alerts.length,
    kritis: alerts.filter((a) => a.severity === "kritis").length,
    tinggi: alerts.filter((a) => a.severity === "tinggi").length,
    sedang: alerts.filter((a) => a.severity === "sedang").length,
  };

  // ── Download handlers ──
  const today = new Date().toISOString().slice(0, 10);

  const handleCSV = () => {
    try {
      downloadCSV(filtered, `interaksi-obat-${today}.csv`, EXPORT_LABELS);
      setOpenDownload(false);
      toast(`CSV didownload (${filtered.length} baris)`, "info");
    } catch (err) { toast(`Gagal: ${(err as Error).message}`, "danger"); }
  };

  const handleExcel = () => {
    try {
      downloadExcel(filtered, `interaksi-obat-${today}`, EXPORT_LABELS, "Interaksi Obat");
      setOpenDownload(false);
      toast(`Excel didownload (${filtered.length} baris)`, "info");
    } catch (err) { toast(`Gagal: ${(err as Error).message}`, "danger"); }
  };

  const handlePDF = () => {
    try {
      downloadPDF(filtered, `interaksi-obat-${today}`, EXPORT_LABELS, "Pharmacology Conflict Alert — MediCore HIS");
      setOpenDownload(false);
      toast(`PDF didownload (${filtered.length} baris)`, "info");
    } catch (err) { toast(`Gagal: ${(err as Error).message}`, "danger"); }
  };

  // ── Badge label ──
  const severityLabel = (s: string) => s === "kritis" ? "⚠ KRITIS" : s.toUpperCase();

  return (
    <div className="p-6 space-y-5">

      {/* ═══ HEADER ═══ */}
      <PageHeader title="Pharmacology Conflict Alert" breadcrumbs={["Modul 4 – ADC", "Pharmacology Conflict Alert"]}>
        <div className="flex gap-2">
          {/* Filter buttons di header */}
          {(["semua", "kritis", "tinggi", "sedang"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                filter === f
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "border-border bg-white text-muted-foreground hover:bg-muted"
              }`}
            >
              {f === "semua" ? "Semua" : f.charAt(0).toUpperCase() + f.slice(1)}
              <span className={`ml-1 text-[10px] font-bold px-1 py-0.5 rounded ${filter === f ? "bg-white/20" : "bg-muted"}`}>
                {counts[f]}
              </span>
            </button>
          ))}

          {/* Divider */}
          <div className="w-px h-6 bg-border" />

          {/* Download dropdown */}
          <div className="relative">
            <button
              onClick={() => setOpenDownload(!openDownload)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors"
            >
              <Download size={13} /> Export
            </button>
            {openDownload && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpenDownload(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-border rounded-xl shadow-xl p-1.5 min-w-[180px]">
                  <button onClick={handleCSV} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-muted transition-colors text-left">
                    <FileText size={15} className="text-emerald-600" /> Download CSV
                  </button>
                  <button onClick={handleExcel} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-muted transition-colors text-left">
                    <FileSpreadsheet size={15} className="text-blue-600" /> Download Excel
                  </button>
                  <button onClick={handlePDF} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-muted transition-colors text-left">
                    <File size={15} className="text-red-500" /> Download PDF
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </PageHeader>

      {/* ═══ STAT CARDS — KLIKABLE SEBAGAI FILTER ═══ */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Alert Kritis" value={counts.kritis} sub="perlu tindakan segera"
          icon={AlertTriangle} color={C.red}
          active={filter === "kritis"}
          onClick={() => setFilter(filter === "kritis" ? "semua" : "kritis")}
        />
        <StatCard
          label="Alert Tinggi" value={counts.tinggi} sub="pantau ketat"
          icon={AlertCircle} color={C.orange}
          active={filter === "tinggi"}
          onClick={() => setFilter(filter === "tinggi" ? "semua" : "tinggi")}
        />
        <StatCard
          label="Alert Sedang" value={counts.sedang} sub="perhatian standar"
          icon={Info} color={C.amber}
          active={filter === "sedang"}
          onClick={() => setFilter(filter === "sedang" ? "semua" : "sedang")}
        />
      </div>

      {/* ═══ TABEL ═══ */}
      <SectionCard
        title={`Daftar Interaksi Obat Terdeteksi${filter !== "semua" ? ` — ${filter.toUpperCase()}` : ""}`}
        actions={
          <span className="text-xs text-muted-foreground">
            Menampilkan <strong className="text-foreground">{filtered.length}</strong> dari <strong className="text-foreground">{alerts.length}</strong>
          </span>
        }
      >
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle size={40} className="mx-auto mb-3 text-emerald-300" />
            <div className="text-sm font-semibold text-foreground mb-1">Tidak ada alert untuk filter ini</div>
            <button onClick={() => setFilter("semua")} className="text-xs text-primary font-semibold hover:underline mt-1">
              Tampilkan semua
            </button>
          </div>
        ) : (
          <TableWrapper>
            <thead>
              <tr>
                <Th>Obat 1</Th>
                <Th>Obat 2</Th>
                <Th>Pasien</Th>
                <Th>Severity</Th>
                <Th>Efek Interaksi</Th>
                <Th>Rekomendasi</Th>
                <Th>Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => (
                <tr key={i} className={`hover:bg-muted/40 transition-colors ${a.severity === "kritis" ? "bg-red-50/40" : ""}`}>
                  <Td><span className="font-bold text-foreground">{a.obat1}</span></Td>
                  <Td><span className="font-bold text-foreground">{a.obat2}</span></Td>
                  <Td>{a.pasien}</Td>
                  <Td>
                    <Badge variant={a.severity}>{severityLabel(a.severity)}</Badge>
                  </Td>
                  <Td>{a.efek}</Td>
                  <Td><span className="text-xs text-muted-foreground">{a.aksi}</span></Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedAlert(a)}
                        className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
                        title="Lihat Detail"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        )}
      </SectionCard>

      {/* ═══ MODAL DETAIL ═══ */}
      {selectedAlert && (
        <DetailModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
      )}

      {/* ═══ TOASTS ═══ */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}