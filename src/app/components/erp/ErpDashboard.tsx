// src/app/components/erp/ErpDashboard.tsx

import { useState, useMemo, useCallback } from "react";
import {
  ChevronRight, RefreshCw, Plus, FileText, TrendingUp, Truck, Package,
  ArrowRight, Filter, Download, X, CheckCircle, Info, Search,
  FileSpreadsheet,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { downloadCSV } from "../../../helpers/exportCsv";
import { downloadExcel } from "../../../helpers/exportExcel";

// ═══════════════════════════════════════════════════════════════
//  PALETTE & UI PRIMITIVES
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

function StatCard({ label, value, sub, icon: Icon, color, trend }: {
  label: string; value: string; sub: string; icon: React.ElementType; color: string; trend?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-border flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "18" }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-mono)" }}>{value}</div>
        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
          {trend && <span className="font-semibold text-emerald-600">{trend}</span>}
          {sub}
        </div>
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
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}>
      {children}
    </button>
  );
}

function Badge({ variant = "default", children }: { variant?: string; children: React.ReactNode }) {
  const cls: Record<string, string> = {
    default: "bg-blue-100 text-blue-700",
    aktif: "bg-emerald-100 text-emerald-700",
    proses: "bg-blue-100 text-blue-700",
    serah: "bg-amber-100 text-amber-700",
    selesai: "bg-emerald-100 text-emerald-700",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${cls[variant] || cls.default}`}>{children}</span>;
}

// ═══════════════════════════════════════════════════════════════
//  DATA
// ═══════════════════════════════════════════════════════════════
interface PurchaseOrder {
  id: string;
  item: string;
  vendor: string;
  jumlah: string;
  nilai: string;
  status: "proses" | "terima" | "selesai";
  tgl: string;
  prioritas: "tinggi" | "sedang" | "rendah";
  catatan: string;
}

const INITIAL_POS: PurchaseOrder[] = [
  { id: "PO-2026-0251", item: "Reagen Lab Kimia Klinik",      vendor: "PT Rajawali Nusindo",    jumlah: "50 Kit",   nilai: "Rp 125.000.000", status: "proses",  tgl: "22 Jun 2026", prioritas: "tinggi", catatan: "" },
  { id: "PO-2026-0249", item: "Amoxicillin 500mg 50.000 Tab", vendor: "PT Kimia Farma T&D",     jumlah: "50.000 Tab", nilai: "Rp 40.000.000",  status: "terima",  tgl: "20 Jun 2026", prioritas: "tinggi", catatan: "Sudah diterima di gudang" },
  { id: "PO-2026-0247", item: "Infus RL 1000mL 2.000 Fls",   vendor: "PT Kalbe Farma",        jumlah: "2.000 Fls", nilai: "Rp 30.000.000",   status: "selesai", tgl: "18 Jun 2026", prioritas: "sedang", catatan: "Selesai diverifikasi" },
];

const MONTHLY_CHART = [
  { bln: "Jan", nilai: 4200 }, { bln: "Feb", nilai: 3800 }, { bln: "Mar", nilai: 5100 },
  { bln: "Apr", nilai: 4600 }, { bln: "Mei", nilai: 5800 }, { bln: "Jun", nilai: 4900 },
];

const stockPredChart = [
  { hari: "Sen", amoxicillin: 850, paracetamol: 1200, metformin: 620, cipro: 380 },
  { hari: "Sel", amoxicillin: 720, paracetamol: 1050, metformin: 580, cipro: 320 },
  { hari: "Rab", amoxicillin: 610, paracetamol: 890, metformin: 540, cipro: 275 },
  { hari: "Kam", amoxicillin: 480, paracetamol: 780, metformin: 490, cipro: 220 },
  { hari: "Jum", amoxicillin: 340, paracetamol: 650, metformin: 430, cipro: 165 },
  { hari: "Sab", amoxicillin: 210, paracetamol: 520, metformin: 370, cipro: 110 },
  { hari: "Min", amoxicillin: 90,  paracetamol: 380, metformin: 300, cipro: 58 },
];

// ═══════════════════════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════════════════════
interface Toast { id: number; message: string; type: "success" | "info" | "danger"; }

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  const iconMap = { success: <CheckCircle size={16} />, danger: <Info size={16} />, info: <Info size={16} /> };
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
//  MODAL: Buat PO Baru
// ═══════════════════════════════════════════════════════════════
function CreatePOModal({ onSave, onClose }: { onSave: (data: Omit<PurchaseOrder, "id" | "tgl" | "status">) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    item: "", vendor: "", jumlah: "", nilai: "", prioritas: "sedang", catatan: "",
  });
  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const isValid = form.item.trim() !== "" && form.vendor.trim() !== "" && form.jumlah.trim() !== "" && form.nilai.trim() !== "";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSave({
      item: form.item.trim(),
      vendor: form.vendor.trim(),
      jumlah: form.jumlah.trim(),
      nilai: form.nilai.trim(),
      prioritas: form.prioritas as PurchaseOrder["prioritas"],
      catatan: form.catatan.trim(),
    });
  };

  const fc = "w-full px-3.5 py-2.5 rounded-lg border border-border bg-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50";
  const lc = "block text-xs font-semibold text-foreground mb-1.5";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold text-base">Buat Purchase Order Baru</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X size={16} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="p-5 space-y-4">
            <div>
              <label className={lc}>Nama Item / Barang</label>
              <input className={fc} placeholder="cth: Reagen Lab Kimia Klinik 50 Kit" value={form.item} onChange={(e) => set("item", e.target.value)} autoFocus />
            </div>
            <div>
              <label className={lc}>Vendor / Pemasok</label>
              <input className={fc} placeholder="cth: PT Kimia Farma T&D" value={form.vendor} onChange={(e) => set("vendor", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lc}>Jumlah</label>
                <input className={fc} placeholder="cth: 50 Kit" value={form.jumlah} onChange={(e) => set("jumlah", e.target.value)} />
              </div>
              <div>
                <label className={lc}>Nilai (Rp)</label>
                <input className={fc} placeholder="cth: 125.000.000" value={form.nilai} onChange={(e) => set("nilai", e.target.value)} />
              </div>
            </div>
            <div>
              <label className={lc}>Prioritas</label>
              <select className={fc} value={form.prioritas} onChange={(e) => set("prioritas", e.target.value)}>
                <option value="tinggi">Tinggi</option>
                <option value="sedang">Sedang</option>
                <option value="rendah">Rendah</option>
              </select>
            </div>
            <div>
              <label className={lc}>Catatan (opsional)</label>
              <input className={fc} placeholder="cth: Butuh sebelum akhir bulan" value={form.catatan} onChange={(e) => set("catatan", e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 p-4 border-t border-border bg-muted/50 rounded-b-2xl">
            <button type="button" className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors" onClick={onClose}>Batal</button>
            <button type="submit" disabled={!isValid} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Buat PO</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  1. ERP DASHBOARD
// ═══════════════════════════════════════════════════════════════
export function ERPDashboard({ navigate }: { navigate: (p: string) => void }) {
  const [pos, setPos] = useState<PurchaseOrder[]>(INITIAL_POS);
  const [showCreatePO, setShowCreatePO] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  // ── Sinkronisasi ──
  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      toast("Data PO berhasil disinkronisasi dengan sistem ERP");
    }, 1800);
  };

  // ── Buat PO ──
  const handleCreatePO = (data: Omit<PurchaseOrder, "id" | "tgl" | "status">) => {
    const newPO: PurchaseOrder = {
      ...data,
      id: `PO-2026-${String(252 + pos.length).padStart(4, "0")}`,
      tgl: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
      status: "proses",
    };
    setPos((prev) => [newPO, ...prev]);
    setShowCreatePO(false);
    toast(`PO "${newPO.id}" berhasil dibuat`);
  };

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Dashboard ERP & Supply Chain" breadcrumbs={["Modul 10 – ERP", "Dashboard ERP"]}>
        <div className="flex gap-2">
          <Btn variant="ghost" size="sm" onClick={handleSync} disabled={syncing}>
            <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Sinkronisasi..." : "Sinkronisasi"}
          </Btn>
          <Btn size="sm" onClick={() => setShowCreatePO(true)}><Plus size={13} /> Buat PO Baru</Btn>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="PO Aktif" value={pos.filter((p) => p.status === "proses").length.toString()} sub="menunggu proses" icon={FileText} color={C.blue} />
        <StatCard label="Nilai Pengadaan YTD" value="Rp 28,4 M" sub="target Rp 35 M (81%)" icon={TrendingUp} color={C.green} trend="+12.3%" />
        <StatCard label="Vendor Aktif" value="18" sub="terverifikasi 2026" icon={Truck} color={C.teal} />
        <StatCard label="Item Diterima Bulan Ini" value="1.847" sub="98.3% sesuai PO" icon={Package} color={C.emerald} trend="+5.1%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard
          title="Nilai Pengadaan per Bulan (Rp Juta)"
          actions={<Btn size="sm" variant="ghost" onClick={() => navigate("erp-prediksi")}><ArrowRight size={13} /> Prediksi</Btn>}
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MONTHLY_CHART}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="bln" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v: number) => [`Rp ${v.toLocaleString()} Jt`, "Nilai"]} />
              <Bar dataKey="nilai" fill={C.blue} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title={`Status PO Terkini (${pos.length})`}>
          <div className="space-y-3">
            {pos.map((po) => (
              <div key={po.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-foreground">{po.id}</div>
                  <div className="text-xs text-muted-foreground truncate">{po.item} · {po.vendor}</div>
                  {po.catatan && <div className="text-[10px] text-muted-foreground mt-0.5">{po.catatan}</div>}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-foreground">{po.nilai}</div>
                  <Badge variant={po.status === "selesai" ? "aktif" : po.status === "proses" ? "proses" : "serah"}>{po.status}</Badge>
                </div>
              </div>
            ))}
            {pos.length === 0 && (
              <div className="text-center py-6 text-xs text-muted-foreground">Belum ada PO</div>
            )}
          </div>
        </SectionCard>
      </div>

      {showCreatePO && <CreatePOModal onSave={handleCreatePO} onClose={() => setShowCreatePO(false)} />}
      <ToastContainer toasts={toasts} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  2. ERP PREDIKSI STOK
// ═══════════════════════════════════════════════════════════════
export function ERPPrediksi() {
  const [filterHari, setFilterHari] = useState<7 | 3 | 5 | 0>(0); // 0 = semua
  const [openDownload, setOpenDownload] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  // ── Filter data prediksi berdasarkan hari ──
  const prediksiItems = [
    { nama: "Amoxicillin 500mg", hari: 7, warna: C.red },
    { nama: "Paracetamol 500mg", hari: 3, warna: C.red },
    { nama: "Ciprofloxacin 500mg", hari: 5, warna: C.amber },
    { nama: "Captopril 25mg", hari: 2, warna: C.red },
  ];

  const filteredItems = useMemo(() => {
    if (filterHari === 0) return prediksiItems;
    return prediksiItems.filter((d) => d.hari <= filterHari);
  }, [filterHari]);

  // ── Export handlers ──
  const today = new Date().toISOString().slice(0, 10);
  const predLabels = { nama: "Nama Obat", hari: "Habis Dalam (Hari)" };

  const handleCSV = () => {
    try {
      downloadCSV(filteredItems, `prediksi-stok-${today}.csv`, predLabels);
      setOpenDownload(false);
      toast(`CSV didownload (${filteredItems.length} obat)`, "info");
    } catch (err) { toast(`Gagal: ${(err as Error).message}`, "danger"); }
  };

  const handleExcel = () => {
    try {
      downloadExcel(filteredItems, `prediksi-stok-${today}`, predLabels, "Prediksi Stok");
      setOpenDownload(false);
      toast(`Excel didownload (${filteredItems.length} obat)`, "info");
    } catch (err) { toast(`Gagal: ${(err as Error).message}`, "danger"); }
  };

  const filterOptions = [
    { label: "Semua", value: 0 as const },
    { label: "≤ 2 Hari", value: 2 as const },
    { label: "≤ 3 Hari", value: 3 as const },
    { label: "≤ 5 Hari", value: 5 as const },
    { label: "≤ 7 Hari", value: 7 as const },
  ];

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Prediksi Stok Habis – 7 Hari ke Depan" breadcrumbs={["Modul 10 – ERP", "Prediksi Stok Habis"]}>
        <div className="flex gap-2">
          {/* Filter buttons */}
          {filterOptions.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterHari(f.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                filterHari === f.value
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "border-border bg-white text-muted-foreground hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          ))}

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
                </div>
              </>
            )}
          </div>
        </div>
      </PageHeader>

      {/* Cards prediksi */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredItems.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <CheckCircle size={40} className="mx-auto mb-3 text-emerald-300" />
            <div className="text-sm font-semibold text-foreground mb-1">Tidak ada prediksi untuk filter ini</div>
            <button onClick={() => setFilterHari(0)} className="text-xs text-primary font-semibold hover:underline mt-1">Tampilkan semua</button>
          </div>
        ) : (
          filteredItems.map((d) => (
            <div key={d.nama} className="bg-white rounded-xl p-4 border border-border shadow-sm">
              <div className="text-xs text-muted-foreground mb-1">Habis dalam</div>
              <div className="text-2xl font-bold mb-1" style={{ color: d.warna, fontFamily: "var(--font-mono)" }}>{d.hari} hari</div>
              <div className="text-sm font-semibold text-foreground">{d.nama}</div>
            </div>
          ))
        )}
      </div>

      {/* Chart */}
      <SectionCard title="Grafik Prediksi Stok 7 Hari (Unit)">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={stockPredChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="hari" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="amoxicillin" name="Amoxicillin 500mg" stroke={C.blue} strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="paracetamol" name="Paracetamol 500mg" stroke={C.red} strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="metformin" name="Metformin 500mg" stroke={C.green} strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="cipro" name="Ciprofloxacin 500mg" stroke={C.amber} strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </SectionCard>

      <ToastContainer toasts={toasts} />
    </div>
  );
}