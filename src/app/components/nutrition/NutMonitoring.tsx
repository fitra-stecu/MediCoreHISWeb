// src/app/components/nutrition/NutMonitoring.tsx

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  ChevronRight, Download, Plus, Filter, Search,
  X, AlertTriangle, CheckCircle, Info, Eye, Pencil, Trash2,
  ChevronDown, Ban, FileSpreadsheet, FileText,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════
//  UI PRIMITIVES (STANDALONE)
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
    outline: "border border-border bg-white text-foreground hover:bg-muted",
    danger: "bg-red-600 text-white hover:bg-red-700",
    warning: "bg-amber-500 text-white hover:bg-amber-600",
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
    aktif: "bg-emerald-100 text-emerald-700",
    danger: "bg-red-100 text-red-700",
    warning: "bg-amber-100 text-amber-700",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${cls[variant] || cls.default}`}>{children}</span>;
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
        <Download size={13} /> Export <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
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
interface PatientNutr {
  id: string;
  nama: string;
  usia: number;
  kamar: string;
  dx: string;
  kal: number;
  prot: number;
  status: "sesuai" | "defisit" | "surplus";
}

const INITIAL_PATIENTS: PatientNutr[] = [
  { id: "RM-0891", nama: "Agus Salim", usia: 45, kamar: "Melati 201", dx: "Stroke Iskemik", kal: 1800, prot: 65, status: "sesuai" },
  { id: "RM-0903", nama: "Sri Rahayu", usia: 32, kamar: "Mawar 105", dx: "Gestational Diabetes", kal: 1500, prot: 55, status: "defisit" },
  { id: "RM-0915", nama: "Bambang S.", usia: 58, kamar: "Melati 203", dx: "DM Tipe 2", kal: 2200, prot: 80, status: "sesuai" },
  { id: "RM-0922", nama: "Rini P.", usia: 27, kamar: "Anggrek 301", dx: "Post-Op Apendisitis", kal: 1200, prot: 45, status: "surplus" },
  { id: "RM-0934", nama: "Dewi A.", usia: 50, kamar: "Teratai 102", dx: "Ca Mammae", kal: 1600, prot: 60, status: "defisit" },
];

// ═══════════════════════════════════════════════════════════════
//  MODALS
// ═══════════════════════════════════════════════════════════════
function PatientFormModal({ mode, initialData, onSave, onCancel }: {
  mode: "create" | "edit"; initialData: PatientNutr | null;
  onSave: (data: Omit<PatientNutr, "id">) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState({
    nama: initialData?.nama ?? "", usia: initialData?.usia ?? "", kamar: initialData?.kamar ?? "",
    dx: initialData?.dx ?? "", kal: initialData?.kal ?? "", prot: initialData?.prot ?? "", status: initialData?.status ?? "sesuai",
  });
  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));
  const isValid = form.nama !== "" && Number(form.usia) > 0 && Number(form.kal) > 0 && Number(form.prot) > 0;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSave({ nama: form.nama, usia: Number(form.usia), kamar: form.kamar, dx: form.dx, kal: Number(form.kal), prot: Number(form.prot), status: form.status as PatientNutr["status"] });
  };
  const fc = "w-full px-3.5 py-2.5 rounded-lg border border-border bg-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50";
  const lc = "block text-xs font-semibold text-foreground mb-1.5";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border"><h3 className="font-semibold text-base">{mode === "create" ? "Tambah Pasien Baru" : "Edit Data Pasien"}</h3><button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X size={16} /></button></div>
        <form onSubmit={submit}>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lc}>Nama Pasien</label><input type="text" className={fc} value={form.nama} onChange={(e) => set("nama", e.target.value)} placeholder="Nama lengkap" autoFocus /></div>
              <div><label className={lc}>Usia (thn)</label><input type="number" min="0" className={fc} value={form.usia} onChange={(e) => set("usia", e.target.value)} placeholder="45" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lc}>Kamar</label><input type="text" className={fc} value={form.kamar} onChange={(e) => set("kamar", e.target.value)} placeholder="Melati 201" /></div>
              <div><label className={lc}>Diagnosis</label><input type="text" className={fc} value={form.dx} onChange={(e) => set("dx", e.target.value)} placeholder="Diagnosis utama" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lc}>Target Kalori (kcal)</label><input type="number" min="0" className={fc} value={form.kal} onChange={(e) => set("kal", e.target.value)} placeholder="1800" /></div>
              <div><label className={lc}>Target Protein (g)</label><input type="number" min="0" className={fc} value={form.prot} onChange={(e) => set("prot", e.target.value)} placeholder="65" /></div>
            </div>
            <div>
              <label className={lc}>Status Nutrisi</label>
              <select className={fc} value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="sesuai">Sesuai</option>
                <option value="defisit">Defisit</option>
                <option value="surplus">Surplus</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 p-4 border-t border-border bg-muted/50 rounded-b-2xl">
            <button type="button" className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors" onClick={onCancel}>Batal</button>
            <button type="submit" disabled={!isValid} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><Plus size={14} /> {mode === "create" ? "Tambah Pasien" : "Simpan"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PatientViewModal({ patient, onClose }: { patient: PatientNutr; onClose: () => void }) {
  const items = [
    { l: "No. Rekam Medis", v: patient.id }, { l: "Nama Pasien", v: patient.nama }, { l: "Usia", v: `${patient.usia} tahun` },
    { l: "Kamar", v: patient.kamar }, { l: "Diagnosis", v: patient.dx }, { l: "Target Kalori", v: `${patient.kal.toLocaleString()} kkal` },
    { l: "Target Protein", v: `${patient.prot} gram` }, { l: "Status Nutrisi", v: patient.status.charAt(0).toUpperCase() + patient.status.slice(1) },
  ];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border"><h3 className="font-semibold text-base">Detail Pasien</h3><button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X size={16} /></button></div>
        <div className="p-5 space-y-3">
          {items.map((item) => (
            <div key={item.l}>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">{item.l}</div>
              <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                {item.v}
                {item.l === "Status Nutrisi" && <Badge variant={patient.status === "sesuai" ? "aktif" : patient.status === "defisit" ? "danger" : "warning"}>{item.v}</Badge>}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end p-4 border-t border-border bg-muted/50 rounded-b-2xl"><button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors">Tutup</button></div>
      </div>
    </div>
  );
}

function PatientConfirmModal({ type, patient, onConfirm, onCancel }: { type: "delete" | "cancel"; patient: PatientNutr; onConfirm: () => void; onCancel: () => void; }) {
  const isDelete = type === "delete";
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${isDelete ? "bg-red-50" : "bg-amber-50"}`}>{isDelete ? <AlertTriangle size={28} className="text-red-500" /> : <Ban size={28} className="text-amber-500" />}</div>
          <h4 className="font-bold text-base mb-2">{isDelete ? "Hapus Pasien?" : "Hapus Monitoring?"}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{isDelete ? <>Hapus data <strong>{patient.nama} ({patient.id})</strong> dari daftar?</> : <>Hapus monitoring <strong>{patient.nama} ({patient.id})</strong>?</>}</p>
        </div>
        <div className="flex justify-center gap-2 p-4 border-t border-border bg-muted/50 rounded-b-2xl">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors">Batal</button>
          <button onClick={onConfirm} className={`px-4 py-2 text-sm font-semibold rounded-lg text-white transition-colors ${isDelete ? "bg-red-600 hover:bg-red-700" : "bg-amber-500 hover:bg-amber-600"}`}>Ya, Hapus</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  KOMPONEN UTAMA
