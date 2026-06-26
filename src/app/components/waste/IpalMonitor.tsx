import { useState, useCallback } from "react";
import {
  ChevronRight, RefreshCw, Droplets, CheckCircle, Zap, Wifi,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

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
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}>
      {children}
    </button>
  );
}

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub: string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-border flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "18" }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xl font-bold text-foreground font-mono">{value}</div>
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="text-[10px] text-muted-foreground">{sub}</div>
      </div>
    </div>
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

function Badge({ variant, children }: { variant: string; children: React.ReactNode }) {
  const map: Record<string, string> = {
    aktif: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
    default: "bg-gray-100 text-gray-700",
  };
  return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${map[variant] || map.default}`}>{children}</span>;
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
//  TYPES & DATA
// ═══════════════════════════════════════════════════════════════
interface IpalParam {
  param: string;
  value: number;
  max: number;
  unit: string;
  status: "aman" | "perhatian" | "bahaya";
}

const INITIAL_PARAMS: IpalParam[] = [
  { param: "BOD", value: 18, max: 30, unit: "mg/L", status: "aman" },
  { param: "COD", value: 72, max: 100, unit: "mg/L", status: "aman" },
  { param: "TSS", value: 28, max: 30, unit: "mg/L", status: "perhatian" },
  { param: "pH", value: 7.2, max: 9.0, unit: "", status: "aman" },
  { param: "Amonia", value: 8.5, max: 10, unit: "mg/L", status: "perhatian" },
  { param: "Coliform", value: 120, max: 200, unit: "MPN/100mL", status: "aman" },
];

const trendData = [
  { hari: "Sen", bod: 22, cod: 78, tss: 24 },
  { hari: "Sel", bod: 19, cod: 82, tss: 26 },
  { hari: "Rab", bod: 25, cod: 75, tss: 30 },
  { hari: "Kam", bod: 18, cod: 70, tss: 22 },
  { hari: "Jum", bod: 20, cod: 76, tss: 28 },
  { hari: "Sab", bod: 16, cod: 68, tss: 25 },
  { hari: "Min", bod: 18, cod: 72, tss: 28 },
];

// ═══════════════════════════════════════════════════════════════
//  KOMPONEN GAUGE (Diambil dari IpalMonitor)
// ═══════════════════════════════════════════════════════════════
function Gauge({ value, max, unit, status, size = 120 }: {
  value: number; max: number; unit: string; status: IpalParam["status"]; size?: number;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const colorMap: Record<string, string> = { aman: "#10B981", perhatian: "#F59E0B", bahaya: "#EF4444" };
  const color = colorMap[status];

  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (circumference * 270) / 360;
  const offset = arcLength - (arcLength * pct) / 100;
  const rotation = 135;

  return (
    <div className="flex flex-col items-center flex-shrink-0">
      <div className="relative" style={{ width: size, height: size * 0.75 }}>
        <svg width={size} height={size * 0.75} viewBox={`0 0 ${size} ${size * 0.75}`} className="overflow-visible">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E2E8F0" strokeWidth={strokeWidth} strokeDasharray={arcLength} strokeDashoffset={0} strokeLinecap="round" transform={`rotate(${rotation} ${size / 2} ${size / 2})`} />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={arcLength} strokeDashoffset={offset} strokeLinecap="round" transform={`rotate(${rotation} ${size / 2} ${size / 2})`} style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.3s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className="text-2xl font-extrabold font-mono" style={{ color }}>
            {value % 1 === 0 ? value : value.toFixed(1)}
          </span>
          {unit && <span className="text-[10px] font-semibold text-muted-foreground -mt-0.5">{unit}</span>}
        </div>
      </div>
      <div className="text-[10px] text-muted-foreground font-mono mt-1">max: {max} {unit}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  KOMPONEN UTAMA
// ═══════════════════════════════════════════════════════════════
export default function WasteIPAL() {
  const [params, setParams] = useState<IpalParam[]>(INITIAL_PARAMS);
  const [kapasitasOlah, setKapasitasOlah] = useState(94);
  const [konsumsiEnergi, setKonsumsiEnergi] = useState(48.2);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }, []);

  // ── Logic Refresh IoT (Diambil dari IpalMonitor) ──
  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    showToast("Mengambil data sensor IPAL...", "info");

    setTimeout(() => {
      setParams((prev) =>
        prev.map((p) => {
          const fluctuation = 1 + (Math.random() * 0.2 - 0.1);
          let newValue = Math.round(p.value * fluctuation * 10) / 10;
          newValue = Math.max(0, newValue);

          const pct = (newValue / p.max) * 100;
          let newStatus: IpalParam["status"] = "aman";
          if (pct >= 100) newStatus = "bahaya";
          else if (pct >= 85) newStatus = "perhatian";

          return { ...p, value: newValue, status: newStatus };
        })
      );

      // Fluktuasi stat card lainnya
      setKapasitasOlah(Math.round(85 + Math.random() * 20));
      setKonsumsiEnergi(Math.round((45 + Math.random() * 8) * 10) / 10);

      setIsRefreshing(false);
      showToast("Data sensor IPAL berhasil diperbarui", "success");
    }, 1500);
  };

  // ── Hitung Status Keseluruhan ──
  const bahaya = params.filter((p) => p.status === "bahaya").length;
  const perhatian = params.filter((p) => p.status === "perhatian").length;
  
  let statusText = "NORMAL";
  let statusSub = "semua unit beroperasi";
  let statusColor = C.green;
  
  if (bahaya > 0) {
    statusText = "BAHAYA";
    statusSub = "ada parameter di atas baku mutu!";
    statusColor = C.red;
  } else if (perhatian > 0) {
    statusText = "WASPADA";
    statusSub = "beberapa parameter mendekati batas";
    statusColor = C.amber;
  }

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Dashboard IoT IPAL – Instalasi Pengolahan Air Limbah" breadcrumbs={["Modul 21 – Limbah", "Dashboard IoT IPAL"]}>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700">
            <Wifi size={12} /> IoT Connected
          </div>
          <Btn variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} /> 
            {isRefreshing ? "Updating..." : "Refresh"}
          </Btn>
        </div>
      </PageHeader>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Kapasitas Olah" value={`${kapasitasOlah} m³/hr`} sub="aktual" icon={Droplets} color={C.teal} />
        <StatCard label="Status IPAL" value={statusText} sub={statusSub} icon={CheckCircle} color={statusColor} />
        <StatCard label="Konsumsi Energi" value={`${konsumsiEnergi} kWh`} sub="hari ini" icon={Zap} color={C.blue} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard title="Parameter Kualitas Effluent (Real-time)">
          <div className="space-y-5">
            {params.map(d => {
              const pct = (d.value / d.max) * 100;
              return (
                <div key={d.param} className="flex items-center gap-5">
                  <Gauge value={d.value} max={d.max} unit={d.unit} status={d.status} size={90} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-foreground">{d.param}</span>
                      <Badge variant={d.status === "aman" ? "aktif" : d.status === "bahaya" ? "danger" : "warning"}>
                        {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                      </Badge>
                    </div>
                    <ProgressBar value={d.value} max={d.max} color={pct > 90 ? C.red : pct > 70 ? C.amber : C.green} />
                    <div className="text-[10px] text-muted-foreground mt-0.5">Baku mutu maks: {d.max} {d.unit}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="Tren Kualitas Air Effluent – 7 Hari">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hari" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="bod" name="BOD (mg/L)" stroke={C.blue} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="cod" name="COD (mg/L)" stroke={C.amber} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="tss" name="TSS (mg/L)" stroke={C.red} strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      <ToastContainer toasts={toasts} />
    </div>
  );
}