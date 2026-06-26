import { useState } from "react";
import { RefreshCw, Scan, Zap, Activity, AlertTriangle, Shield, ChevronRight, Eye } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const C = { blue: "#1549A0", green: "#00897B", amber: "#F59E0B", red: "#EF4444", purple: "#8B5CF6", emerald: "#10B981" };

function PageHeader({ title, breadcrumbs, children }: { title: string; breadcrumbs: string[]; children?: React.ReactNode }) {
  return (<div className="mb-5"><div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">{breadcrumbs.map((b, i) => (<span key={i} className="flex items-center gap-1.5">{i > 0 && <ChevronRight size={10} />}<span className={i === breadcrumbs.length - 1 ? "text-foreground font-medium" : ""}>{b}</span></span>))}</div><div className="flex items-center justify-between">{children && <div className="order-last">{children}</div>}<h2 className="text-xl font-bold text-foreground">{title}</h2></div></div>);
}
function StatCard({ label, value, sub, icon: Icon, color, trend }: { label: string; value: string; sub: string; icon: React.ElementType; color: string; trend?: string }) {
  return (<div className="bg-white rounded-xl p-4 shadow-sm border border-border flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "18" }}><Icon size={16} style={{ color }} /></div><div className="flex-1 min-w-0"><div className="text-xl font-bold text-foreground font-mono">{value}</div><div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</div><div className="text-[10px] text-muted-foreground">{sub}</div></div>{trend && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">{trend}</span>}</div>);
}
function SectionCard({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (<div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden"><div className="flex items-center justify-between px-5 py-4 border-b border-border"><h3 className="font-semibold text-sm text-foreground">{title}</h3>{actions && <div className="flex items-center gap-2">{actions}</div>}</div><div className="p-5">{children}</div></div>);
}
function Btn({ children, variant = "primary", size = "md", onClick, className = "" }: { children: React.ReactNode; variant?: string; size?: string; onClick?: () => void; className?: string }) {
  const base = "inline-flex items-center gap-1.5 font-semibold rounded-lg transition-all cursor-pointer border-0"; const sizes: Record<string, string> = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm" }; const variants: Record<string, string> = { primary: "bg-primary text-white hover:bg-blue-700 shadow-sm", ghost: "bg-transparent text-muted-foreground hover:bg-muted" }; return <button onClick={onClick} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>{children}</button>;
}
function Badge({ variant, children }: { variant: string; children: React.ReactNode }) {
  const cls: Record<string, string> = { aktif: "bg-emerald-100 text-emerald-700", warning: "bg-amber-100 text-amber-700" }; return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${cls[variant] || cls.aktif}`}>{children}</span>;
}

const units = [
  { id: "ADC-01", lokasi: "IGD", status: "online", stok: 94, tx: 48, tgl: "22 Jun 06:00" },
  { id: "ADC-02", lokasi: "ICU", status: "online", stok: 87, tx: 62, tgl: "22 Jun 06:00" },
  { id: "ADC-03", lokasi: "Mawar (Bedah)", status: "online", stok: 71, tx: 35, tgl: "22 Jun 06:00" },
  { id: "ADC-04", lokasi: "Melati (Dalam)", status: "warning", stok: 43, tx: 29, tgl: "22 Jun 06:00" },
  { id: "ADC-05", lokasi: "Anggrek (Anak)", status: "online", stok: 88, tx: 22, tgl: "22 Jun 06:00" },
  { id: "ADC-06", lokasi: "Tulip (Obgyn)", status: "online", stok: 95, tx: 31, tgl: "22 Jun 06:00" },
];
const chartData = [
  { jam: "06:00", dispensing: 12, pengambilan: 15 }, { jam: "08:00", dispensing: 45, pengambilan: 38 },
  { jam: "10:00", dispensing: 78, pengambilan: 62 }, { jam: "12:00", dispensing: 56, pengambilan: 45 },
  { jam: "14:00", dispensing: 89, pengambilan: 73 }, { jam: "16:00", dispensing: 67, pengambilan: 55 },
];

export default function ADCDashboard({ navigate }: { navigate: (p: string) => void }) {
  const [syncing, setSyncing] = useState(false);
  const handleSync = () => { setSyncing(true); setTimeout(() => setSyncing(false), 2000); };

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Dashboard ADC" breadcrumbs={["Modul 4 – ADC", "Dashboard ADC"]}>
        <div className="flex gap-2">
          <Btn variant="ghost" size="sm" onClick={handleSync} disabled={syncing}>
            <RefreshCw size={13} className={syncing ? "animate-spin" : ""} /> {syncing ? "Syncing..." : "Sinkronisasi"}
          </Btn>
          <Btn size="sm" onClick={() => navigate("adc-clma")}><Scan size={13} /> Mulai CLMA</Btn>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="ADC Aktif" value="6/6" sub="semua unit online" icon={Zap} color={C.green} />
        <StatCard label="Transaksi Hari Ini" value="227" sub="pengambilan obat" icon={Activity} color={C.blue} trend="+15.2%" />
        <StatCard label="Stok Kritis" value="4 item" sub="di seluruh ADC" icon={AlertTriangle} color={C.red} />
        <StatCard label="Narkotika Hari Ini" value="8 Amp" sub="terverifikasi sidik jari" icon={Shield} color={C.purple} />
      </div>

      <SectionCard title="Aktivitas Dispensing Hari Ini" actions={<Btn variant="ghost" size="sm" onClick={() => navigate("adc-stok")}><Eye size={13} /> Lihat Detail Stok</Btn>}>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData}>
            <defs><linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.blue} stopOpacity={0.15} /><stop offset="95%" stopColor={C.blue} stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="jam" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Area type="monotone" dataKey="dispensing" name="Dispensing" stroke={C.blue} fill="url(#gBlue)" strokeWidth={2} />
            <Area type="monotone" dataKey="pengambilan" name="Pengambilan" stroke={C.amber} fill="none" strokeWidth={2} strokeDasharray="4 2" />
          </AreaChart>
        </ResponsiveContainer>
      </SectionCard>

      <SectionCard title="Status Unit ADC Real-Time">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {units.map(u => (
            <div key={u.id} className={`p-4 rounded-xl border-2 transition-all ${u.status === "online" ? "border-emerald-100 bg-emerald-50/30 hover:shadow-md" : "border-amber-200 bg-amber-50/40 hover:shadow-md"}`}>
              <div className="flex items-center justify-between mb-3">
                <div><div className="font-bold text-sm text-foreground">{u.id}</div><div className="text-xs text-muted-foreground">{u.lokasi}</div></div>
                <Badge variant={u.status === "online" ? "aktif" : "warning"}>{u.status.toUpperCase()}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/50 p-2 rounded-lg"><div className="text-muted-foreground">Kapasitas</div><div className="font-bold text-foreground font-mono">{u.stok}%</div></div>
                <div className="bg-white/50 p-2 rounded-lg"><div className="text-muted-foreground">Transaksi</div><div className="font-bold text-foreground font-mono">{u.tx} tx</div></div>
              </div>
              <div className="text-[10px] text-muted-foreground mt-2 font-mono">Update: {u.tgl}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}