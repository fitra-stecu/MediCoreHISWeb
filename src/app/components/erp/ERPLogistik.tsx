// src/app/components/erp/ERPLogistik.tsx

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  ChevronRight, Download, Plus, Filter, Search,
  X, AlertTriangle, CheckCircle, Info, Eye, Pencil, Trash2,
  ChevronDown, Ban, FileSpreadsheet, FileText, Send,
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

function Badge({ variant = "default", children, className = "" }: { variant?: string; children: React.ReactNode; className?: string }) {
  const cls: Record<string, string> = {
    default: "bg-blue-100 text-blue-700",
    warning: "bg-amber-100 text-amber-700",
    aktif: "bg-emerald-100 text-emerald-700",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${cls[variant] || cls.default} ${className}`}>{children}</span>;
}

function CrudActions() {
  return (
    <div className="flex items-center gap-1">
      <button className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors" title="Lihat"><Eye size={14} /></button>
      <button className="p-1.5 rounded hover:bg-amber-50 text-amber-600 transition-colors" title="Edit"><Pencil size={14} /></button>
      <button className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors" title="Hapus"><Trash2 size={14} /></button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  EXPORT UTILS
// ═══════════════════════════════════════════════════════════════
function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((h) => {
        const val = String(row[h] ?? "");
        return val.includes(",") || val.includes('"') || val.includes("\n") ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(",")
    ),
  ];
  const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function downloadExcel(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const html = [
    `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">`,
    `<head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Sheet1</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>`,
    `<body><table border="1">`,
    `<tr>${headers.map((h) => `<th style="background:#f0f0f0;font-weight:bold;">${h}</th>`).join("")}</tr>`,
    ...data.map((row) => `<tr>${headers.map((h) => `<td style="mso-number-format:'\\@';">${row[h] ?? ""}</td>`).join("")}</tr>`),
    `</table></body></html>`,
  ].join("");
  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.xls`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// ═══════════════════════════════════════════════════════════════
//  TYPES & DATA
// ═══════════════════════════════════════════════════════════════
interface Permintaan {
  id: string;
  itemId: string;
  itemName: string;
  kategori: string;
  qty: number;
  satuan: string;
  prioritas: "Rendah" | "Sedang" | "Tinggi";
  status: "Draft" | "Diajukan" | "Disetujui" | "Ditolak" | "Dibatalkan";
  tanggal: string;
  catatan: string;
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "info" | "danger" | "warning";
}

const INITIAL_PERMINTAAN: Permintaan[] = [
  { id: "REQ-2025-001", itemId: "MED003", itemName: "Spuit 3cc (100/box)", kategori: "Alkes", qty: 50, satuan: "Box", prioritas: "Tinggi", status: "Diajukan", tanggal: "2025-01-15", catatan: "Stok mendekati batas minimum, perlu segera diadakan" },
  { id: "REQ-2025-002", itemId: "ATK001", itemName: "Kertas HVS A4 80gr", kategori: "ATK", qty: 30, satuan: "Rim", prioritas: "Sedang", status: "Draft", tanggal: "2025-01-16", catatan: "Persediaan untuk 2 bulan ke depan" },
  { id: "REQ-2025-003", itemId: "UMM001", itemName: "Detergen Sabun Cair 5L", kategori: "Umum", qty: 15, satuan: "Botol", prioritas: "Rendah", status: "Disetujui", tanggal: "2025-01-10", catatan: "Pengadaan rutin bulanan" },
  { id: "REQ-2025-004", itemId: "MED002", itemName: "Masker Bedah 3 Ply (50/box)", kategori: "Alkes", qty: 40, satuan: "Box", prioritas: "Tinggi", status: "Diajukan", tanggal: "2025-01-17", catatan: "Kebutuhan mendesak untuk IGD dan ruang operasi" },
];

// ═══════════════════════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════════════════════
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

function SBadge({ children, variant }: { children: React.ReactNode; variant: string }) {
  const cls: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600", diajukan: "bg-blue-100 text-blue-700",
    disetujui: "bg-emerald-100 text-emerald-700", ditolak: "bg-red-100 text-red-700",
    dibatalkan: "bg-gray-200 text-gray-500 line-through", tinggi: "bg-red-100 text-red-700",
    sedang: "bg-amber-100 text-amber-700", rendah: "bg-sky-100 text-sky-700",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${cls[variant] || "bg-gray-100 text-gray-600"}`}>{children}</span>;
}

