import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Download, RefreshCw, FileSpreadsheet, FileText, X, CheckCircle, ChevronRight, AlertTriangle } from "lucide-react";
import { downloadCSV } from "../../../helpers/exportCsv";
import { downloadExcel } from "../../../helpers/exportExcel";

// ═══════════════════════════════════════════════════════════════
//  PALETTE & UI PRIMITIVES
// ═══════════════════════════════════════════════════════════════
const C = {
  red: "#EF4444", orange: "#EA580C", amber: "#F59E0B", purple: "#8B5CF6",
  teal: "#0891B2", green: "#00897B", emerald: "#10B981", blue: "#1549A0",
  gray: "#9CA3AF",
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
        {children && <div className="order-last">{children}</div>}
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
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
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}>
      {children}
    </button>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════════════════════
interface Toast { id: number; message: string; type: "success" | "info" | "danger" | "warning"; }
function ToastContainer({ toasts }: { toasts: Toast[] }) {
  const colorMap = { success: "bg-emerald-600", danger: "bg-red-600", info: "bg-blue-700", warning: "bg-amber-500" };
  return (
    <div className="fixed top-5 right-5 z-[200] flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-white text-sm font-semibold shadow-lg animate-[slideIn_0.3s_ease] ${colorMap[t.type]}`}>
          <CheckCircle size={16} /> {t.message}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════
interface TPS {
  zona: string; kapasitas: number; terisi: number; unit: string; warna: string; suhu: string; kondisi: string;
}

const INITIAL_TPS: TPS[] = [
  { zona: "TPS B3 Utama", kapasitas: 2000, terisi: 1340, unit: "kg", warna: C.amber, suhu: "24°C", kondisi: "Baik" },
  { zona: "TPS Infeksius", kapasitas: 1500, terisi: 900, unit: "kg", warna: C.red, suhu: "22°C", kondisi: "Baik" },
  { zona: "Refrigerator Patologis", kapasitas: 150, terisi: 68, unit: "kg", warna: C.purple, suhu: "4°C", kondisi: "Normal" },
  { zona: "Drum B3 Kimia", kapasitas: 500, terisi: 142, unit: "L", warna: C.orange, suhu: "26°C", kondisi: "Baik" },
];

// ═══════════════════════════════════════════════════════════════
//  KOMPONEN UTAMA
// ═══════════════════════════════════════════════════════════════
export default function WasteTPS() {
  const [tpsData, setTpsData] = useState<TPS[]>(INITIAL_TPS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExportMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const showToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }, []);

  // ── Simulasi Refresh IoT ──
  const handleRefreshIoT = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    showToast("Menghubungkan ke sensor IoT...", "info");

    setTimeout(() => {
      setTpsData((prev) =>
        prev.map((t) => {
          // Simulasi perubahan level: ±random 1-5% dari kapasitas
          const delta = Math.round((Math.random() * 10 - 5) * (t.kapasitas / 100));
          const newTerisi = Math.max(0, Math.min(t.kapasitas, t.terisi + delta));

          // Simulasi perubahan suhu: ±1-2°C
          const baseSuhu = parseInt(t.suhu);
          const deltaSuhu = Math.round(Math.random() * 4 - 2);
          const newSuhu = baseSuhu + deltaSuhu;

          // Kondisi berdasarkan suhu (patologis harus 2-8°C, lainnya ruang)
          let newKondisi = t.kondisi;
          if (t.zona.includes("Refrigerator")) {
            newKondisi = (newSuhu >= 2 && newSuhu <= 8) ? "Normal" : "Anomali";
          } else {
            newKondisi = (newSuhu >= 20 && newSuhu <= 30) ? "Baik" : "Anomali";
          }

          return { ...t, terisi: newTerisi, suhu: `${newSuhu}°C`, kondisi: newKondisi };
        })
      );
      setIsRefreshing(false);
      showToast("Data sensor IoT berhasil diperbarui", "success");
    }, 2000);
  };

  // ── Data siap export ──
  const exportData = useMemo(() => tpsData.map((t) => {
    const pct = Math.round((t.terisi / t.kapasitas) * 100);
    return {
      "Zona TPS": t.zona,
      "Kapasitas": `${t.kapasitas} ${t.unit}`,
      "Terisi": `${t.terisi} ${t.unit}`,
      "Persentase Terisi": `${pct}%`,
      "Suhu": t.suhu,
      "Kondisi": t.kondisi,
      "Status Kapasitas": pct > 80 ? "KRITIS" : pct > 60 ? "WASPADA" : "AMAN",
    };
  }), [tpsData]);

  const fileName = `laporan_tps_b3_${new Date().toISOString().split("T")[0]}`;

  const handleExportCSV = () => {
    setShowExportMenu(false);
    downloadCSV(exportData, fileName);
    showToast("Laporan TPS B3 di-export ke CSV", "info");
  };

  const handleExportExcel = () => {
    setShowExportMenu(false);
    downloadExcel(exportData, fileName);
    showToast("Laporan TPS B3 di-export ke Excel", "info");
  };

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Monitoring TPS B3 – Tempat Penyimpanan Sementara" breadcrumbs={["Modul 21 – Limbah", "Monitoring TPS B3"]}>
        <div className="flex gap-2">
          <Btn variant="ghost" size="sm" onClick={handleRefreshIoT} disabled={isRefreshing}>
            <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
            {isRefreshing ? "Menghubungkan..." : "Refresh IoT"}
          </Btn>

          <div className="relative" ref={exportRef}>
            <Btn size="sm" onClick={() => setShowExportMenu(!showExportMenu)}>
              <Download size={13} /> Laporan
            </Btn>
            {showExportMenu && (
              <div className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-lg border border-border py-1 z-50 min-w-[200px]">
                <button
                  onClick={handleExportCSV}
                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-muted transition-colors flex items-center gap-2.5 text-foreground"
                >
                  <FileText size={15} className="text-emerald-600" />
                  <div>
                    <div className="font-semibold">Export CSV</div>
                    <div className="text-[10px] text-muted-foreground">Kompatibel dengan semua sistem</div>
                  </div>
                </button>
                <button
                  onClick={handleExportExcel}
                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-muted transition-colors flex items-center gap-2.5 text-foreground"
                >
                  <FileSpreadsheet size={15} className="text-green-700" />
                  <div>
                    <div className="font-semibold">Export Excel (.xlsx)</div>
                    <div className="text-[10px] text-muted-foreground">Format Microsoft Excel</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 gap-5">
        {tpsData.map(t => {
          const pct = Math.round((t.terisi / t.kapasitas) * 100);
          return (
            <SectionCard key={t.zona} title={t.zona}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-3xl font-extrabold" style={{ fontFamily: "var(--font-mono)", color: pct > 80 ? C.red : pct > 60 ? C.amber : C.green }}>
                    {pct}%
                  </div>
                  <div className="text-xs text-muted-foreground">Kapasitas Terisi</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-mono)" }}>
                    {t.terisi.toLocaleString()} / {t.kapasitas.toLocaleString()} {t.unit}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">🌡 {t.suhu} · {t.kondisi}</div>
                </div>
              </div>
              <ProgressBar value={t.terisi} max={t.kapasitas} color={pct > 80 ? C.red : pct > 60 ? C.amber : t.warna} />
              {pct > 80 && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-1.5">
                  <AlertTriangle size={12} /> Kapasitas kritis! Jadwalkan pengangkutan segera.
                </div>
              )}
            </SectionCard>
          );
        })}
      </div>

      <ToastContainer toasts={toasts} />
    </div>
  );
}