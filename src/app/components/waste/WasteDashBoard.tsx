// src/app/components/ehs/WasteDashboard.tsx

import { useState, useCallback, useMemo } from "react";
import {
  ChevronRight, RefreshCw, Plus, Trash2, X, AlertTriangle, CheckCircle, Info,
  Eye, Pencil, Database,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, PieChart, Pie, Cell,
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
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}>
      {children}
    </button>
  );
}

function StatCard({ label, value, sub, icon: Icon, color, trend }: {
  label: string; value: string | number; sub: string; icon: React.ElementType; color: string; trend?: string;
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
      {trend && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">{trend}</span>}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted border-b border-border whitespace-nowrap">{children}</th>;
}
function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return <td className={`px-4 py-3 border-b border-border text-sm text-foreground ${mono ? "font-mono text-xs" : ""}`}>{children}</td>;
}

// ═══════════════════════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════════════════════
interface Toast { id: number; message: string; type: "success" | "info" | "danger" | "warning"; }
function ToastContainer({ toasts }: { toasts: Toast[] }) {
  const iconMap = { success: <CheckCircle size={16} />, danger: <Trash2 size={16} />, info: <Info size={16} />, warning: <AlertTriangle size={16} /> };
  const colorMap = { success: "bg-emerald-600", danger: "bg-red-600", info: "bg-blue-700", warning: "bg-amber-500" };
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
//  TYPES & DATA
// ═══════════════════════════════════════════════════════════════
interface Manifest {
  id: string;
  tanggal: string;
  asal: string;
  jenis: "Infeksius" | "B3 Kimia" | "Patologis" | "Farmasi" | "Non-Medis";
  berat: number;
  pengangkut: string;
  status: "Diterima" | "Diproses" | "Ditolak" | "Disposal";
}

const INITIAL_MANIFESTS: Manifest[] = [
  { id: "MNF-240115-001", tanggal: "2025-01-15", asal: "IRNA Lantai 3", jenis: "Infeksius", berat: 85, pengangkut: "Truk Hijau HT-1234", status: "Diproses" },
  { id: "MNF-240115-002", tanggal: "2025-01-15", asal: "Ruang Operasi Pusat", jenis: "B3 Kimia", berat: 32, pengangkut: "Truk Kuning RK-089", status: "Diterima" },
  { id: "MNF-240115-003", tanggal: "2025-01-15", asal: "Lab Patologi", jenis: "Patologis", berat: 12, pengangkut: "Motor Box -", status: "Diterima" },
  { id: "MNF-240115-004", tanggal: "2025-01-15", asal: "Farmasi Rawat Jalan", jenis: "Farmasi", berat: 18, pengangkut: "Truk Biru FK-221", status: "Diproses" },
  { id: "MNF-240115-005", tanggal: "2025-01-15", asal: "Poliklinik Umum", jenis: "Non-Medis", berat: 65, pengangkut: "Mobil Angkut LA-01", status: "Diterima" },
];

const initialBarChart = [
  { hari: "Sen", infeksius: 85, b3: 32, patologis: 12, farmasi: 18, nonmed: 65 },
  { hari: "Sel", infeksius: 92, b3: 28, patologis: 15, farmasi: 22, nonmed: 70 },
  { hari: "Rab", infeksius: 78, b3: 35, patologis: 10, farmasi: 15, nonmed: 58 },
  { hari: "Kam", infeksius: 95, b3: 30, patologis: 18, farmasi: 25, nonmed: 72 },
  { hari: "Jum", infeksius: 88, b3: 25, patologis: 14, farmasi: 20, nonmed: 68 },
  { hari: "Sab", infeksius: 65, b3: 20, patologis: 8, farmasi: 12, nonmed: 45 },
  { hari: "Min", infeksius: 42, b3: 15, patologis: 5, farmasi: 8, nonmed: 32 },
];

const wasteDistChart = [
  { name: "Infeksius", value: 545, color: C.red },
  { name: "B3 Kimia", value: 185, color: C.amber },
  { name: "Patologis", value: 78, color: C.purple },
  { name: "Farmasi",  value: 120, color: C.teal },
  { name: "Non-Medis", value: 410, color: C.green },
];

// ═══════════════════════════════════════════════════════════════
//  MODAL: FORM MANIFEST
// ═══════════════════════════════════════════════════════════════
function ManifestFormModal({ mode, initialData, onSave, onCancel }: {
  mode: "create" | "edit"; initialData: Manifest | null;
  onSave: (data: Omit<Manifest, "id">) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState({
    asal: initialData?.asal ?? "", tanggal: initialData?.tanggal ?? new Date().toISOString().split("T")[0],
    jenis: initialData?.jenis ?? "Infeksius", berat: initialData?.berat ?? "", pengangkut: initialData?.pengangkut ?? "", status: initialData?.status ?? "Diterima",
  });
  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));
  const isValid = form.asal !== "" && Number(form.berat) > 0 && form.pengangkut !== "";
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (!isValid) return; onSave({ asal: form.asal, tanggal: form.tanggal, jenis: form.jenis as Manifest["jenis"], berat: Number(form.berat), pengangkut: form.pengangkut, status: form.status as Manifest["status"] }); };
  const fc = "w-full px-3.5 py-2.5 rounded-lg border border-border bg-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50";
  const lc = "block text-xs font-semibold text-foreground mb-1.5";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border"><h3 className="font-semibold text-base">{mode === "create" ? "Input Manifest Baru" : "Edit Manifest"}</h3><button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X size={16} /></button></div>
        <form onSubmit={submit}>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lc}>Asal Limbah</label><input type="text" className={fc} value={form.asal} onChange={(e) => set("asal", e.target.value)} placeholder="cth: IRNA Lantai 3" autoFocus /></div>
              <div><label className={lc}>Tanggal</label><input type="date" className={fc} value={form.tanggal} onChange={(e) => set("tanggal", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lc}>Jenis Limbah</label>
                <select className={fc} value={form.jenis} onChange={(e) => set("jenis", e.target.value)}>
                  <option value="Infeksius">Infeksius</option>
                  <option value="B3 Kimia">B3 Kimia</option>
                  <option value="Patologis">Patologis</option>
                  <option value="Farmasi">Farmasi</option>
                  <option value="Non-Medis">Non-Medis</option>
                </select>
              </div>
              <div><label className={lc}>Berat (kg)</label><input type="number" min="0.1" step="0.1" className={fc} value={form.berat} onChange={(e) => set("berat", e.target.value)} placeholder="85" /></div>
            </div>
            <div><label className={lc}>Pengangkut</label><input type="text" className={fc} value={form.pengangkut} onChange={(e) => set("pengangkut", e.target.value)} placeholder="cth: Truk Hijau HT-1234" /></div>
            <div>
              <label className={lc}>Status</label>
              <select className={fc} value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="Diterima">Diterima</option>
                <option value="Diproses">Diproses</option>
                <option value="Ditolak">Ditolak</option>
                <option value="Disposal">Disposal</option>
              </select>
            </div>
            {isValid && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-800">
                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Preview</div>
                {mode === "create" && <div>Manifest Baru — {form.asal} ({form.berat} kg {form.jenis})</div>}
                {mode === "edit" && <div>{initialData?.id} — {form.asal} ({form.berat} kg {form.jenis})</div>}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 p-4 border-t border-border bg-muted/50 rounded-b-2xl">
            <button type="button" className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors" onClick={onCancel}>Batal</button>
            <button type="submit" disabled={!isValid} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><Plus size={14} /> {mode === "create" ? "Input Manifest" : "Simpan"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL: VIEW DETAIL
// ═══════════════════════════════════════════════════════════════
function ViewModal({ m, onClose }: { m: Manifest; onClose: () => void }) {
  const items = [
    { l: "ID Manifest", v: m.id },
    { l: "Tanggal", v: m.tanggal },
    { l: "Asal", v: m.asal },
    { l: "Jenis", v: m.jenis },
    { l: "Berat", v: `${m.berat} kg` },
    { l: "Pengangkut", v: m.pengangkut || "—" },
    { l: "Status", v: m.status },
  ];
  const statusCls: Record<string, string> = { "Diterima": "bg-emerald-100 text-emerald-700", "Diproses": "bg-blue-100 text-blue-700", "Ditolak": "bg-red-100 text-red-700", "Disposal": "bg-gray-100 text-gray-700" };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border"><h3 className="font-semibold text-base">Detail Manifest</h3><button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X size={16} /></button></div>
        <div className="p-5 space-y-3">
          {items.map((item) => (
            <div key={item.l}><div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">{item.l}</div><div className="text-sm font-semibold text-foreground flex items-center gap-2">{item.v}{item.l === "Status" && <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${statusCls[item.v] || ""}`}>{item.v}</span>}</div></div>
          ))}
        </div>
        <div className="flex justify-end p-4 border-t border-border bg-muted/50 rounded-b-2xl"><button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors">Tutup</button></div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL: KONFIRMASI HAPUS
// ═══════════════════════════════════════════════════════════════
function ConfirmModal({ m, onConfirm, onCancel }: { m: Manifest; onConfirm: () => void; onCancel: () => void }) {  
return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4"><AlertTriangle size={28} className="text-red-500" /></div>
          <h4 className="font-bold text-base mb-2">Hapus Manifest?</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">Hapus <strong>{m.id}</strong> ({m.asal}, {m.berat} kg)?</p>
        </div>
        <div className="flex justify-center gap-2 p-4 border-t border-border bg-muted/50 rounded-b-2xl">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors">Batal</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">Ya, Hapus</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  KOMPONEN UTAMA
// ═══════════════════════════════════════════════════════════════
export default function WasteDashboard({ navigate }: { navigate: (p: string) => void }) {
  const [manifests, setManifests] = useState<Manifest[]>(INITIAL_MANIFESTS);
  const [barData, setBarData] = useState(initialBarChart);
  const [modal, setModal] = useState<null | "create" | "edit" | "view" | "delete">(null);
  const [selected, setSelected] = useState<Manifest | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const showToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now(); setToasts((p) => [...p, { id, message, type }]); setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }, []);

  // ── Hitung Stat Dinamis ──
  const totalHariIni = useMemo(() => manifests.reduce((s, m) => s + m.berat, 0), [manifests]);
  const infeksiusBulanIni = useMemo(() => manifests.filter(m => m.jenis === "Infeksius").reduce((s, m) => s + m.berat, 0), [manifests]);
  const totalManifest = manifests.length;
  const diprosesManifest = manifests.filter(m => m.status === "Diproses").length;
  const persenDiproses = totalManifest > 0 ? ((diprosesManifest / totalManifest) * 100).toFixed(0) : "0";

  // ── Dynamic Pie Chart Data ──
  const dynamicPieData = useMemo(() => {
    const cats = ["Infeksius", "B3 Kimia", "Patologis", "Farmasi", "Non-Medis"];
    return cats.map(name => {
      const total = manifests.filter(m => m.jenis === name).reduce((s, m) => s + m.berat, 0);
      return { name, value: total, color: wasteDistChart.find(w => w.name === name)?.color || C.gray };
    }).filter(d => d.value > 0);
  }, [manifests]);

  // ── Refresh ──
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setManifests(p => p.map(m => m.status === "Diterima" ? { ...m, status: "Diproses" } : m));
      setIsRefreshing(false);
      showToast("Semua manifest diperbarui ke status Diproses", "info");
    }, 1500);
  };

  // ── Modal Openers ──
  const openCreate = () => { setSelected(null); setModal("create"); };
  const openEdit = (m: Manifest) => { setSelected(m); setModal("edit"); };
  const openView = (m: Manifest) => { setSelected(m); setModal("view"); };
  const openDelete = (m: Manifest) => { setSelected(m); setModal("delete"); };
  const close = () => { setModal(null); setSelected(null); };

  // ── CRUD Handlers ──
  const handleCreate = (data: Omit<Manifest, "id">) => {
    const id = "MNF-" + Date.now().toString().slice(-6);
    setManifests((p) => [{ ...data, id }, ...p]);
    close();
    showToast(`Manifest ${id} diinput — ${data.asal} (${data.berat} kg)`);
  };

  const handleUpdate = (data: Omit<Manifest, "id">) => {
    if (!selected) return;
    setManifests((p) => p.map(m => m.id === selected.id ? { ...m, ...data } : m));
    close();
    showToast(`Manifest ${selected.id} diperbarui`);
  };

  const handleDelete = () => {
    if (!selected) return;
    const id = selected.id;
    setManifests((p) => p.filter(m => m.id !== id));
    close();
    showToast(`Manifest ${id} dihapus`, "danger");
  };

  // ── Permissions ──
  const canEdit = (m: Manifest) => m.status === "Diterima";
  const canDelete = (m: Manifest) => m.status === "Diterima" || m.status === "Ditolak";
  const isFinal = (m: Manifest) => m.status === "Diproses" || m.status === "Disposal";

  return (
    <div className="p-6 space-y-5">

      {/* ═══ HEADER (TIDAK DIUBAH) ═══ */}
      <PageHeader title="Dashboard Limbah Medis – EHS" breadcrumbs={["Modul 21 – Limbah", "Dashboard Limbah Medis"]}>
        <div className="flex gap-2">
          <Btn variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
            {isRefreshing ? "Updating..." : "Refresh"}
          </Btn>
          <Btn size="sm" onClick={openCreate}><Plus size={13} /> Input Manifest</Btn>
        </div>
      </PageHeader>

      {/* ═══ STAT CARDS (TIDAK DIUBAH STRUKTUR, nilai sekarang dinamis) ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Limbah Hari Ini" value={`${totalHariIni} kg`} sub="semua jenis" icon={Trash2} color={C.red} />
        <StatCard label="Infeksius Bulan Ini" value={`${(infeksiusBulanIni / 1000).toFixed(1)} ton`} sub={`sudah diproses ${persenDiproses}%`} icon={AlertTriangle} color={C.orange} />
        <StatCard label="Kapasitas TPS B3" value="67%" sub="kapasitas 4,5 ton" icon={Database} color={C.amber} />
        <StatCard label="Kepatuhan Pelaporan" value={`${persenDiproses}%`} sub="manifest tepat waktu" icon={CheckCircle} color={C.emerald} trend="+0.8%" />
      </div>

      {/* ═══ CHARTS (TIDAK DIUBAH) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <SectionCard title="Volume Limbah per Kategori (kg) – 7 Hari">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hari" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="infeksius" name="Infeksius" fill={C.red} stackId="a" />
                <Bar dataKey="b3" name="B3 Kimia" fill={C.amber} stackId="a" />
                <Bar dataKey="patologis" name="Patologis" fill={C.purple} stackId="a" />
                <Bar dataKey="farmasi" name="Farmasi" fill={C.teal} stackId="a" />
                <Bar dataKey="nonmed" name="Non-Medis" fill={C.green} stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>
        </div>
        <SectionCard title="Distribusi Jenis Limbah Hari Ini">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={dynamicPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                {dynamicPieData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {dynamicPieData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.name}
                </div>
                <span className="font-bold" style={{ fontFamily: "var(--font-mono)" }}>{d.value} kg</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ═══ DAFTAR MANIFEST (DITAMBAHKAN DI BAWAH CHART) ═══ */}
      <SectionCard
        title="Daftar Manifest Limbah"
        actions={
          <span className="text-xs text-muted-foreground">
            Menampilkan <strong className="text-foreground">{manifests.length}</strong> manifest hari ini
          </span>
        }
      >
        {manifests.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">Belum ada manifest hari ini</div>
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <Th>ID Manifest</Th><Th>Tanggal</Th><Th>Asal</Th><Th>Jenis</Th><Th>Berat (kg)</Th><Th>Pengangkut</Th><Th>Status</Th><Th>Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {manifests.map(m => (
                  <tr key={m.id} className={`hover:bg-muted/40 transition-colors ${isFinal(m) ? "opacity-60" : ""}`}>
                    <Td mono>{m.id}</Td>
                    <Td mono>{m.tanggal}</Td>
                    <Td><span className="text-xs">{m.asal}</span></Td>
                    <Td>{m.jenis}</Td>
                    <Td mono>{m.berat}</Td>
                    <Td><span className="text-xs">{m.pengangkut || "—"}</span></Td>
                    <Td>
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${m.status === "Diterima" ? "bg-emerald-100 text-emerald-700" : m.status === "Diproses" ? "bg-blue-100 text-blue-700" : m.status === "Ditolak" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                        {m.status}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openView(m)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors" title="Lihat"><Eye size={14} /></button>
                        {canEdit(m) && <button onClick={() => openEdit(m)} className="p-1.5 rounded hover:bg-amber-50 text-amber-600 transition-colors" title="Edit"><Pencil size={14} /></button>}
                        {canDelete(m) && <button onClick={() => openDelete(m)} className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors" title="Hapus"><Trash2 size={14} /></button>}
                        {isFinal(m) && <span className="text-[10px] text-muted-foreground italic pl-1">Final</span>}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ═══ MODALS ═══ */}
      {modal === "create" && <ManifestFormModal mode="create" initialData={null} onSave={handleCreate} onCancel={close} />}
      {modal === "edit" && selected && <ManifestFormModal mode="edit" initialData={selected} onSave={handleUpdate} onCancel={close} />}
      {modal === "view" && selected && <ViewModal m={selected} onClose={close} />}
      {modal === "delete" && selected && <ConfirmModal m={selected} onConfirm={handleDelete} onCancel={close} />}

      <ToastContainer toasts={toasts} />
    </div>
  );
}