// ═══════════════════════════════════════════════════════════════
//  EXPORT DROPDOWN
// ═══════════════════════════════════════════════════════════════
function ExportDropdown({ onExportInvCSV, onExportInvExcel, onExportReqCSV, onExportReqExcel }: {
  onExportInvCSV: () => void; onExportInvExcel: () => void; onExportReqCSV: () => void; onExportReqExcel: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const Item = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
    <button onClick={() => { onClick(); setOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left">{icon} {label}</button>
  );

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="inline-flex items-center gap-1.5 font-semibold rounded-lg transition-all cursor-pointer border-0 px-4 py-2 text-sm bg-transparent text-muted-foreground hover:bg-muted">
        <Download size={13} /> Export <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-xl shadow-lg py-1 z-50 w-60">
          <div className="px-4 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Inventori</div>
          <Item icon={<FileText size={14} className="text-emerald-600" />} label="Export Inventori (CSV)" onClick={onExportInvCSV} />
          <Item icon={<FileSpreadsheet size={14} className="text-blue-600" />} label="Export Inventori (Excel)" onClick={onExportInvExcel} />
          <div className="border-t border-border my-1" />
          <div className="px-4 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Permintaan Pengadaan</div>
          <Item icon={<FileText size={14} className="text-emerald-600" />} label="Export Permintaan (CSV)" onClick={onExportReqCSV} />
          <Item icon={<FileSpreadsheet size={14} className="text-blue-600" />} label="Export Permintaan (Excel)" onClick={onExportReqExcel} />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODALS
// ═══════════════════════════════════════════════════════════════
function PermintaanFormModal({ mode, initialData, inventoryItems, onSave, onCancel }: {
  mode: "create" | "edit"; initialData: Permintaan | null;
  inventoryItems: { id: string; nama: string; kat: string; satuan: string; stok: number; min: number }[];
  onSave: (data: Omit<Permintaan, "id" | "status" | "tanggal">) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState({ itemId: initialData?.itemId ?? "", qty: initialData?.qty ?? "", prioritas: initialData?.prioritas ?? "Sedang", catatan: initialData?.catatan ?? "" });
  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  const selectedItem = inventoryItems.find((i) => i.id === form.itemId);
  const isValid = form.itemId !== "" && Number(form.qty) > 0 && Number(form.qty) <= 9999;
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (!isValid || !selectedItem) return; onSave({ itemId: form.itemId, itemName: selectedItem.nama, kategori: selectedItem.kat, qty: Number(form.qty), satuan: selectedItem.satuan, prioritas: form.prioritas as Permintaan["prioritas"], catatan: form.catatan }); };
  const fc = "w-full px-3.5 py-2.5 rounded-lg border border-border bg-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50";
  const lc = "block text-xs font-semibold text-foreground mb-1.5";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border"><h3 className="font-semibold text-base">{mode === "create" ? "Buat Permintaan Baru" : "Edit Permintaan"}</h3><button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X size={16} /></button></div>
        <form onSubmit={submit}>
          <div className="p-5 space-y-4">
            <div><label className={lc}>Pilih Item Inventori</label><select className={fc} value={form.itemId} onChange={(e) => set("itemId", e.target.value)} autoFocus><option value="">— Pilih Item —</option>{inventoryItems.map((item) => (<option key={item.id} value={item.id}>{item.id} — {item.nama} (stok: {item.stok})</option>))}</select></div>
            {selectedItem && (<div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 space-y-1"><div><span className="font-bold">Kategori:</span> {selectedItem.kat}</div><div><span className="font-bold">Satuan:</span> {selectedItem.satuan}</div><div><span className="font-bold">Stok saat ini:</span> {selectedItem.stok} {selectedItem.satuan.toLowerCase()}</div>{selectedItem.stok <= selectedItem.min && (<div className="text-amber-700 font-semibold">⚠ Stok di bawah batas minimum ({selectedItem.min})</div>)}</div>)}
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lc}>Jumlah</label><input type="number" min="1" max="9999" className={fc} value={form.qty} onChange={(e) => set("qty", e.target.value)} placeholder="cth: 50" /></div>
              <div><label className={lc}>Prioritas</label><select className={fc} value={form.prioritas} onChange={(e) => set("prioritas", e.target.value)}><option value="Rendah">Rendah</option><option value="Sedang">Sedang</option><option value="Tinggi">Tinggi</option></select></div>
            </div>
            <div><label className={lc}>Catatan</label><textarea className={fc + " min-h-[80px] resize-none"} value={form.catatan} onChange={(e) => set("catatan", e.target.value)} placeholder="Alasan pengadaan, kebutuhan mendesak, dll." /></div>
            {isValid && selectedItem && (<div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg"><div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Preview</div><div className="text-xs text-emerald-800"><span className="font-mono font-bold">{mode === "create" ? "REQ-2025-" + String(Math.max(...INITIAL_PERMINTAAN.map((p) => parseInt(p.id.replace(/\D/g, ""), 10))) + 1).padStart(3, "0") : initialData?.id}</span>{" "}— {selectedItem.nama} ({form.qty} {selectedItem.satuan.toLowerCase()}, prioritas {form.prioritas})</div></div>)}
          </div>
          <div className="flex justify-end gap-2 p-4 border-t border-border bg-muted/50 rounded-b-2xl">
            <button type="button" className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors" onClick={onCancel}>Batal</button>
            <button type="submit" disabled={!isValid} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><Plus size={14} /> {mode === "create" ? "Buat Permintaan" : "Simpan Perubahan"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PermintaanViewModal({ permintaan, onClose }: { permintaan: Permintaan; onClose: () => void }) {
  const items = [
    { l: "ID Permintaan", v: permintaan.id }, { l: "ID Item", v: permintaan.itemId }, { l: "Nama Item", v: permintaan.itemName },
    { l: "Kategori", v: permintaan.kategori }, { l: "Jumlah", v: `${permintaan.qty} ${permintaan.satuan.toLowerCase()}` },
    { l: "Prioritas", v: permintaan.prioritas }, { l: "Status", v: permintaan.status }, { l: "Tanggal", v: permintaan.tanggal }, { l: "Catatan", v: permintaan.catatan || "—" },
  ];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border"><h3 className="font-semibold text-base">Detail Permintaan</h3><button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X size={16} /></button></div>
        <div className="p-5 space-y-3">
          {items.map((item) => (
            <div key={item.l}>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">{item.l}</div>
              <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                {item.v}
                {item.l === "Status" && <SBadge variant={permintaan.status.toLowerCase()}>{permintaan.status}</SBadge>}
                {item.l === "Prioritas" && <SBadge variant={permintaan.prioritas.toLowerCase()}>{permintaan.prioritas}</SBadge>}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end p-4 border-t border-border bg-muted/50 rounded-b-2xl"><button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors">Tutup</button></div>
      </div>
    </div>
  );
}

function PermintaanConfirmModal({ type, permintaan, onConfirm, onCancel }: { type: "delete" | "cancel"; permintaan: Permintaan; onConfirm: () => void; onCancel: () => void; }) {
  const isDelete = type === "delete";
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${isDelete ? "bg-red-50" : "bg-amber-50"}`}>{isDelete ? <AlertTriangle size={28} className="text-red-500" /> : <Ban size={28} className="text-amber-500" />}</div>
          <h4 className="font-bold text-base mb-2">{isDelete ? "Hapus Permintaan?" : "Batalkan Permintaan?"}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{isDelete ? (<>Anda akan menghapus <strong>{permintaan.id}</strong> ({permintaan.itemName}). Tindakan ini tidak bisa dibatalkan.</>) : (<>Anda akan membatalkan <strong>{permintaan.id}</strong> ({permintaan.itemName}). Status akan berubah menjadi <strong>Dibatalkan</strong>.</>)}</p>
        </div>
        <div className="flex justify-center gap-2 p-4 border-t border-border bg-muted/50 rounded-b-2xl">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors">Batal</button>
          <button onClick={onConfirm} className={`px-4 py-2 text-sm font-semibold rounded-lg text-white transition-colors ${isDelete ? "bg-red-600 hover:bg-red-700" : "bg-amber-500 hover:bg-amber-600"}`}>Ya, {isDelete ? "Hapus" : "Batalkan"}</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  KOMPONEN UTAMA
// ═══════════════════════════════════════════════════════════════
export default function ERPLogistik() {
  const items = [
    { id: "ATK001", nama: "Kertas HVS A4 80gr", kat: "ATK", satuan: "Rim", stok: 45, min: 20, nilai: "Rp 65.000/rim", supplier: "CV Indo Makmur" },
    { id: "ATK002", nama: "Toner Printer HP LaserJet", kat: "ATK", satuan: "Pcs", stok: 8, min: 5, nilai: "Rp 320.000/pcs", supplier: "CV Indo Makmur" },
    { id: "MED001", nama: "Sarung Tangan Latex S (100/box)", kat: "Alkes", satuan: "Box", stok: 120, min: 50, nilai: "Rp 85.000/box", supplier: "PT Rajawali" },
    { id: "MED002", nama: "Masker Bedah 3 Ply (50/box)", kat: "Alkes", satuan: "Box", stok: 85, min: 40, nilai: "Rp 45.000/box", supplier: "PT Rajawali" },
    { id: "MED003", nama: "Spuit 3cc (100/box)", kat: "Alkes", satuan: "Box", stok: 32, min: 30, nilai: "Rp 125.000/box", supplier: "PT Enseval" },
    { id: "UMM001", nama: "Detergen Sabun Cair 5L", kat: "Umum", satuan: "Botol", stok: 28, min: 20, nilai: "Rp 55.000/botol", supplier: "PT Propan" },
  ];

  const [permintaan, setPermintaan] = useState<Permintaan[]>(INITIAL_PERMINTAAN);
  const [reqSearch, setReqSearch] = useState("");
  const [reqFilterStatus, setReqFilterStatus] = useState("Semua");
  const [modal, setModal] = useState<null | "create" | "edit" | "view" | "delete" | "cancel">(null);
  const [selected, setSelected] = useState<Permintaan | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [invSearch, setInvSearch] = useState("");
  const [invFilterKat, setInvFilterKat] = useState("Semua");

  const showToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      const matchSearch = invSearch === "" || 
        i.id.toLowerCase().includes(invSearch.toLowerCase()) || 
        i.nama.toLowerCase().includes(invSearch.toLowerCase());
      const matchKat = invFilterKat === "Semua" || i.kat === invFilterKat;
      return matchSearch && matchKat;
    });
  }, [items, invSearch, invFilterKat]);

  const filteredPermintaan = useMemo(() => {
    return permintaan.filter((p) => {
      const matchSearch = reqSearch === "" || p.id.toLowerCase().includes(reqSearch.toLowerCase()) || p.itemName.toLowerCase().includes(reqSearch.toLowerCase()) || p.kategori.toLowerCase().includes(reqSearch.toLowerCase());
      const matchStatus = reqFilterStatus === "Semua" || p.status === reqFilterStatus;
      return matchSearch && matchStatus;
    });
  }, [permintaan, reqSearch, reqFilterStatus]);

  const reqDraft = permintaan.filter((p) => p.status === "Draft").length;
  const reqDiajukan = permintaan.filter((p) => p.status === "Diajukan").length;
  const reqSelesai = permintaan.filter((p) => p.status === "Disetujui" || p.status === "Ditolak").length;

  const generateReqId = () => {
    if (permintaan.length === 0) return "REQ-2025-001";
    const nums = permintaan.map((p) => parseInt(p.id.replace(/\D/g, ""), 10));
    return "REQ-2025-" + String(Math.max(...nums) + 1).padStart(3, "0");
  };

  const openCreate = () => { setSelected(null); setModal("create"); };
  const openEdit = (p: Permintaan) => { setSelected(p); setModal("edit"); };
  const openView = (p: Permintaan) => { setSelected(p); setModal("view"); };
  const openDelete = (p: Permintaan) => { setSelected(p); setModal("delete"); };
  const openCancel = (p: Permintaan) => { setSelected(p); setModal("cancel"); };
  const close = () => { setModal(null); setSelected(null); };

  const handleCreate = (data: Omit<Permintaan, "id" | "status" | "tanggal">) => {
    const newReq: Permintaan = { id: generateReqId(), ...data, status: "Draft", tanggal: new Date().toISOString().split("T")[0] };
    setPermintaan((prev) => [newReq, ...prev]); close(); showToast(`Permintaan ${newReq.id} dibuat — ${data.itemName}`);
  };
  const handleUpdate = (data: Omit<Permintaan, "id" | "status" | "tanggal">) => {
    if (!selected) return; setPermintaan((prev) => prev.map((p) => (p.id === selected.id ? { ...p, ...data } : p))); close(); showToast(`Permintaan ${selected.id} diperbarui`);
  };
  const handleDelete = () => {
    if (!selected) return; const id = selected.id; setPermintaan((prev) => prev.filter((p) => p.id !== id)); close(); showToast(`Permintaan ${id} dihapus`, "danger");
  };
  const handleCancel = () => {
    if (!selected) return; const id = selected.id; setPermintaan((prev) => prev.map((p) => (p.id === id ? { ...p, status: "Dibatalkan" as const } : p))); close(); showToast(`Permintaan ${id} dibatalkan`, "warning");
  };
  const handleAjukan = (p: Permintaan) => {
    setPermintaan((prev) => prev.map((item) => (item.id === p.id ? { ...item, status: "Diajukan" as const } : item))); showToast(`Permintaan ${p.id} diajukan`, "info");
  };

  const handleExportInvCSV = () => { downloadCSV(items.map((i) => ({ ID: i.id, "Nama Item": i.nama, Kategori: i.kat, Stok: i.stok, Minimum: i.min, Satuan: i.satuan, "Harga Satuan": i.nilai, Supplier: i.supplier })), "Inventori_Logistik"); showToast("Inventori dieksport ke CSV", "success"); };
  const handleExportInvExcel = () => { downloadExcel(items.map((i) => ({ ID: i.id, "Nama Item": i.nama, Kategori: i.kat, Stok: i.stok, Minimum: i.min, Satuan: i.satuan, "Harga Satuan": i.nilai, Supplier: i.supplier })), "Inventori_Logistik"); showToast("Inventori dieksport ke Excel", "success"); };
  const handleExportReqCSV = () => { downloadCSV(permintaan.map((p) => ({ "ID Permintaan": p.id, "ID Item": p.itemId, "Nama Item": p.itemName, Kategori: p.kategori, Jumlah: p.qty, Satuan: p.satuan, Prioritas: p.prioritas, Status: p.status, Tanggal: p.tanggal, Catatan: p.catatan })), "Permintaan_Pengadaan"); showToast("Permintaan dieksport ke CSV", "success"); };
  const handleExportReqExcel = () => { downloadExcel(permintaan.map((p) => ({ "ID Permintaan": p.id, "ID Item": p.itemId, "Nama Item": p.itemName, Kategori: p.kategori, Jumlah: p.qty, Satuan: p.satuan, Prioritas: p.prioritas, Status: p.status, Tanggal: p.tanggal, Catatan: p.catatan })), "Permintaan_Pengadaan"); showToast("Permintaan dieksport ke Excel", "success"); };

  const canEdit = (p: Permintaan) => p.status === "Draft";
  const canDelete = (p: Permintaan) => p.status === "Draft";
  const canAjukan = (p: Permintaan) => p.status === "Draft";
  const canCancel = (p: Permintaan) => p.status === "Draft" || p.status === "Diajukan";
  const isFinal = (p: Permintaan) => p.status === "Disetujui" || p.status === "Ditolak" || p.status === "Dibatalkan";

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Pengadaan Logistik & ATK" breadcrumbs={["Modul 10 – ERP", "Pengadaan Logistik & ATK"]}>
        <div className="flex gap-2">
          <ExportDropdown onExportInvCSV={handleExportInvCSV} onExportInvExcel={handleExportInvExcel} onExportReqCSV={handleExportReqCSV} onExportReqExcel={handleExportReqExcel} />
          <Btn size="sm" onClick={openCreate}><Plus size={13} /> Buat Permintaan</Btn>
        </div>
      </PageHeader>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari item inventori..."
            value={invSearch}
            onChange={(e) => setInvSearch(e.target.value)}
            className="pl-8 pr-3 py-2 text-sm border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-64"
          />
        </div>
        <select
          value={invFilterKat}
          onChange={(e) => setInvFilterKat(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="Semua">Semua Kategori</option>
          <option value="ATK">ATK</option>
          <option value="Alkes">Alkes</option>
          <option value="Umum">Umum</option>
        </select>
      </div>

      <SectionCard title="Inventori Logistik & ATK">
        <TableWrapper>
          <thead>
            <tr>
              <Th>ID</Th><Th>Nama Item</Th><Th>Kategori</Th><Th>Stok</Th><Th>Min</Th><Th>Satuan</Th><Th>Harga Satuan</Th><Th>Supplier</Th><Th>Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-sm text-muted-foreground">Tidak ada item yang cocok dengan filter</td>
              </tr>
            ) : (
              filteredItems.map(d => (
                <tr key={d.id} className={`hover:bg-muted/40 ${d.stok <= d.min ? "bg-amber-50/30" : ""}`}>
                  <Td mono>{d.id}</Td>
                  <Td><span className="font-medium">{d.nama}</span>{d.stok <= d.min && <Badge variant="warning" className="ml-2">Rendah</Badge>}</Td>
                  <Td><Badge>{d.kat}</Badge></Td>
                  <Td mono>{d.stok}</Td>
                  <Td mono>{d.min}</Td>
                  <Td>{d.satuan}</Td>
                  <Td mono>{d.nilai}</Td>
                  <Td><span className="text-xs">{d.supplier}</span></Td>
                  <Td><CrudActions /></Td>
                </tr>
              ))
            )}
          </tbody>
        </TableWrapper>
      </SectionCard>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gray-100"><FileText size={16} className="text-gray-500" /></div>
          <div><div className="text-xl font-bold text-foreground font-mono">{reqDraft}</div><div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Draft</div></div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-50"><Send size={16} className="text-blue-600" /></div>
          <div><div className="text-xl font-bold text-foreground font-mono">{reqDiajukan}</div><div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Diajukan</div></div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-50"><CheckCircle size={16} className="text-emerald-600" /></div>
          <div><div className="text-xl font-bold text-foreground font-mono">{reqSelesai}</div><div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Selesai</div></div>
        </div>
      </div>

      <SectionCard
        title="Permintaan Pengadaan"
        actions={
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Cari permintaan..." value={reqSearch} onChange={(e) => setReqSearch(e.target.value)} className="pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-52" />
            </div>
            <select value={reqFilterStatus} onChange={(e) => setReqFilterStatus(e.target.value)} className="px-3 py-1.5 text-xs border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="Semua">Semua Status</option><option value="Draft">Draft</option><option value="Diajukan">Diajukan</option><option value="Disetujui">Disetujui</option><option value="Ditolak">Ditolak</option><option value="Dibatalkan">Dibatalkan</option>
            </select>
            <span className="text-xs text-muted-foreground"><strong className="text-foreground">{filteredPermintaan.length}</strong> / {permintaan.length}</span>
          </div>
        }
      >
        {filteredPermintaan.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">{reqSearch || reqFilterStatus !== "Semua" ? "Tidak ada permintaan yang cocok dengan filter" : "Belum ada permintaan pengadaan"}</div>
        ) : (
          <TableWrapper>
            <thead><tr><Th>ID Permintaan</Th><Th>Item</Th><Th>Qty</Th><Th>Prioritas</Th><Th>Status</Th><Th>Tanggal</Th><Th>Aksi</Th></tr></thead>
            <tbody>
              {filteredPermintaan.map((p) => (
                <tr key={p.id} className={`hover:bg-muted/40 transition-colors ${isFinal(p) ? "opacity-60" : ""}`}>
                  <Td mono>{p.id}</Td>
                  <Td><div><span className="font-medium text-sm">{p.itemName}</span><div className="text-[10px] text-muted-foreground font-mono">{p.itemId} · {p.kategori}</div></div></Td>
                  <Td mono>{p.qty} {p.satuan.toLowerCase()}</Td>
                  <Td><SBadge variant={p.prioritas.toLowerCase()}>{p.prioritas}</SBadge></Td>
                  <Td><SBadge variant={p.status.toLowerCase()}>{p.status}</SBadge></Td>
                  <Td mono>{p.tanggal}</Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openView(p)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors" title="Lihat Detail"><Eye size={14} /></button>
                      {canEdit(p) && <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-amber-50 text-amber-600 transition-colors" title="Edit"><Pencil size={14} /></button>}
                      {canDelete(p) && <button onClick={() => openDelete(p)} className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors" title="Hapus"><Trash2 size={14} /></button>}
                      {canAjukan(p) && <button onClick={() => handleAjukan(p)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors" title="Ajukan"><Send size={14} /></button>}
                      {canCancel(p) && <button onClick={() => openCancel(p)} className="p-1.5 rounded hover:bg-amber-50 text-amber-600 transition-colors" title="Batalkan"><Ban size={14} /></button>}
                      {isFinal(p) && <span className="text-[10px] text-muted-foreground italic pl-1">Final</span>}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        )}
      </SectionCard>

      {modal === "create" && <PermintaanFormModal mode="create" initialData={null} inventoryItems={items} onSave={handleCreate} onCancel={close} />}
      {modal === "edit" && selected && <PermintaanFormModal mode="edit" initialData={selected} inventoryItems={items} onSave={handleUpdate} onCancel={close} />}
      {modal === "view" && selected && <PermintaanViewModal permintaan={selected} onClose={close} />}
      {modal === "delete" && selected && <PermintaanConfirmModal type="delete" permintaan={selected} onConfirm={handleDelete} onCancel={close} />}
      {modal === "cancel" && selected && <PermintaanConfirmModal type="cancel" permintaan={selected} onConfirm={handleCancel} onCancel={close} />}

      <ToastContainer toasts={toasts} />
    </div>
  );
}