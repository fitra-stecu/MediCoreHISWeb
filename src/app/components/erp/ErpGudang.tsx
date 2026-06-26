// src/app/components/erp/ErpGudang.tsx

import { useState, useRef, useCallback } from "react";
import {
  ChevronRight, RefreshCw, Download, X, CheckCircle, Info,
  AlertTriangle, File, FileText, Image,
} from "lucide-react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

// ═══════════════════════════════════════════════════════════════
//  PALETTE & UI PRIMITIVES
// ═══════════════════════════════════════════════════════════════
const C = {
  blue: "#1549A0", green: "#00897B", amber: "#F59E0B",
  red: "#EF4444", purple: "#8B5CF6", teal: "#0891B2",
  emerald: "#10B981", orange: "#EA580C",
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
      <div className="flex items-center justify-between">{children && <div className="order-last">{children}</div>}<h2 className="text-xl font-bold text-foreground">{title}</h2></div>
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

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  TYPES & DATA
// ═══════════════════════════════════════════════════════════════
interface Zone {
  id: string;
  nama: string;
  warna: string;
  temp: string;
  humid: string;
  cap: number;
  // Live data
  liveTemp: string;
  liveHumid: string;
  lastUpdate: string;
}

const INITIAL_ZONES: Zone[] = [
  { id: "A1", nama: "Farmasi Non-Nark.",  warna: C.blue,    temp: "15-25°C", humid: "50-70%", cap: 78, liveTemp: "21°C", liveHumid: "62%", lastUpdate: "—" },
  { id: "A2", nama: "Narkotika & Psiko", warna: C.red,     temp: "15-25°C", humid: "50-60%", cap: 45, liveTemp: "19°C", liveHumid: "55%", lastUpdate: "—" },
  { id: "B1", nama: "Alkes Umum",        warna: C.teal,    temp: "Ruang",    humid: "< 70%",   cap: 62, liveTemp: "28°C", liveHumid: "64%", lastUpdate: "—" },
  { id: "B2", nama: "Bahan Habis Pakai", warna: C.green,   temp: "Ruang",    humid: "< 70%",   cap: 84, liveTemp: "27°C", liveHumid: "58%", lastUpdate: "—" },
  { id: "C1", nama: "ATK & Administrasi",  warna: C.purple,  temp: "Ruang",    humid: "Bebas",   cap: 31, liveTemp: "26°C", liveHumid: "51%", lastUpdate: "—" },
  { id: "C2", nama: "CSSD & Steril",      warna: C.emerald, temp: "18-22°C", humid: "40-60%", cap: 55, liveTemp: "20°C", liveHumid: "48%", lastUpdate: "—" },
  { id: "D1", nama: "B3 & Bahan Kimia",   warna: C.orange,  temp: "< 30°C",   humid: "< 60%",   cap: 67, liveTemp: "24°C", liveHumid: "42%", lastUpdate: "—" },
  { id: "D2", nama: "Cold Chain (2-8°C)", warna: "#06B6D4", temp: "2-8°C",   humid: "Terkontrol", cap: 90, liveTemp: "5°C",  liveHumid: "35%", lastUpdate: "—" },
];

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
//  KOMPONEN UTAMA
// ═══════════════════════════════════════════════════════════════
export default function ErpGudang() {
  const [zones, setZones] = useState<Zone[]>(INITIAL_ZONES);
  const [syncing, setSyncing] = useState(false);
  const [liveActive, setLiveActive] = useState(false);
  const [openExport, setOpenExport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Ref untuk menangkap area denah
  const mapRef = useRef<HTMLDivElement>(null);

  const toast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  // ── Helper: random dalam range ──
  const randRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  // ── LIVE UPDATE: simulasi perubahan kapasitas & sensor ──
  const handleLiveUpdate = () => {
    if (liveActive) {
      // Stop live
      setLiveActive(false);
      toast("Live update dihentikan", "info");
      return;
    }

    setLiveActive(true);
    toast("Live update diaktifkan — data berubah setiap 3 detik", "info");

    const interval = setInterval(() => {
      setZones((prev) =>
        prev.map((z) => {
          // Fluktuasi kapasitas ±3%
          let newCap = z.cap + randRange(-3, 3);
          newCap = Math.max(10, Math.min(100, newCap));

          // Simulasi suhu berdasarkan zona
          let newTemp: string;
          if (z.id === "D2") {
            // Cold chain: 2-8°C
            newTemp = `${randRange(2, 8)}°C`;
          } else if (z.id === "C2") {
            // CSSD: 18-22°C
            newTemp = `${randRange(18, 22)}°C`;
          } else if (z.id === "A1" || z.id === "A2") {
            // Farmasi: 15-25°C
            newTemp = `${randRange(15, 25)}°C`;
          } else if (z.id === "D1") {
            // B3: < 30°C
            newTemp = `${randRange(22, 29)}°C`;
          } else {
            // Ruang: ambil suhu ruang sekitar 25-30
            newTemp = `${randRange(25, 30)}°C`;
          }

          // Simulasi kelembaban
          let newHumid: string;
          if (z.id === "D2") {
            newHumid = `${randRange(25, 45)}%`;
          } else if (z.id === "C2") {
            newHumid = `${randRange(40, 60)}%`;
          } else {
            newHumid = `${randRange(45, 75)}%`;
          }

          const now = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

          return { ...z, cap: newCap, liveTemp: newTemp, liveHumid: newHumid, lastUpdate: now };
        })
      );
    }, 3000);

    // Simpan interval ID supaya bisa di-stop
    (window as unknown as { _liveInterval?: number })._liveInterval = interval;
  };

  // ── SINKRONISASI: ambil data terkini dari sensor ──
  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setZones((prev) =>
        prev.map((z) => {
          const now = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
          return { ...z, liveTemp: `${randRange(18, 24)}°C`, liveHumid: `${randRange(45, 65)}%`, lastUpdate: now };
        })
      );
      const now = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setLastSync(now);
      setSyncing(false);
      toast(`Data sensor diperbarui — ${now} WIB`, "info");
    }, 1500);
  };

  // ── EXPORT: tangkap denah sebagai gambar ──
  const captureMap = async (): Promise<HTMLCanvasElement | null> => {
    if (!mapRef.current) return null;
    return html2canvas(mapRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      logging: false,
    });
  };

  const handleExportPNG = async () => {
    setExporting(true);
    try {
      const canvas = await captureMap();
      if (!canvas) throw new Error("Gagal menangkap denah");
      const link = document.createElement("a");
      link.download = `denah-gudang-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast("Denah berhasil didownload (PNG)", "success");
    } catch (err) {
      toast(`Gagal export PNG: ${(err as Error).message}`, "danger");
    }
    setExporting(false);
    setOpenExport(false);
  };

  const handleExportJPG = async () => {
    setExporting(true);
    try {
      const canvas = await captureMap();
      if (!canvas) throw new Error("Gagal menangkap denah");
      const link = document.createElement("a");
      link.download = `denah-gudang-${new Date().toISOString().slice(0, 10)}.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.92);
      link.click();
      toast("Denah berhasil didownload (JPG)", "success");
    } catch (err) {
      toast(`Gagal export JPG: ${(err as Error).message}`, "danger");
    }
    setExporting(false);
    setOpenExport(false);
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const canvas = await captureMap();
      if (!canvas) throw new Error("Gagal menangkap denah");

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      // Judul
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("Denah Gudang Farmasi & Logistik", 14, 18);

      // Subtitle
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100);
      const tgl = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      pdf.text(`Dicetak: ${tgl}`, 14, 25);

      // Gambar denah
      const imgWidth = 270;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 14, 32, imgWidth, imgHeight);

      // Footer
      pdf.setFontSize(7);
      pdf.setTextColor(160);
      pdf.text("MediCore HIS – Gudang Farmasi & Logistik", pdf.internal.pageSize.getWidth() / 2, pdf.internal.pageSize.getHeight() - 8, { align: "center" });

      pdf.save(`denah-gudang-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast("Denah berhasil didownload (PDF)", "success");
    } catch (err) {
      toast(`Gagal export PDF: ${(err as Error).message}`, "danger");
    }
    setExporting(false);
    setOpenExport(false);
  };

  // ── Warna kapasitas ──
  const capColor = (cap: number) => {
    if (cap > 85) return C.red;
    if (cap > 70) return C.amber;
    return C.emerald;
  };

  // ── Ringkasan ──
  const avgCap = Math.round(zones.reduce((s, z) => s + z.cap, 0) / zones.length);
  const criticalZones = zones.filter((z) => z.cap > 85).length;

  return (
    <div className="p-6 space-y-5">

      {/* ═══ HEADER ═══ */}
      <PageHeader title="3D Warehouse Map – Denah Gudang Farmasi & Logistik" breadcrumbs={["Modul 10 – ERP", "3D Warehouse Map"]}>
        <div className="flex gap-2">
          <Btn
            variant="ghost" size="sm"
            onClick={handleSync}
            disabled={syncing}
          >
            <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Updating..." : "Live Update"}
          </Btn>

          {/* Dropdown export */}
          <div className="relative">
            <button
              onClick={() => setOpenExport(!openExport)}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              <Download size={13} />
              {exporting ? "Mengexport..." : "Cetak Denah"}
            </button>
            {openExport && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpenExport(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-border rounded-xl shadow-xl p-1.5 min-w-[200px]">
                  <button onClick={handleExportPNG} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-muted transition-colors text-left">
                    <Image size={15} className="text-purple-600" /> Download PNG
                  </button>
                  <button onClick={handleExportJPG} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-muted transition-colors text-left">
                    <File size={15} className="text-amber-600" /> Download JPG
                  </button>
                  <button onClick={handleExportPDF} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-muted transition-colors text-left">
                    <FileText size={15} className="text-red-500" /> Download PDF
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </PageHeader>

      {/* ═══ LIVE INDICATOR ═══ */}
      {liveActive && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-emerald-700">
            LIVE — data sensor diperbarui setiap 3 detik
          </span>
          <button
            onClick={() => {
              setLiveActive(false);
              clearInterval((window as unknown as { _liveInterval?: number })._liveInterval);
              toast("Live update dihentikan", "info");
            }}
            className="ml-auto text-[10px] font-bold text-emerald-600 hover:underline"
          >
            STOP
          </button>
        </div>
      )}

      {/* ═══ SYNC INFO ═══ */}
      {lastSync && !liveActive && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-lg">
          <CheckCircle size={14} className="text-blue-600 shrink-0" />
          <span className="text-xs text-blue-700">
            Terakhir diperbarui: <strong>{lastSync} WIB</strong>
          </span>
        </div>
      )}

      {/* ═══ STAT CARDS ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: C.blue + "18" }}>
            <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: C.blue }} />
          </div>
          <div>
            <div className="text-xl font-bold text-foreground font-mono">{zones.length}</div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total Zona</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: C.emerald + "18" }}>
            <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: C.emerald }} />
          </div>
          <div>
            <div className="text-xl font-bold text-foreground font-mono">{avgCap}%</div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Rata-rata Kapasitas</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: C.red + "18" }}>
            <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: C.red }} />
          </div>
          <div>
            <div className="text-xl font-bold text-foreground font-mono">{criticalZones}</div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Zona Kritis (85%)</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: C.teal + "18" }}>
            <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: C.teal }} />
          </div>
          <div>
            <div className="text-xl font-bold text-foreground font-mono">{liveActive ? "AKTIF" : "OFF"}</div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Status Sensor</div>
          </div>
        </div>
      </div>

      {/* ═══ PETA ZONA + DENAH ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <SectionCard title="Peta Zona Gudang" actions={
            liveActive && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">LIVE</span>
          }>
            {/* Zona cards */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {zones.map((z) => {
                const c = capColor(z.cap);
                return (
                  <div
                    key={z.id}
                    className="rounded-xl p-3 text-white relative overflow-hidden cursor-pointer hover:opacity-90 transition-all"
                    style={{ backgroundColor: z.warna }}
                  >
                    <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-white to-transparent" />
                    <div className="relative z-10">
                      <div className="text-[10px] font-bold opacity-80 mb-0.5">{z.id}</div>
                      <div className="text-xs font-bold leading-tight mb-2">{z.nama}</div>
                      <div className="text-[10px] mb-1">Kapasitas</div>
                      <div className="w-full bg-white/30 rounded-full h-1 mb-1">
                        <div className="h-1 bg-white rounded-full transition-all duration-500" style={{ width: `${z.cap}%` }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{z.cap}%</span>
                        {liveActive && z.lastUpdate !== "—" && (
                          <span className="text-[8px] opacity-70 font-mono">{z.lastUpdate}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ═══ DENAH GUDANG (ini yang ditangkap html2canvas) ═══ */}
            <div ref={mapRef} className="bg-muted rounded-xl p-4 border border-border">
              <div className="text-xs text-muted-foreground font-semibold mb-3 text-center">DENAH GUDANG</div>
              <div className="relative w-full bg-white rounded-lg border border-border" style={{ height: 220 }}>
                <div className="absolute inset-2 grid grid-cols-4 grid-rows-2 gap-2">
                  {zones.map((z) => (
                    <div
                      key={z.id}
                      className="rounded-lg flex flex-col items-center justify-center text-white text-[9px] font-bold text-center p-1.5 transition-all duration-500"
                      style={{ backgroundColor: z.warna, opacity: 0.9 }}
                    >
                      <div className="font-bold">{z.id}</div>
                      <div className="leading-tight text-[8px]">{z.nama.split(" ")[0]}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[8px] opacity-80">{z.cap}%</span>
                        {liveActive && (
                          <span className="text-[7px] font-mono opacity-70">{z.liveTemp}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-foreground/90 text-white text-[8px] px-3 py-1 rounded-md font-bold tracking-wider">
                  PINTU MASUK / PENERIMAAN BARANG
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ═══ DETAIL ZONA ═══ */}
        <SectionCard title="Detail Zona">
          <div className="space-y-3" style={{ maxHeight: 500, overflowY: "auto" }}>
            {zones.map((z) => {
              const c = capColor(z.cap);
              const isFull = z.cap >= 90;
              return (
                <div key={z.id} className={`p-3 rounded-lg border transition-colors ${isFull ? "border-red-200 bg-red-50/50" : "border-border"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded shrink-0" style={{ backgroundColor: z.warna }} />
                    <span className="text-xs font-bold text-foreground">{z.id} – {z.nama}</span>
                    {liveActive && z.lastUpdate !== "—" && (
                      <span className="ml-auto text-[9px] text-muted-foreground font-mono">{z.lastUpdate}</span>
                    )}
                  </div>

                  {/* Standar */}
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground mb-2">
                    <span>🌡 Standar: {z.temp}</span>
                    <span>💧 Standar: {z.humid}</span>
                  </div>

                  {/* Live sensor */}
                  {liveActive && (
                    <div className="grid grid-cols-2 gap-1 text-[10px] mb-2 p-1.5 bg-blue-50 rounded border border-blue-100">
                      <span className="text-blue-700">🌡 Live: {z.liveTemp}</span>
                      <span className="text-blue-700">💧 Live: {z.liveHumid}</span>
                    </div>
                  )}

                  <ProgressBar value={z.cap} max={100} color={c} />
                  <div className="text-[10px] text-right mt-0.5 font-bold" style={{ color: c }}>
                    {z.cap}% terisi
                    {isFull && <span className="text-red-500 ml-1">— PENUH!</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      <ToastContainer toasts={toasts} />
    </div>
  );
}