// src/app/components/adc/DaftarObat.tsx

import { useState, useMemo, useCallback } from "react";
import {
  ChevronRight, Plus, Download, Eye, Pencil, Trash2,
  X, AlertTriangle, CheckCircle, Info, FileText, FileSpreadsheet, File, Search,
} from "lucide-react";
import { downloadCSV } from "../../../helpers/exportCsv";
import { downloadExcel } from "../../../helpers/exportExcel";

// ═══════════════════════════════════════════════════════════════
//  UI PRIMITIVES
// ═══════════════════════════════════════════════════════════════
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
    danger: "bg-red-600 text-white hover:bg-red-700",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
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
    normal: "bg-emerald-100 text-emerald-700",
    rendah: "bg-amber-100 text-amber-700",
    kritis: "bg-red-100 text-red-700",
    aktif: "bg-emerald-100 text-emerald-700",
    sukses: "bg-emerald-100 text-emerald-700",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${cls[variant] || cls.default}`}>{children}</span>;
}

// ═══════════════════════════════════════════════════════════════
//  TYPES & DATA
// ═══════════════════════════════════════════════════════════════
interface Drug {
  id: string; nama: string; kat: string; stok: number;
  min: number; max: number; sat: string; exp: string; status: "normal" | "rendah" | "kritis";
}

interface RiwayatItem {
  waktu: string; perawat: string; pasien: string;
  obat: string; jml: string; adc: string; status: string;
}

const INITIAL_DRUGS: Drug[] = [
  { id: "OBT001", nama: "Amoxicillin 500mg",     kat: "Antibiotik",      stok: 1240, min: 200,  max: 2000, sat: "Tab", exp: "2027-08-15", status: "normal" },
  { id: "OBT002", nama: "Paracetamol 500mg",     kat: "Analgesik",       stok: 85,   min: 300,  max: 3000, sat: "Tab", exp: "2026-12-31", status: "kritis" },
  { id: "OBT003", nama: "Metformin 500mg",       kat: "Antidiabetik",    stok: 620,  min: 150,  max: 1500, sat: "Tab", exp: "2027-03-22", status: "normal" },
  { id: "OBT004", nama: "Ciprofloxacin 500mg",   kat: "Antibiotik",      stok: 178,  min: 200,  max: 1000, sat: "Tab", exp: "2026-09-30", status: "rendah" },
  { id: "OBT005", nama: "Amlodipine 5mg",        kat: "Antihipertensi",  stok: 890,  min: 100,  max: 1200, sat: "Tab", exp: "2027-11-10", status: "normal" },
  { id: "OBT006", nama: "Omeprazole 20mg",       kat: "GI",              stok: 145,  min: 200,  max: 1500, sat: "Kap", exp: "2027-01-15", status: "rendah" },
  { id: "OBT007", nama: "Morfin HCl 10mg/mL",    kat: "Narkotika",       stok: 48,   min: 10,   max: 100,  sat: "Amp", exp: "2026-11-30", status: "normal" },
  { id: "OBT008", nama: "Fentanyl 50mcg/mL",     kat: "Narkotika",       stok: 32,   min: 10,   max: 80,   sat: "Amp", exp: "2027-02-28", status: "normal" },
  { id: "OBT009", nama: "Metronidazole 500mg",   kat: "Antibiotik",      stok: 320,  min: 100,  max: 800,  sat: "Tab", exp: "2027-06-15", status: "normal" },
  { id: "OBT010", nama: "Captopril 25mg",        kat: "Antihipertensi",  stok: 42,   min: 100,  max: 800,  sat: "Tab", exp: "2026-08-20", status: "kritis" },
];

const INITIAL_RIWAYAT: RiwayatItem[] = [
  { waktu: "14:32", perawat: "Ns. Sari Dewi", pasien: "Budi S. – Mawar-204",   obat: "Amoxicillin 500mg",    jml: "3 Tab", adc: "ADC-03", status: "sukses" },
  { waktu: "14:18", perawat: "Ns. Rina A.",     pasien: "Sri W. – Melati-108",   obat: "Amlodipine 5mg",       jml: "1 Tab", adc: "ADC-04", status: "sukses" },
  { waktu: "13:55", perawat: "Ns. Dewi R.",     pasien: "Hendra W. – ICU-02",    obat: "Morfin HCl 10mg/mL",  jml: "2 Amp", adc: "ADC-02", status: "sukses" },
  { waktu: "13:42", perawat: "Ns. Agus K.",     pasien: "Slamet R. – VIP-02",   obat: "Metformin 500mg",      jml: "2 Tab", adc: "ADC-06", status: "sukses" },
  { waktu: "13:30", perawat: "Ns. Sari Dewi", pasien: "Dewi R. – Anggrek-312", obat: "Omeprazole 20mg",      jml: "1 Kap", adc: "ADC-05", status: "sukses" },
];

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════
function hitungStatus(stok: number, min: number): Drug["status"] {
  if (stok <= min) return "kritis";
  if (stok <= min * 1.5) return "rendah";
  return "normal";
}

function generateId(data: Drug[]): string {
  if (data.length === 0) return "OBT001";
  const nums = data.map((d) => parseInt(d.id.replace("OBT", ""), 10));
  return "OBT" + String(Math.max(...nums) + 1).padStart(3, "0");
}

// ═══════════════════════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════════════════════
interface Toast { id: number; message: string; type: "success" | "info" | "danger"; }

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  const iconMap = { success: <CheckCircle size={16} />, danger: <Trash2 size={16} />, info: <Info size={16} /> };
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
//  MODAL FORM (Create / Edit)
// ═══════════════════════════════════════════════════════════════
function FormModal({
  mode, initialData, onSave, onCancel,
}: {
  mode: "create" | "edit";
  initialData: Drug | null;
  onSave: (data: Omit<Drug, "id">) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    nama: initialData?.nama ?? "",
    kat: initialData?.kat ?? "Antibiotik",
    stok: initialData?.stok ?? "",
    min: initialData?.min ?? "",
    max: initialData?.max ?? "",
    sat: initialData?.sat ?? "Tab",
    exp: initialData?.exp ?? "",
  });

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const isValid =
    form.nama.trim() !== "" &&
    Number(form.stok) >= 0 &&
    Number(form.min) >= 0 &&
    Number(form.max) >= Number(form.min) &&
    form.exp !== "";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    const stokNum = Number(form.stok);
    const minNum = Number(form.min);
    onSave({
      nama: form.nama.trim(), kat: form.kat, stok: stokNum,
      min: minNum, max: Number(form.max), sat: form.sat, exp: form.exp,
      status: hitungStatus(stokNum, minNum),
    });
  };

  const fc = "w-full px-3.5 py-2.5 rounded-lg border border-border bg-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50";
  const lc = "block text-xs font-semibold text-foreground mb-1.5";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold text-base">{mode === "create" ? "Tambah Obat Baru" : "Edit Data Obat"}</h3>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X size={16} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="p-5 space-y-4">
            <div>
              <label className={lc}>Nama Obat</label>
              <input className={fc} placeholder="cth: Amoxicillin 500mg" value={form.nama} onChange={(e) => set("nama", e.target.value)} autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lc}>Kategori</label>
                <select className={fc} value={form.kat} onChange={(e) => set("kat", e.target.value)}>
                  {["Antibiotik", "Analgesik", "Antidiabetik", "Antihipertensi", "GI", "Narkotika", "Lainnya"].map((k) => <option key={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label className={lc}>Satuan</label>
                <select className={fc} value={form.sat} onChange={(e) => set("sat", e.target.value)}>
                  {["Tab", "Kap", "Amp", "Sir", "Vial", "Pcs"].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lc}>Stok Saat Ini</label>
                <input type="number" min="0" className={fc} value={form.stok} onChange={(e) => set("stok", e.target.value)} />
              </div>
              <div>
                <label className={lc}>Stok Minimum</label>
                <input type="number" min="0" className={fc} value={form.min} onChange={(e) => set("min", e.target.value)} />
              </div>
            </div>
            <div>
              <label className={lc}>Stok Maksimum</label>
              <input type="number" min="0" className={fc} value={form.max} onChange={(e) => set("max", e.target.value)} />
            </div>
            <div>
              <label className={lc}>Tanggal Kadaluarsa</label>
              <input type="date" className={fc} value={form.exp} onChange={(e) => set("exp", e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 p-4 border-t border-border bg-muted/50 rounded-b-2xl">
            <button type="button" className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors" onClick={onCancel}>Batal</button>
            <button type="submit" disabled={!isValid} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {mode === "create" ? "Simpan Obat Baru" : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL VIEW DETAIL
// ═══════════════════════════════════════════════════════════════
function ViewModal({ data, onClose }: { data: Drug; onClose: () => void }) {
  const pct = Math.min(100, (data.stok / data.max) * 100);
  const barColor = data.status === "kritis" ? "bg-red-500" : data.status === "rendah" ? "bg-amber-500" : "bg-emerald-500";
  const items = [
    { l: "ID Obat", v: data.id, m: true },
    { l: "Nama Obat", v: data.nama },
    { l: "Kategori", v: data.kat },
    { l: "Satuan", v: data.sat },
    { l: "Stok", v: data.stok.toLocaleString("id-ID"), m: true },
    { l: "Min / Max", v: `${data.min.toLocaleString("id-ID")} / ${data.max.toLocaleString("id-ID")}`, m: true },
    { l: "Kadaluarsa", v: new Date(data.exp).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) },
  ];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold text-base">Detail Obat</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X size={16} /></button>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 gap-4">
            {items.map((item) => (
              <div key={item.l}>
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{item.l}</div>
                <div className={`text-sm font-semibold text-foreground ${item.m ? "font-mono text-xs" : ""}`}>{item.v}</div>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Status</div>
            <Badge variant={data.status}>{data.status.charAt(0).toUpperCase() + data.status.slice(1)}</Badge>
          </div>
          <div className="mt-5">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Level Stok</div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
              </div>
              <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">{data.stok} / {data.max}</span>
            </div>
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
//  MODAL KONFIRMASI HAPUS
// ═══════════════════════════════════════════════════════════════
function ConfirmModal({ drug, onConfirm, onCancel }: { drug: Drug; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
          <h4 className="font-bold text-base mb-2">Hapus Data Obat?</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Anda akan menghapus <strong>{drug.nama}</strong> ({drug.id}). Tindakan ini tidak bisa dibatalkan.
          </p>
        </div>
        <div className="flex justify-center gap-2 p-4 border-t border-border bg-muted/50 rounded-b-2xl">
          <button className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors" onClick={onCancel}>Batal</button>
          <button className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors" onClick={onConfirm}>Ya, Hapus</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  KOMPONEN UTAMA
// ═══════════════════════════════════════════════════════════════
export default function DaftarObat() {
  // ── State ──
  const [tab, setTab] = useState<"daftar" | "riwayat">("daftar");
  const [drugs, setDrugs] = useState<Drug[]>(INITIAL_DRUGS);
  const [riwayat] = useState<RiwayatItem[]>(INITIAL_RIWAYAT);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<null | "create" | "edit" | "view" | "delete">(null);
  const [selected, setSelected] = useState<Drug | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [openDownload, setOpenDownload] = useState(false);

  const toast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  // ── Filter search ──
  const q = search.toLowerCase();
  const filteredDrugs = useMemo(() =>
    drugs.filter((d) => d.id.toLowerCase().includes(q) || d.nama.toLowerCase().includes(q) || d.kat.toLowerCase().includes(q) || d.status.includes(q)),
    [drugs, q]
  );

  // ── CRUD handlers ──
  const openCreate = () => { setSelected(null); setModal("create"); };
  const openEdit = (d: Drug) => { setSelected(d); setModal("edit"); };
  const openView = (d: Drug) => { setSelected(d); setModal("view"); };
  const openDelete = (d: Drug) => { setSelected(d); setModal("delete"); };
  const close = () => { setModal(null); setSelected(null); };

  const handleCreate = (data: Omit<Drug, "id">) => {
    const newDrug: Drug = { id: generateId(drugs), ...data };
    setDrugs((prev) => [newDrug, ...prev]);
    close();
    toast(`"${newDrug.nama}" berhasil ditambahkan`);
  };

  const handleUpdate = (data: Omit<Drug, "id">) => {
    if (!selected) return;
    setDrugs((prev) => prev.map((d) => (d.id === selected.id ? { ...d, ...data } : d)));
    close();
    toast(`"${data.nama}" berhasil diperbarui`);
  };

  const handleDelete = () => {
    if (!selected) return;
    const nama = selected.nama;
    setDrugs((prev) => prev.filter((d) => d.id !== selected.id));
    close();
    toast(`"${nama}" berhasil dihapus`, "danger");
  };

  // ── Download handlers ──
  const today = new Date().toISOString().slice(0, 10);
  const drugLabels = { id: "ID Obat", nama: "Nama Obat", kat: "Kategori", stok: "Stok", min: "Stok Minimum", max: "Stok Maksimum", sat: "Satuan", exp: "Kadaluarsa", status: "Status" };
  const riwayatLabels = { waktu: "Waktu", perawat: "Perawat", pasien: "Pasien", obat: "Obat", jml: "Jumlah", adc: "ADC", status: "Status" };

  const handleCSV = () => {
    try {
      const data = tab === "daftar" ? filteredDrugs : riwayat;
      const labels = tab === "daftar" ? drugLabels : riwayatLabels;
      downloadCSV(data as Record<string, unknown>[], `obat-${tab}-${today}.csv`, labels);
      setOpenDownload(false);
      toast(`CSV didownload (${data.length} baris)`, "info");
    } catch (err) { toast(`Gagal: ${(err as Error).message}`, "danger"); }
  };

  const handleExcel = () => {
    try {
      const data = tab === "daftar" ? filteredDrugs : riwayat;
      const labels = tab === "daftar" ? drugLabels : riwayatLabels;
      downloadExcel(data as Record<string, unknown>[], `obat-${tab}-${today}`, labels, tab === "daftar" ? "Daftar Obat" : "Riwayat Pengambilan");
      setOpenDownload(false);
      toast(`Excel didownload (${data.length} baris)`, "info");
    } catch (err) { toast(`Gagal: ${(err as Error).message}`, "danger"); }
  };

  return (
    <div className="p-6 space-y-5">

      {/* ═══ HEADER ═══ */}
      <PageHeader title="Daftar Obat & Riwayat Pengambilan" breadcrumbs={["Modul 4 – ADC", "Daftar Obat & Riwayat"]}>
        <div className="flex gap-2">
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari obat..."
              className="pl-8 pr-3 py-1.5 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 w-52"
            />
          </div>

          {/* Download dropdown */}
          <div className="relative">
            <button onClick={() => setOpenDownload(!openDownload)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors">
              <Download size={13} /> Export
            </button>
            {openDownload && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpenDownload(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-border rounded-xl shadow-xl p-1.5 min-w-[180px]">
                  <button onClick={handleCSV} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-muted transition-colors text-left">
                    <FileText size={15} className="text-emerald-600" /> CSV
                  </button>
                  <button onClick={handleExcel} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-muted transition-colors text-left">
                    <FileSpreadsheet size={15} className="text-blue-600" /> Excel
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Tambah obat (hanya di tab daftar) */}
          {tab === "daftar" && (
            <Btn size="sm" onClick={openCreate}><Plus size={13} /> Tambah Obat</Btn>
          )}
        </div>
      </PageHeader>

      {/* ═══ TABS ═══ */}
      <div className="flex border-b border-border gap-4">
        {(["daftar", "riwayat"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSearch(""); }}
            className={`pb-2.5 text-sm font-semibold border-b-2 transition-all capitalize ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {t === "daftar" ? "Daftar Obat" : "Riwayat Pengambilan"}
            <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${tab === t ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
              {tab === "daftar" ? drugs.length : riwayat.length}
            </span>
          </button>
        ))}
      </div>

      {/* ═══ TAB: DAFTAR OBAT (CRUD) ═══ */}
      {tab === "daftar" && (
        <SectionCard
          title="Semua Obat Terdaftar"
          actions={<span className="text-xs text-muted-foreground">Menampilkan <strong className="text-foreground">{filteredDrugs.length}</strong> dari <strong className="text-foreground">{drugs.length}</strong></span>}
        >
          <TableWrapper>
            <thead>
              <tr>
                <Th>ID</Th><Th>Nama Obat</Th><Th>Kategori</Th><Th>Stok</Th><Th>Satuan</Th><Th>Kadaluarsa</Th><Th>Status</Th><Th>Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {filteredDrugs.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-muted-foreground text-sm">Tidak ditemukan</td></tr>
              ) : (
                filteredDrugs.map((d) => (
                  <tr key={d.id} className={`hover:bg-muted/40 ${d.status === "kritis" ? "bg-red-50/30" : ""}`}>
                    <Td mono>{d.id}</Td>
                    <Td><span className="font-medium">{d.nama}</span></Td>
                    <Td><Badge>{d.kat}</Badge></Td>
                    <Td mono>{d.stok.toLocaleString("id-ID")}</Td>
                    <Td>{d.sat}</Td>
                    <Td mono>{d.exp}</Td>
                    <Td><Badge variant={d.status}>{d.status}</Badge></Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openView(d)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors" title="Lihat"><Eye size={14} /></button>
                        <button onClick={() => openEdit(d)} className="p-1.5 rounded hover:bg-amber-50 text-amber-600 transition-colors" title="Edit"><Pencil size={14} /></button>
                        <button onClick={() => openDelete(d)} className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors" title="Hapus"><Trash2 size={14} /></button>
                      </div>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </TableWrapper>
        </SectionCard>
      )}

      {/* ═══ TAB: RIWAYAT (read-only + export) ═══ */}
      {tab === "riwayat" && (
        <SectionCard
          title="Riwayat Pengambilan Hari Ini"
          actions={<span className="text-xs text-muted-foreground">{riwayat.length} transaksi</span>}
        >
          <TableWrapper>
            <thead>
              <tr>
                <Th>Waktu</Th><Th>Perawat</Th><Th>Pasien</Th><Th>Obat</Th><Th>Jumlah</Th><Th>ADC</Th><Th>Status</Th><Th></Th>
              </tr>
            </thead>
            <tbody>
              {riwayat.map((r, i) => (
                <tr key={i} className="hover:bg-muted/40">
                  <Td mono>{r.waktu}</Td>
                  <Td>{r.perawat}</Td>
                  <Td>{r.pasien}</Td>
                  <Td><span className="font-medium">{r.obat}</span></Td>
                  <Td mono>{r.jml}</Td>
                  <Td><Badge>{r.adc}</Badge></Td>
                  <Td><Badge variant="sukses">{r.status}</Badge></Td>
                  <Td><Eye size={14} className="text-muted-foreground/30" /></Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        </SectionCard>
      )}

      {/* ═══ MODALS ═══ */}
      {modal === "create" && <FormModal mode="create" initialData={null} onSave={handleCreate} onCancel={close} />}
      {modal === "edit" && selected && <FormModal mode="edit" initialData={selected} onSave={handleUpdate} onCancel={close} />}
      {modal === "view" && selected && <ViewModal data={selected} onClose={close} />}
      {modal === "delete" && selected && <ConfirmModal drug={selected} onConfirm={handleDelete} onCancel={close} />}

      <ToastContainer toasts={toasts} />
    </div>
  );
}