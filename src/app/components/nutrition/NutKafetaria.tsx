// src/app/components/nutrition/NutKafetaria.tsx

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  ChevronRight, Download, Plus, Search,
  X, AlertTriangle, CheckCircle, Info, Eye, Pencil, Trash2,
  ChevronDown, RotateCcw, FileSpreadsheet, FileText, User, Utensils, TrendingUp,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════
//  PALETTE & UI PRIMITIVES
// ═══════════════════════════════════════════════════════════════
const C = { blue: "#1549A0", green: "#00897B", teal: "#0891B2", amber: "#F59E0B", red: "#EF4444", emerald: "#10B981" };

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

function TableWrapper({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto -mx-5"><table className="w-full text-sm">{children}</table></div>;
}
function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted border-b border-border whitespace-nowrap">{children}</th>;
}
function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return <td className={`px-4 py-3 border-b border-border text-sm text-foreground ${mono ? "font-mono text-xs" : ""}`}>{children}</td>;
}

function StatCard({ label, value, sub, icon: Icon, color, trend }: {
  label: string; value: string | number; sub: string; icon: React.ElementType; color: string; trend?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-border flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "18" }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div>
        <div className="text-xl font-bold text-foreground font-mono">{value}</div>
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="text-[10px] text-muted-foreground">{sub}</div>
      </div>
      {trend && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">{trend}</span>}
    </div>
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
//  EXPORT UTILS
// ═══════════════════════════════════════════════════════════════
function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(","), ...data.map((row) => headers.map((h) => { const val = String(row[h] ?? ""); return val.includes(",") || val.includes('"') || val.includes("\n") ? `"${val.replace(/"/g, '""')}"` : val; }).join(","))];
  const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `${filename}.csv`; link.click(); URL.revokeObjectURL(link.href);
}
function downloadExcel(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const html = [`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Sheet1</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table border="1">`,`<tr>${headers.map((h) => `<th style="background:#f0f0f0;font-weight:bold;">${h}</th>`).join("")}</tr>`,...data.map((row) => `<tr>${headers.map((h) => `<td style="mso-number-format:'\\@';">${row[h] ?? ""}</td>`).join("")}</tr>`),`</table></body></html>`].join("");
  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `${filename}.xls`; link.click(); URL.revokeObjectURL(link.href);
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
        <div key={t.id} className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-white text-sm font-semibold shadow-lg animate-[slideIn_0.3s_ease] ${colorMap[t.type]}`}>{iconMap[t.type]} {t.message}</div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  EXPORT DROPDOWN
// ═══════════════════════════════════════════════════════════════
function ExportDropdown({ onCSV, onExcel }: { onCSV: () => void; onExcel: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  const Item = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
    <button onClick={() => { onClick(); setOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left">{icon} {label}</button>
  );
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="inline-flex items-center gap-1.5 font-semibold rounded-lg transition-all cursor-pointer border-0 px-3 py-1.5 text-xs bg-transparent text-muted-foreground hover:bg-muted">
        <Download size={13} /> Laporan <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-xl shadow-lg py-1 z-50 w-48">
          <Item icon={<FileText size={14} className="text-emerald-600" />} label="Export CSV" onClick={onCSV} />
          <Item icon={<FileSpreadsheet size={14} className="text-blue-600" />} label="Export Excel" onClick={onExcel} />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  TYPES & DATA
// ═══════════════════════════════════════════════════════════════
interface StaffKafetaria {
  id: string;
  nama: string;
  dept: string;
  jenis: string;
  kuota: number;
  dipakai: number;
  saldo: string;
}

const JENIS_HARGA: Record<string, number> = {
  "Makan Siang": 15000,
  "Makan Siang + Snack": 25000,
};

const INITIAL_STAFF: StaffKafetaria[] = [
  { id: "STF001", nama: "Dr. Agus Setiawan", dept: "SMF Penyakit Dalam", jenis: "Makan Siang", kuota: 5, dipakai: 3, saldo: "Rp 45.000" },
  { id: "STF002", nama: "Ns. Sari Dewi, S.Kep", dept: "Bangsal Mawar", jenis: "Makan Siang", kuota: 5, dipakai: 5, saldo: "Rp 0" },
  { id: "STF003", nama: "Apt. Budi Hartono", dept: "Instalasi Farmasi", jenis: "Makan Siang", kuota: 5, dipakai: 2, saldo: "Rp 60.000" },
  { id: "STF004", nama: "Ahli Gizi Rina S.", dept: "Instalasi Gizi", jenis: "Makan Siang + Snack", kuota: 6, dipakai: 4, saldo: "Rp 40.000" },
  { id: "STF005", nama: "Sanitarian Hendra P.", dept: "K3RS", jenis: "Makan Siang", kuota: 5, dipakai: 5, saldo: "Rp 0" },
];

// ═══════════════════════════════════════════════════════════════
//  MODALS
// ═══════════════════════════════════════════════════════════════
function StaffFormModal({ mode, initialData, onSave, onCancel }: {
  mode: "create" | "edit"; initialData: StaffKafetaria | null;
  onSave: (data: Omit<StaffKafetaria, "id">) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState({
    nama: initialData?.nama ?? "", dept: initialData?.dept ?? "",
    jenis: initialData?.jenis ?? "Makan Siang", kuota: initialData?.kuota ?? "", dipakai: initialData?.dipakai ?? "0",
  });
  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));
  const isValid = form.nama !== "" && Number(form.kuota) > 0;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSave({ nama: form.nama, dept: form.dept, jenis: form.jenis, kuota: Number(form.kuota), dipakai: Number(form.dipakai || 0) });
  };
  const fc = "w-full px-3.5 py-2.5 rounded-lg border border-border bg-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50";
  const lc = "block text-xs font-semibold text-foreground mb-1.5";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border"><h3 className="font-semibold text-base">{mode === "create" ? "Tambah Staf Baru" : "Edit Data Staf"}</h3><button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X size={16} /></button></div>
        <form onSubmit={submit}>
          <div className="p-5 space-y-4">
            <div><label className={lc}>Nama Lengkap</label><input type="text" className={fc} value={form.nama} onChange={(e) => set("nama", e.target.value)} placeholder="Nama dan gelar" autoFocus /></div>
            <div><label className={lc}>Departemen / Unit</label><input type="text" className={fc} value={form.dept} onChange={(e) => set("dept", e.target.value)} placeholder="cth: Bangsal Mawar" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lc}>Jenis Kuota</label>
                <select className={fc} value={form.jenis} onChange={(e) => set("jenis", e.target.value)}>
                  <option value="Makan Siang">Makan Siang</option>
                  <option value="Makan Siang + Snack">Makan Siang + Snack</option>
                </select>
              </div>
              <div><label className={lc}>Kuota / Minggu (x)</label><input type="number" min="1" className={fc} value={form.kuota} onChange={(e) => set("kuota", e.target.value)} placeholder="5" /></div>
            </div>
            {mode === "edit" && (
              <div><label className={lc}>Dipakai Saat Ini (x)</label><input type="number" min="0" className={fc} value={form.dipakai} onChange={(e) => set("dipakai", e.target.value)} /></div>
            )}
          </div>
          <div className="flex justify-end gap-2 p-4 border-t border-border bg-muted/50 rounded-b-2xl">
            <button type="button" className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors" onClick={onCancel}>Batal</button>
            <button type="submit" disabled={!isValid} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><Plus size={14} /> {mode === "create" ? "Tambah Staf" : "Simpan"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StaffViewModal({ staff, onClose }: { staff: StaffKafetaria; onClose: () => void }) {
  const items = [
    { l: "ID Staf", v: staff.id }, { l: "Nama", v: staff.nama }, { l: "Departemen", v: staff.dept },
    { l: "Jenis Kuota", v: staff.jenis }, { l: "Kuota/Minggu", v: `${staff.kuota}x` },
    { l: "Terpakai", v: `${staff.dipakai}x` }, { l: "Sisa Saldo", v: staff.saldo },
  ];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border"><h3 className="font-semibold text-base">Detail Kuota Staf</h3><button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X size={16} /></button></div>
        <div className="p-5 space-y-3">
          {items.map((item) => (
            <div key={item.l}><div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">{item.l}</div><div className="text-sm font-semibold text-foreground">{item.v}</div></div>
          ))}
        </div>
        <div className="flex justify-end p-4 border-t border-border bg-muted/50 rounded-b-2xl"><button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors">Tutup</button></div>
      </div>
    </div>
  );
}

function StaffConfirmModal({ staff, onConfirm, onCancel }: { staff: StaffKafetaria; onConfirm: () => void; onCancel: () => void; }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4"><AlertTriangle size={28} className="text-red-500" /></div>
          <h4 className="font-bold text-base mb-2">Hapus Staf?</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">Hapus data <strong>{staff.nama}</strong> ({staff.id})?</p>
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
export default function NutKafetaria() {
  const [staff, setStaff] = useState<StaffKafetaria[]>(INITIAL_STAFF);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("Semua");
  const [modal, setModal] = useState<null | "create" | "edit" | "view" | "delete">(null);
  const [selected, setSelected] = useState<StaffKafetaria | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now(); setToasts((p) => [...p, { id, message, type }]); setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }, []);

  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      const matchSearch = search === "" || s.id.toLowerCase().includes(search.toLowerCase()) || s.nama.toLowerCase().includes(search.toLowerCase()) || s.dept.toLowerCase().includes(search.toLowerCase());
      const matchDept = filterDept === "Semua" || s.dept === filterDept;
      return matchSearch && matchDept;
    });
  }, [staff, search, filterDept]);

  // Hitung stat dinamis
  const totalStaff = staff.length;
  const usedToday = staff.reduce((s, st) => s + st.dipakai, 0);
  const totalKuota = staff.reduce((s, st) => s + st.kuota, 0);
  const totalSaldo = staff.reduce((s, st) => {
    const num = parseInt(st.saldo.replace(/\D/g, ""), 10) || 0;
    return s + num;
  }, 0);
  const persenDigunakan = totalKuota > 0 ? ((usedToday / totalKuota) * 100).toFixed(1) + "%" : "0%";

  const openCreate = () => { setSelected(null); setModal("create"); };
  const openEdit = (s: StaffKafetaria) => { setSelected(s); setModal("edit"); };
  const openView = (s: StaffKafetaria) => { setSelected(s); setModal("view"); };
  const openDelete = (s: StaffKafetaria) => { setSelected(s); setModal("delete"); };
  const close = () => { setModal(null); setSelected(null); };

  const handleCreate = (data: Omit<StaffKafetaria, "id">) => {
    const id = "STF" + String(Math.max(...staff.map((s) => parseInt(s.id.replace(/\D/g, ""), 10)), 0) + 1).padStart(3, "0");
    const harga = JENIS_HARGA[data.jenis] || 15000;
    const saldo = `Rp ${((data.kuota - (data.dipakai || 0)) * harga).toLocaleString("id-ID")}`;
    setStaff((p) => [{ ...data, id, saldo }, ...p]);
    close(); showToast(`${data.nama} ditambahkan`);
  };

  const handleUpdate = (data: Omit<StaffKafetaria, "id">) => {
    if (!selected) return;
    const harga = JENIS_HARGA[data.jenis] || 15000;
    setStaff((p) => p.map((s) => s.id === selected.id ? { ...s, ...data, saldo: `Rp ${((data.kuota - data.dipakai) * harga).toLocaleString("id-ID")}` } : s));
    close(); showToast(`${selected.id} diperbarui`);
  };

  const handleDelete = () => {
    if (!selected) return;
    const id = selected.id; setStaff((p) => p.filter((s) => s.id !== id)); close(); showToast(`${id} dihapus`, "danger");
  };

  const handleReset = (s: StaffKafetaria) => {
    const harga = JENIS_HARGA[s.jenis] || 15000;
    setStaff((p) => p.map((st) => st.id === s.id ? { ...st, dipakai: 0, saldo: `Rp ${(st.kuota * harga).toLocaleString("id-ID")}` } : st));
    showToast(`Kuota ${s.id} direset ke 0`, "info");
  };

  const handleExportCSV = () => {
    downloadCSV(filteredStaff.map((s) => ({ "ID Staf": s.id, "Nama": s.nama, "Departemen": s.dept, "Jenis Kuota": s.jenis, "Kuota/Minggu": s.kuota, "Terpakai": s.dipakai, "Sisa Saldo": s.saldo })), "Laporan_Kuota_Kafetaria");
    showToast("Laporan dieksport ke CSV");
  };
  const handleExportExcel = () => {
    downloadExcel(filteredStaff.map((s) => ({ "ID Staf": s.id, "Nama": s.nama, "Departemen": s.dept, "Jenis Kuota": s.jenis, "Kuota/Minggu": s.kuota, "Terpakai": s.dipakai, "Sisa Saldo": s.saldo })), "Laporan_Kuota_Kafetaria");
    showToast("Laporan dieksport ke Excel");
  };

  const canReset = (s: StaffKafetaria) => s.dipakai > 0;

  // Daftar departemen unik untuk filter (dari data, bukan hardcode)
  const departments = useMemo(() => {
    const depts = new Set(staff.map((s) => s.dept));
    return ["Semua", ...Array.from(depts)];
  }, [staff]);

  return (
    <div className="p-6 space-y-5">
      {/* ═══ HEADER (TIDAK DIUBAH STRUKTUR) ═══ */}
      <PageHeader title="Kuota Makanan Kafetaria Staff" breadcrumbs={["Modul 17 – Nutrisi", "Kuota Kafetaria Staff"]}>
        <div className="flex gap-2">
          <ExportDropdown onCSV={handleExportCSV} onExcel={handleExportExcel} />
          <Btn size="sm" onClick={openCreate}><Plus size={13} /> Tambah Staf</Btn>
        </div>
      </PageHeader>

      {/* ═══ STAT CARDS (TIDAK DIUBAH STRUKTUR, nilai sekarang dinamis) ═══ */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Staf Terdaftar" value={totalStaff} sub="penerima kuota makan" icon={User} color={C.teal} />
        <StatCard label="Digunakan Hari Ini" value={usedToday} sub={`dari ${totalKuota} kuota`} icon={Utensils} color={C.green} trend={persenDigunakan} />
        <StatCard label="Nilai Konsumsi Hari Ini" value={`Rp ${(totalSaldo / 1000).toFixed(1)} J`} sub="anggaran Rp 8 Jt/hari" icon={TrendingUp} color={C.blue} />
      </div>

      {/* ═══ TABEL (TIDAK DIUBAH STRUKTUR) ═══ */}
      <SectionCard
        title="Daftar Kuota Staf"
        actions={
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Cari staf..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-52" />
            </div>
            <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="px-3 py-1.5 text-xs border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
              {departments.map(d => <option key={d} value={d}>{d === "Semua" ? "Semua Dept" : d}</option>)}
            </select>
            <span className="text-xs text-muted-foreground"><strong className="text-foreground">{filteredStaff.length}</strong> / {staff.length}</span>
          </div>
        }
      >
        <TableWrapper>
          <thead><tr><Th>ID Staf</Th><Th>Nama</Th><Th>Departemen</Th><Th>Jenis Kuota</Th><Th>Kuota/Minggu</Th><Th>Terpakai</Th><Th>Saldo</Th><Th>Aksi</Th></tr></thead>
          <tbody>
            {filteredStaff.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-12 text-sm text-muted-foreground">Tidak ada data ditemukan</td></tr>
            ) : (
              filteredStaff.map(s => (
                <tr key={s.id} className="hover:bg-muted/40">
                  <Td mono>{s.id}</Td>
                  <Td><span className="font-medium">{s.nama}</span></Td>
                  <Td><span className="text-xs">{s.dept}</span></Td>
                  <Td>{s.jenis}</Td>
                  <Td mono>{s.kuota}x</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <ProgressBar value={s.dipakai} max={s.kuota} color={s.dipakai >= s.kuota ? C.red : C.green} />
                      <span className="text-xs font-mono">{s.dipakai}/{s.kuota}</span>
                    </div>
                  </Td>
                  <Td mono>{s.saldo}</Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openView(s)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors" title="Lihat Detail"><Eye size={14} /></button>
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-amber-50 text-amber-600 transition-colors" title="Edit"><Pencil size={14} /></button>
                      {canReset(s) && (
                        <button onClick={() => handleReset(s)} className="p-1.5 rounded hover:bg-sky-50 text-sky-600 transition-colors" title="Reset Kuota"><RotateCcw size={14} /></button>
                      )}
                      <button onClick={() => openDelete(s)} className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors" title="Hapus"><Trash2 size={14} /></button>
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </TableWrapper>
      </SectionCard>

      {/* ═══ MODALS ═══ */}
      {modal === "create" && <StaffFormModal mode="create" initialData={null} onSave={handleCreate} onCancel={close} />}
      {modal === "edit" && selected && <StaffFormModal mode="edit" initialData={selected} onSave={handleUpdate} onCancel={close} />}
      {modal === "view" && selected && <StaffViewModal staff={selected} onClose={close} />}
      {modal === "delete" && selected && <StaffConfirmModal staff={selected} onConfirm={handleDelete} onCancel={close} />}

      <ToastContainer toasts={toasts} />
    </div>
  );
}