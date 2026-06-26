// src/app/components/erp/ERPTender.tsx

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  ChevronRight,
  Download,
  Plus,
  Search,
  X,
  AlertTriangle,
  CheckCircle,
  Info,
  Eye,
  Pencil,
  Trash2,
  ChevronDown,
  Ban,
  FileSpreadsheet,
  FileText,
  Send,
  Truck,
  TrendingUp,
  Star,
  CalendarDays,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════
//  PALETTE & UI PRIMITIVES
// ═══════════════════════════════════════════════════════════════
const C = {
  blue: "#1549A0",
  green: "#00897B",
  teal: "#0891B2",
  amber: "#F59E0B",
  red: "#EF4444",
};

function PageHeader({
  title,
  breadcrumbs,
  children,
}: {
  title: string;
  breadcrumbs: string[];
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        {breadcrumbs.map((b, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={10} />}
            <span className={i === breadcrumbs.length - 1 ? "text-foreground font-medium" : ""}>
              {b}
            </span>
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

function SectionCard({
  title,
  children,
  actions,
}: {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
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

function Btn({
  children,
  variant = "primary",
  size = "md",
  onClick,
  className = "",
  disabled,
}: {
  children: React.ReactNode;
  variant?: string;
  size?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  const base = "inline-flex items-center gap-1.5 font-semibold rounded-lg transition-all cursor-pointer border-0";
  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
  };
  const variants: Record<string, string> = {
    primary: "bg-primary text-white hover:bg-blue-700 shadow-sm",
    ghost: "bg-transparent text-muted-foreground hover:bg-muted",
    outline: "border border-border bg-white text-foreground hover:bg-muted",
    danger: "bg-red-600 text-white hover:bg-red-700",
    warning: "bg-amber-500 text-white hover:bg-amber-600",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
}

function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto -mx-5">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted border-b border-border whitespace-nowrap">
      {children}
    </th>
  );
}

function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <td
      className={`px-4 py-3 border-b border-border text-sm text-foreground ${
        mono ? "font-mono text-xs" : ""
      }`}
    >
      {children}
    </td>
  );
}

function Badge({
  variant = "default",
  children,
  className = "",
}: {
  variant?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const cls: Record<string, string> = {
    default: "bg-blue-100 text-blue-700",
    warning: "bg-amber-100 text-amber-700",
    aktif: "bg-emerald-100 text-emerald-700",
    tinggi: "bg-red-100 text-red-700",
    sedang: "bg-amber-100 text-amber-700",
    rendah: "bg-sky-100 text-sky-700",
    draft: "bg-gray-100 text-gray-600",
    diterbitkan: "bg-blue-100 text-blue-700",
    evaluasi: "bg-amber-100 text-amber-700",
    ditolak: "bg-red-100 text-red-700",
    dibatalkan: "bg-gray-200 text-gray-500 line-through",
    selesai: "bg-emerald-100 text-emerald-700",
    "tidak aktif": "bg-gray-100 text-gray-500",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
        cls[variant] || cls.default
      } ${className}`}
    >
      {children}
    </span>
  );
}

function CrudActions() {
  return (
    <div className="flex items-center gap-1">
      <button
        className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
        title="Lihat"
      >
        <Eye size={14} />
      </button>
      <button
        className="p-1.5 rounded hover:bg-amber-50 text-amber-600 transition-colors"
        title="Edit"
      >
        <Pencil size={14} />
      </button>
      <button
        className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors"
        title="Hapus"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-border flex items-center gap-3">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: color + "18" }}
      >
        <Icon size={16} style={{ color }} />
      </div>
      <div>
        <div className="text-xl font-bold text-foreground font-mono">{value}</div>
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </div>
        <div className="text-[10px] text-muted-foreground">{sub}</div>
      </div>
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
      headers
        .map((h) => {
          const val = String(row[h] ?? "");
          return val.includes(",") || val.includes('"') || val.includes("\n")
            ? `"${val.replace(/"/g, '""')}"`
            : val;
        })
        .join(",")
    ),
  ];

  const blob = new Blob(["\uFEFF" + csvRows.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
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
//  TOAST SYSTEM
// ═══════════════════════════════════════════════════════════════
interface Toast {
  id: number;
  message: string;
  type: "success" | "info" | "danger" | "warning";
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  const iconMap = {
    success: <CheckCircle size={16} />,
    danger: <Trash2 size={16} />,
    info: <Info size={16} />,
    warning: <AlertTriangle size={16} />,
  };
  
  const colorMap = {
    success: "bg-emerald-600",
    danger: "bg-red-600",
    info: "bg-blue-700",
    warning: "bg-amber-500",
  };

  return (
    <div className="fixed top-5 right-5 z-[200] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-white text-sm font-semibold shadow-lg animate-[slideIn_0.3s_ease] ${colorMap[t.type]}`}
        >
          {iconMap[t.type]} {t.message}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  EXPORT DROPDOWN
// ═══════════════════════════════════════════════════════════════
function ExportDropdown({
  onExpVndCSV,
  onExpVndExcel,
  onExpTndCSV,
  onExpTndExcel,
}: {
  onExpVndCSV: () => void;
  onExpVndExcel: () => void;
  onExpTndCSV: () => void;
  onExpTndExcel: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const Item = ({
    icon,
    label,
    onClick,
  }: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
  }) => (
    <button
      onClick={() => {
        onClick();
        setOpen(false);
      }}
      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left"
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 font-semibold rounded-lg transition-all cursor-pointer border-0 px-4 py-2 text-sm bg-transparent text-muted-foreground hover:bg-muted"
      >
        <Download size={13} /> Export{" "}
        <ChevronDown
          size={12}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-xl shadow-lg py-1 z-50 w-60">
          <div className="px-4 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Vendor
          </div>
          <Item
            icon={<FileText size={14} className="text-emerald-600" />}
            label="Export Vendor (CSV)"
            onClick={onExpVndCSV}
          />
          <Item
            icon={<FileSpreadsheet size={14} className="text-blue-600" />}
            label="Export Vendor (Excel)"
            onClick={onExpVndExcel}
          />
          
          <div className="border-t border-border my-1" />
          
          <div className="px-4 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Tender
          </div>
          <Item
            icon={<FileText size={14} className="text-emerald-600" />}
            label="Export Tender (CSV)"
            onClick={onExpTndCSV}
          />
          <Item
            icon={<FileSpreadsheet size={14} className="text-blue-600" />}
            label="Export Tender (Excel)"
            onClick={onExpTndExcel}
          />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  TYPES & DATA
// ═══════════════════════════════════════════════════════════════
interface Vendor {
  id: string;
  nama: string;
  kat: string;
  kontak: string;
  rating: number;
  nilai: string;
  status: string;
}

interface Tender {
  id: string;
  judul: string;
  vendorId: string;
  vendorName: string;
  kategori: string;
  nilai: number;
  deadline: string;
  prioritas: "Rendah" | "Sedang" | "Tinggi";
  status: "Draft" | "Diterbitkan" | "Evaluasi" | "Ditolak" | "Dibatalkan" | "Selesai";
  catatan: string;
}

const vendorData: Vendor[] = [
  { id: "VND-001", nama: "PT Rajawali Utama", kat: "Alkes", kontak: "0812-3456-7890", rating: 4.8, nilai: "Rp 125 Jt", status: "Aktif" },
  { id: "VND-002", nama: "CV Indo Makmur", kat: "ATK", kontak: "0813-9876-5432", rating: 4.5, nilai: "Rp 85 Jt", status: "Aktif" },
  { id: "VND-003", nama: "PT Enseval Putra", kat: "Alkes", kontak: "0814-1122-3344", rating: 4.2, nilai: "Rp 200 Jt", status: "Aktif" },
  { id: "VND-004", nama: "PT Propan Raya", kat: "Umum", kontak: "0815-5566-7788", rating: 3.9, nilai: "Rp 45 Jt", status: "Tidak Aktif" },
  { id: "VND-005", nama: "CV Medika Sejahtera", kat: "Alkes", kontak: "0816-9988-7766", rating: 4.6, nilai: "Rp 150 Jt", status: "Aktif" },
];

const INITIAL_TENDERS: Tender[] = [
  { id: "TND-2025-001", judul: "Pengadaan Alkes Q1 2025", vendorId: "VND-001", vendorName: "PT Rajawali Utama", kategori: "Alkes", nilai: 125000000, deadline: "2025-02-15", prioritas: "Tinggi", status: "Diterbitkan", catatan: "Pengadaan rutin quarterly" },
  { id: "TND-2025-002", judul: "Supply ATK Kantor", vendorId: "VND-002", vendorName: "CV Indo Makmur", kategori: "ATK", nilai: 45000000, deadline: "2025-02-20", prioritas: "Sedang", status: "Evaluasi", catatan: "Kontrak tahunan" },
  { id: "TND-2025-003", judul: "Detergen & Cleaning Service", vendorId: "VND-004", vendorName: "PT Propan Raya", kategori: "Umum", nilai: 32000000, deadline: "2025-03-01", prioritas: "Rendah", status: "Draft", catatan: "" },
];

const formatNilai = (num: number) => {
  if (num >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(1)} M`;
  if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(0)} Jt`;
  return `Rp ${num.toLocaleString("id-ID")}`;
};

// ═══════════════════════════════════════════════════════════════
//  MODAL: FORM TENDER (Create / Edit)
// ═══════════════════════════════════════════════════════════════
function TenderFormModal({
  mode,
  initialData,
  onSave,
  onCancel,
}: {
  mode: "create" | "edit";
  initialData: Tender | null;
  onSave: (data: Omit<Tender, "id" | "status">) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    judul: initialData?.judul ?? "",
    vendorId: initialData?.vendorId ?? "",
    nilai: initialData?.nilai ?? "",
    deadline: initialData?.deadline ?? "",
    prioritas: initialData?.prioritas ?? "Sedang",
    catatan: initialData?.catatan ?? "",
  });

  const set = (key: string, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));
    
  const selVendor = vendorData.find((v) => v.id === form.vendorId);
  const isValid =
    form.judul !== "" &&
    form.vendorId !== "" &&
    Number(form.nilai) > 0 &&
    form.deadline !== "";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !selVendor) return;
    onSave({
      judul: form.judul,
      vendorId: form.vendorId,
      vendorName: selVendor.nama,
      kategori: selVendor.kat,
      nilai: Number(form.nilai),
      deadline: form.deadline,
      prioritas: form.prioritas as Tender["prioritas"],
      catatan: form.catatan,
    });
  };

  const fc =
    "w-full px-3.5 py-2.5 rounded-lg border border-border bg-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50";
  const lc = "block text-xs font-semibold text-foreground mb-1.5";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold text-base">
            {mode === "create" ? "Buat Tender Baru" : "Edit Tender"}
          </h3>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        
        <form onSubmit={submit}>
          <div className="p-5 space-y-4">
            <div>
              <label className={lc}>Judul Tender</label>
              <input
                type="text"
                className={fc}
                value={form.judul}
                onChange={(e) => set("judul", e.target.value)}
                placeholder="cth: Pengadaan Alkes Q2"
                autoFocus
              />
            </div>

            <div>
              <label className={lc}>Vendor</label>
              <select
                className={fc}
                value={form.vendorId}
                onChange={(e) => set("vendorId", e.target.value)}
              >
                <option value="">— Pilih Vendor —</option>
                {vendorData
                  .filter((v) => v.status === "Aktif")
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.id} — {v.nama}
                    </option>
                  ))}
              </select>
            </div>

            {selVendor && (
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
                Kategori: <strong>{selVendor.kat}</strong> · Rating:{" "}
                <strong>{selVendor.rating}</strong>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lc}>Nilai (Rp)</label>
                <input
                  type="number"
                  min="1"
                  className={fc}
                  value={form.nilai}
                  onChange={(e) => set("nilai", e.target.value)}
                  placeholder="100000000"
                />
              </div>
              <div>
                <label className={lc}>Deadline</label>
                <input
                  type="date"
                  className={fc}
                  value={form.deadline}
                  onChange={(e) => set("deadline", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className={lc}>Prioritas</label>
              <select
                className={fc}
                value={form.prioritas}
                onChange={(e) => set("prioritas", e.target.value)}
              >
                <option value="Rendah">Rendah</option>
                <option value="Sedang">Sedang</option>
                <option value="Tinggi">Tinggi</option>
              </select>
            </div>

            <div>
              <label className={lc}>Catatan</label>
              <textarea
                className={fc + " min-h-[70px] resize-none"}
                value={form.catatan}
                onChange={(e) => set("catatan", e.target.value)}
                placeholder="Keterangan tambahan..."
              />
            </div>

            {isValid && selVendor && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">
                  Preview
                </div>
                <div className="text-xs text-emerald-800">
                  {form.judul} — {selVendor.nama} ({formatNilai(Number(form.nilai))})
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 p-4 border-t border-border bg-muted/50 rounded-b-2xl">
            <button
              type="button"
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors"
              onClick={onCancel}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={14} /> {mode === "create" ? "Buat Tender" : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL: VIEW DETAIL TENDER
// ═══════════════════════════════════════════════════════════════
function TenderViewModal({
  tender,
  onClose,
}: {
  tender: Tender;
  onClose: () => void;
}) {
  const items = [
    { l: "ID Tender", v: tender.id },
    { l: "Judul", v: tender.judul },
    { l: "Vendor", v: `${tender.vendorName} (${tender.vendorId})` },
    { l: "Kategori", v: tender.kategori },
    { l: "Nilai", v: formatNilai(tender.nilai) },
    { l: "Deadline", v: tender.deadline },
    { l: "Prioritas", v: tender.prioritas },
    { l: "Status", v: tender.status },
    { l: "Catatan", v: tender.catatan || "—" },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold text-base">Detail Tender</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        
        <div className="p-5 space-y-3">
          {items.map((item) => (
            <div key={item.l}>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                {item.l}
              </div>
              <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                {item.v}
                {item.l === "Status" && (
                  <Badge variant={tender.status.toLowerCase()}>{tender.status}</Badge>
                )}
                {item.l === "Prioritas" && (
                  <Badge variant={tender.prioritas.toLowerCase()}>{tender.prioritas}</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end p-4 border-t border-border bg-muted/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL: KONFIRMASI HAPUS / BATALKAN
// ═══════════════════════════════════════════════════════════════
function TenderConfirmModal({
  type,
  tender,
  onConfirm,
  onCancel,
}: {
  type: "delete" | "cancel";
  tender: Tender;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isDelete = type === "delete";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isDelete ? "bg-red-50" : "bg-amber-50"
            }`}
          >
            {isDelete ? (
              <AlertTriangle size={28} className="text-red-500" />
            ) : (
              <Ban size={28} className="text-amber-500" />
            )}
          </div>
          <h4 className="font-bold text-base mb-2">
            {isDelete ? "Hapus Tender?" : "Batalkan Tender?"}
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isDelete ? (
              <>
                Hapus <strong>{tender.id}</strong> ({tender.judul})?
              </>
            ) : (
              <>
                Batalkan <strong>{tender.id}</strong> ({tender.judul})?
              </>
            )}
          </p>
        </div>
        
        <div className="flex justify-center gap-2 p-4 border-t border-border bg-muted/50 rounded-b-2xl">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold rounded-lg text-white transition-colors ${
              isDelete
                ? "bg-red-600 hover:bg-red-700"
                : "bg-amber-500 hover:bg-amber-600"
            }`}
          >
            Ya, {isDelete ? "Hapus" : "Batalkan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  KOMPONEN UTAMA
// ═══════════════════════════════════════════════════════════════
export default function ERPTender() {
  // ── Vendor States ──
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [vndSearch, setVndSearch] = useState("");
  const [vndFilter, setVndFilter] = useState("Semua");

  // ── Tender States ──
  const [tenders, setTenders] = useState<Tender[]>(INITIAL_TENDERS);
  const [tndSearch, setTndSearch] = useState("");
  const [tndFilterStatus, setTndFilterStatus] = useState("Semua");
  const [modal, setModal] = useState<null | "create" | "edit" | "view" | "delete" | "cancel">(null);
  const [selected, setSelected] = useState<Tender | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // ── Toast Handler ──
  const showToast = useCallback(
    (message: string, type: Toast["type"] = "success") => {
      const id = Date.now();
      setToasts((p) => [...p, { id, message, type }]);
      setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
    },
    []
  );

  // ── Filtered Data ──
  const filteredVendors = useMemo(() => {
    return vendorData.filter((v) => {
      const matchSearch =
        vndSearch === "" ||
        v.id.toLowerCase().includes(vndSearch.toLowerCase()) ||
        v.nama.toLowerCase().includes(vndSearch.toLowerCase());
      const matchStatus = vndFilter === "Semua" || v.status === vndFilter;
      return matchSearch && matchStatus;
    });
  }, [vndSearch, vndFilter]);

  const filteredTenders = useMemo(() => {
    return tenders.filter((t) => {
      const matchSearch =
        tndSearch === "" ||
        t.id.toLowerCase().includes(tndSearch.toLowerCase()) ||
        t.judul.toLowerCase().includes(tndSearch.toLowerCase()) ||
        t.vendorName.toLowerCase().includes(tndSearch.toLowerCase());
      const matchStatus = tndFilterStatus === "Semua" || t.status === tndFilterStatus;
      return matchSearch && matchStatus;
    });
  }, [tenders, tndSearch, tndFilterStatus]);

  // ── Stats (Dinamis) ──
  const tenderAktif = tenders.filter(
    (t) => t.status === "Diterbitkan" || t.status === "Evaluasi"
  ).length;
  
  const vendorAktif = vendorData.filter((v) => v.status === "Aktif").length;
  
  const totalNilaiAktif = tenders
    .filter((t) => t.status === "Diterbitkan" || t.status === "Evaluasi")
    .reduce((s, t) => s + t.nilai, 0);

  // ── Modal Handlers ──
  const openCreate = () => {
    setSelected(null);
    setModal("create");
  };
  const openEdit = (t: Tender) => {
    setSelected(t);
    setModal("edit");
  };
  const openView = (t: Tender) => {
    setSelected(t);
    setModal("view");
  };
  const openDelete = (t: Tender) => {
    setSelected(t);
    setModal("delete");
  };
  const openCancel = (t: Tender) => {
    setSelected(t);
    setModal("cancel");
  };
  const close = () => {
    setModal(null);
    setSelected(null);
  };

  // ── CRUD Handlers ──
  const handleCreate = (data: Omit<Tender, "id" | "status">) => {
    const id =
      "TND-2025-" +
      String(
        Math.max(...tenders.map((t) => parseInt(t.id.replace(/\D/g, ""), 10)), 0) + 1
      ).padStart(3, "0");
    setTenders((p) => [{ ...data, id, status: "Draft" }, ...p]);
    close();
    showToast(`Tender ${id} dibuat`);
  };

  const handleUpdate = (data: Omit<Tender, "id" | "status">) => {
    if (!selected) return;
    setTenders((p) =>
      p.map((t) => (t.id === selected.id ? { ...t, ...data } : t))
    );
    close();
    showToast(`Tender ${selected.id} diperbarui`);
  };

  const handleDelete = () => {
    if (!selected) return;
    const id = selected.id;
    setTenders((p) => p.filter((t) => t.id !== id));
    close();
    showToast(`Tender ${id} dihapus`, "danger");
  };

  const handleCancel = () => {
    if (!selected) return;
    const id = selected.id;
    setTenders((p) =>
      p.map((t) =>
        t.id === id ? { ...t, status: "Dibatalkan" as const } : t
      )
    );
    close();
    showToast(`Tender ${id} dibatalkan`, "warning");
  };

  const handlePublish = (t: Tender) => {
    setTenders((p) =>
      p.map((i) =>
        i.id === t.id ? { ...i, status: "Diterbitkan" as const } : i
      )
    );
    showToast(`Tender ${t.id} diterbitkan`, "info");
  };

  // ── Export Handlers ──
  const expVndCSV = () => {
    downloadCSV(
      vendorData.map((v) => ({
        ID: v.id,
        "Nama Vendor": v.nama,
        Kategori: v.kat,
        Kontak: v.kontak,
        Rating: v.rating,
        "Nilai YTD": v.nilai,
        Status: v.status,
      })),
      "Vendor_Tender"
    );
    showToast("Vendor dieksport ke CSV");
  };

  const expVndExcel = () => {
    downloadExcel(
      vendorData.map((v) => ({
        ID: v.id,
        "Nama Vendor": v.nama,
        Kategori: v.kat,
        Kontak: v.kontak,
        Rating: v.rating,
        "Nilai YTD": v.nilai,
        Status: v.status,
      })),
      "Vendor_Tender"
    );
    showToast("Vendor dieksport ke Excel");
  };

  const expTndCSV = () => {
    downloadCSV(
      tenders.map((t) => ({
        "ID Tender": t.id,
        Judul: t.judul,
        Vendor: t.vendorName,
        Kategori: t.kategori,
        Nilai: t.nilai,
        Deadline: t.deadline,
        Prioritas: t.prioritas,
        Status: t.status,
        Catatan: t.catatan,
      })),
      "Daftar_Tender"
    );
    showToast("Tender dieksport ke CSV");
  };

  const expTndExcel = () => {
    downloadExcel(
      tenders.map((t) => ({
        "ID Tender": t.id,
        Judul: t.judul,
        Vendor: t.vendorName,
        Kategori: t.kategori,
        Nilai: t.nilai,
        Deadline: t.deadline,
        Prioritas: t.prioritas,
        Status: t.status,
        Catatan: t.catatan,
      })),
      "Daftar_Tender"
    );
    showToast("Tender dieksport ke Excel");
  };

  // ── Action Permissions ──
  const canEdit = (t: Tender) => t.status === "Draft";
  const canDelete = (t: Tender) => t.status === "Draft";
  const canPublish = (t: Tender) => t.status === "Draft";
  const canCancel = (t: Tender) =>
    t.status === "Draft" || t.status === "Diterbitkan" || t.status === "Evaluasi";
  const isFinal = (t: Tender) =>
    t.status === "Selesai" || t.status === "Ditolak" || t.status === "Dibatalkan";

  // ═══════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="p-6 space-y-5">
      {/* ═══ HEADER ═══ */}
      <PageHeader
        title="Vendor Tender Portal"
        breadcrumbs={["Modul 10 – ERP", "Vendor Tender Portal"]}
      >
        <div className="flex gap-2">
          <ExportDropdown
            onExpVndCSV={expVndCSV}
            onExpVndExcel={expVndExcel}
            onExpTndCSV={expTndCSV}
            onExpTndExcel={expTndExcel}
          />
          <Btn size="sm" onClick={openCreate}>
            <Plus size={13} /> Buat Tender Baru
          </Btn>
        </div>
      </PageHeader>

      {/* ═══ STAT CARDS ═══ */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Tender Aktif"
          value={tenderAktif}
          sub="dalam proses evaluasi"
          icon={FileText}
          color={C.blue}
        />
        <StatCard
          label="Vendor Terdaftar"
          value={vendorAktif}
          sub="vendor terverifikasi"
          icon={Truck}
          color={C.green}
        />
        <StatCard
          label="Total Nilai Tender"
          value={formatNilai(totalNilaiAktif)}
          sub="sedang dievaluasi"
          icon={TrendingUp}
          color={C.teal}
        />
      </div>

      {/* ═══ DAFTAR VENDOR ═══ */}
      <SectionCard
        title="Daftar Vendor & Evaluasi"
        actions={
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Cari vendor..."
                value={vndSearch}
                onChange={(e) => setVndSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-52"
              />
            </div>
            <select
              value={vndFilter}
              onChange={(e) => setVndFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="Semua">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Tidak Aktif">Tidak Aktif</option>
            </select>
          </div>
        }
      >
        <TableWrapper>
          <thead>
            <tr>
              <Th>ID</Th>
              <Th>Nama Vendor</Th>
              <Th>Kategori</Th>
              <Th>Kontak</Th>
              <Th>Rating</Th>
              <Th>Nilai YTD</Th>
              <Th>Status</Th>
              <Th>Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {filteredVendors.map((v) => (
              <tr
                key={v.id}
                className={`hover:bg-muted/40 cursor-pointer ${
                  selectedVendor === v.id ? "bg-blue-50/50" : ""
                }`}
                onClick={() => setSelectedVendor(v.id)}
              >
                <Td mono>{v.id}</Td>
                <Td>
                  <span className="font-medium">{v.nama}</span>
                </Td>
                <Td>
                  <Badge>{v.kat}</Badge>
                </Td>
                <Td mono>{v.kontak}</Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    <span className="text-xs font-bold">{v.rating}</span>
                  </div>
                </Td>
                <Td mono>{v.nilai}</Td>
                <Td>
                  <Badge variant={v.status === "Aktif" ? "aktif" : "tidak aktif"}>
                    {v.status}
                  </Badge>
                </Td>
                <Td>
                  <CrudActions />
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      </SectionCard>

      {/* ═══ DAFTAR TENDER ═══ */}
      <SectionCard
        title="Daftar Tender"
        actions={
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Cari tender..."
                value={tndSearch}
                onChange={(e) => setTndSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-52"
              />
            </div>
            <select
              value={tndFilterStatus}
              onChange={(e) => setTndFilterStatus(e.target.value)}
              className="px-3 py-1.5 text-xs border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="Semua">Semua Status</option>
              <option value="Draft">Draft</option>
              <option value="Diterbitkan">Diterbitkan</option>
              <option value="Evaluasi">Evaluasi</option>
              <option value="Selesai">Selesai</option>
              <option value="Ditolak">Ditolak</option>
              <option value="Dibatalkan">Dibatalkan</option>
            </select>
            <span className="text-xs text-muted-foreground">
              <strong className="text-foreground">{filteredTenders.length}</strong> /{" "}
              {tenders.length}
            </span>
          </div>
        }
      >
        {filteredTenders.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            Tidak ada tender yang cocok
          </div>
        ) : (
          <TableWrapper>
            <thead>
              <tr>
                <Th>ID</Th>
                <Th>Judul</Th>
                <Th>Vendor</Th>
                <Th>Nilai</Th>
                <Th>Deadline</Th>
                <Th>Prioritas</Th>
                <Th>Status</Th>
                <Th>Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {filteredTenders.map((t) => (
                <tr
                  key={t.id}
                  className={`hover:bg-muted/40 transition-colors ${
                    isFinal(t) ? "opacity-60" : ""
                  }`}
                >
                  <Td mono>{t.id}</Td>
                  <Td>
                    <span className="font-medium text-sm">{t.judul}</span>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {t.kategori}
                    </div>
                  </Td>
                  <Td>
                    <span className="text-xs">{t.vendorName}</span>
                  </Td>
                  <Td mono>{formatNilai(t.nilai)}</Td>
                  <Td>
                    <div className="flex items-center gap-1.5 text-xs">
                      <CalendarDays
                        size={12}
                        className="text-muted-foreground"
                      />
                      {t.deadline}
                    </div>
                  </Td>
                  <Td>
                    <Badge variant={t.prioritas.toLowerCase()}>
                      {t.prioritas}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge variant={t.status.toLowerCase()}>
                      {t.status}
                    </Badge>
                  </Td>
                  <Td>
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => openView(t)}
                        className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
                        title="Lihat"
                      >
                        <Eye size={14} />
                      </button>
                      {canEdit(t) && (
                        <button
                          onClick={() => openEdit(t)}
                          className="p-1.5 rounded hover:bg-amber-50 text-amber-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      {canDelete(t) && (
                        <button
                          onClick={() => openDelete(t)}
                          className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      {canPublish(t) && (
                        <button
                          onClick={() => handlePublish(t)}
                          className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600 transition-colors"
                          title="Terbitkan"
                        >
                          <Send size={14} />
                        </button>
                      )}
                      {canCancel(t) && (
                        <button
                          onClick={() => openCancel(t)}
                          className="p-1.5 rounded hover:bg-amber-50 text-amber-600 transition-colors"
                          title="Batalkan"
                        >
                          <Ban size={14} />
                        </button>
                      )}
                      {isFinal(t) && (
                        <span className="text-[10px] text-muted-foreground italic pl-1">
                          Final
                        </span>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        )}
      </SectionCard>

      {/* ═══ MODALS ═══ */}
      {modal === "create" && (
        <TenderFormModal
          mode="create"
          initialData={null}
          onSave={handleCreate}
          onCancel={close}
        />
      )}
      {modal === "edit" && selected && (
        <TenderFormModal
          mode="edit"
          initialData={selected}
          onSave={handleUpdate}
          onCancel={close}
        />
      )}
      {modal === "view" && selected && (
        <TenderViewModal tender={selected} onClose={close} />
      )}
      {modal === "delete" && selected && (
        <TenderConfirmModal
          type="delete"
          tender={selected}
          onConfirm={handleDelete}
          onCancel={close}
        />
      )}
      {modal === "cancel" && selected && (
        <TenderConfirmModal
          type="cancel"
          tender={selected}
          onConfirm={handleCancel}
          onCancel={close}
        />
      )}

      <ToastContainer toasts={toasts} />
    </div>
  );
}