// ═══════════════════════════════════════════════════════════════
export default function NutMonitoring() {
  const [patients, setPatients] = useState<PatientNutr[]>(INITIAL_PATIENTS);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [modal, setModal] = useState<null | "create" | "edit" | "view" | "delete">(null);
  const [selected, setSelected] = useState<PatientNutr | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now(); setToasts((p) => [...p, { id, message, type }]); setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }, []);

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchSearch = search === "" || p.id.toLowerCase().includes(search.toLowerCase()) || p.nama.toLowerCase().includes(search.toLowerCase()) || p.dx.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "Semua" || p.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [patients, search, filterStatus]);

  const openCreate = () => { setSelected(null); setModal("create"); };
  const openEdit = (p: PatientNutr) => { setSelected(p); setModal("edit"); };
  const openView = (p: PatientNutr) => { setSelected(p); setModal("view"); };
  const openDelete = (p: PatientNutr) => { setSelected(p); setModal("delete"); };
  const close = () => { setModal(null); setSelected(null); };

  const handleCreate = (data: Omit<PatientNutr, "id">) => {
    const id = "RM-" + String(Math.max(...patients.map((p) => parseInt(p.id.replace(/\D/g, ""), 10)), 0) + 1).padStart(4, "0");
    setPatients((p) => [{ ...data, id }, ...p]); close(); showToast(`${data.nama} (${id}) ditambahkan`);
  };
  const handleUpdate = (data: Omit<PatientNutr, "id">) => {
    if (!selected) return; setPatients((p) => p.map((pl) => pl.id === selected.id ? { ...pl, ...data } : pl)); close(); showToast(`Data ${selected.id} diperbarui`);
  };
  const handleDelete = () => {
    if (!selected) return; const id = selected.id; setPatients((p) => p.filter((pl) => pl.id !== id)); close(); showToast(`${id} dihapus`, "danger");
  };

  const handleExportCSV = () => {
    downloadCSV(filteredPatients.map((p) => ({ "No RM": p.id, "Nama Pasien": p.nama, Usia: p.usia, Kamar: p.kamar, Diagnosis: p.dx, "Target Kalori": p.kal, "Target Protein": p.prot, "Status Nutrisi": p.status })), "Monitoring_Nutrisi_Pasien");
    showToast("Data dieksport ke CSV");
  };
  const handleExportExcel = () => {
    downloadExcel(filteredPatients.map((p) => ({ "No RM": p.id, "Nama Pasien": p.nama, Usia: p.usia, Kamar: p.kamar, Diagnosis: p.dx, "Target Kalori": p.kal, "Target Protein": p.prot, "Status Nutrisi": p.status })), "Monitoring_Nutrisi_Pasien");
    showToast("Data dieksport ke Excel");
  };

  // Alias data agar kode lama tetap bisa dipakai tanpa diubah
  const patientNutrData = filteredPatients;

  return (
    <div className="p-6 space-y-5">
      {/* ═══ HEADER (TIDAK DIUBAH STRUKTUR, hanya di-wiring) ═══ */}
      <PageHeader title="Monitoring Nutrisi Pasien" breadcrumbs={["Modul 17 – Nutrisi", "Monitoring Nutrisi Pasien"]}>
        <div className="flex gap-2">
          <ExportDropdown onCSV={handleExportCSV} onExcel={handleExportExcel} />
          <Btn size="sm" onClick={openCreate}><Plus size={13} /> Tambah Pasien</Btn>
        </div>
      </PageHeader>
      
      {/* ═══ SEARCH & FILTER (TIDAK DIUBAH STRUKTUR, hanya di-wiring) ═══ */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari pasien..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 text-sm border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-64"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="Semua">Filter Status</option>
          <option value="sesuai">Sesuai</option>
          <option value="defisit">Defisit</option>
          <option value="surplus">Surplus</option>
        </select>
      </div>

      {/* ═══ TABEL (TIDAK DIUBAH SAMA SEKALI) ═══ */}
      <SectionCard title="Daftar Pasien Terpantau" actions={<span className="text-xs text-muted-foreground">Menampilkan <strong className="text-foreground">{patientNutrData.length}</strong> dari <strong className="text-foreground">{patients.length}</strong></span>}>
        <TableWrapper>
          <thead><tr><Th>No. RM</Th><Th>Nama Pasien</Th><Th>Usia</Th><Th>Kamar</Th><Th>Diagnosis</Th><Th>Target Kalori</Th><Th>Target Protein</Th><Th>Status Nutrisi</Th><Th>Aksi</Th></tr></thead>
          <tbody>
            {patientNutrData.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-12 text-sm text-muted-foreground">Tidak ada pasien ditemukan</td></tr>
            ) : (
              patientNutrData.map(p => (
                <tr key={p.id} className="hover:bg-muted/40">
                  <Td mono>{p.id}</Td>
                  <Td><span className="font-medium">{p.nama}</span></Td>
                  <Td mono>{p.usia} thn</Td>
                  <Td><Badge>{p.kamar}</Badge></Td>
                  <Td>{p.dx}</Td>
                  <Td mono>{p.kal.toLocaleString()} kkal</Td>
                  <Td mono>{p.prot} g</Td>
                  <Td>
                    <Badge variant={p.status === "sesuai" ? "aktif" : p.status === "defisit" ? "danger" : "warning"}>
                      {p.status}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openView(p)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors" title="Lihat"><Eye size={14} /></button>
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-amber-50 text-amber-600 transition-colors" title="Edit"><Pencil size={14} /></button>
                      <button onClick={() => openDelete(p)} className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors" title="Hapus"><Trash2 size={14} /></button>
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </TableWrapper>
      </SectionCard>

      {/* ═══ MODALS ═══ */}
      {modal === "create" && <PatientFormModal mode="create" initialData={null} onSave={handleCreate} onCancel={close} />}
      {modal === "edit" && selected && <PatientFormModal mode="edit" initialData={selected} onSave={handleUpdate} onCancel={close} />}
      {modal === "view" && selected && <PatientViewModal patient={selected} onClose={close} />}
      {modal === "delete" && selected && <PatientConfirmModal type="delete" patient={selected} onConfirm={handleDelete} onCancel={close} />}

      <ToastContainer toasts={toasts} />
    </div>
  );
}