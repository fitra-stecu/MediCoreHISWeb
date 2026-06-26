// src/app/components/erp/VendorTable.tsx

import { useState, useCallback } from "react";
import {
  Plus, Search, Eye, Pencil, Trash2, Download,
  ChevronDown, X, AlertTriangle, CheckCircle, Info, SearchX,
  Star, FileText, FileSpreadsheet, File,
} from "lucide-react";
import { downloadCSV } from "../../../helpers/exportCsv";
import { downloadExcel } from "../../../helpers/exportExcel";
import { downloadPDF } from "../../../helpers/exportPdf";

// ═══════════════════════════════════════════════════════════════
//  TYPE
// ═══════════════════════════════════════════════════════════════
interface Vendor {
  id: string;
  nama: string;
  kat: string;
  kontak: string;
  rating: number;
  status: "aktif" | "nonaktif";
  nilai: string; // contoh: "Rp 2,8 M"
}

type ModalMode = null | "create" | "edit" | "view" | "delete";

// ═══════════════════════════════════════════════════════════════
//  DATA AWAL
// ═══════════════════════════════════════════════════════════════
const INITIAL_VENDORS: Vendor[] = [
  { id: "VND001", nama: "PT Kimia Farma T&D",   kat: "Farmasi",         kontak: "021-5555-1234", rating: 4.8, status: "aktif",    nilai: "Rp 2,8 M" },
  { id: "VND002", nama: "PT Kalbe Farma",       kat: "Farmasi",         kontak: "021-5555-2345", rating: 4.6, status: "aktif",    nilai: "Rp 1,9 M" },
  { id: "VND003", nama: "PT Rajawali Nusindo",  kat: "Alkes & Farmasi", kontak: "021-5555-3456", rating: 4.7, status: "aktif",    nilai: "Rp 3,2 M" },
  { id: "VND004", nama: "PT Enseval Putera",    kat: "Distribusi",      kontak: "021-5555-4567", rating: 4.4, status: "aktif",    nilai: "Rp 1,4 M" },
  { id: "VND005", nama: "PT Wastec International", kat: "Limbah B3",    kontak: "021-5555-5678", rating: 4.5, status: "aktif",    nilai: "Rp 890 J" },
  { id: "VND006", nama: "CV Indo Makmur Jaya",  kat: "ATK & Umum",      kontak: "031-5555-6789", rating: 4.1, status: "nonaktif", nilai: "Rp 580 J" },
];

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════
function generateVendorId(data: Vendor[]): string {
  if (data.length === 0) return "VND001";
  const nums = data.map((d) => parseInt(d.id.replace("VND", ""), 10));
  return "VND" + String(Math.max(...nums) + 1).padStart(3, "0");
}

// ═══════════════════════════════════════════════════════════════
//  ELEMEN BARU 1: Komponen Bintang Rating
// ═══════════════════════════════════════════════════════════════
function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        // Bintang penuh jika star <= rating
        // Bintang kosong jika star > rating
        const filled = star <= Math.round(rating);
        return (
          <Star
            key={star}
            size={size}
            className={filled ? "fill-amber-400 text-amber-400" : "text-gray-200"}
          />
        );
      })}
      <span className="ml-1 text-xs font-semibold text-foreground font-mono">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  TOAST (sama seperti DrugTable)
// ═══════════════════════════════════════════════════════════════
interface Toast { id: number; message: string; type: "success" | "danger" | "info"; }

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
//  MODAL FORM (Create / Edit) — field-nya beda dengan DrugTable
// ═══════════════════════════════════════════════════════════════
function FormModal({
  mode, initialData, onSave, onClose,
}: {
  mode: "create" | "edit";
  initialData: Vendor | null;
  onSave: (data: Omit<Vendor, "id">) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    nama: initialData?.nama ?? "",
    kat: initialData?.kat ?? "Farmasi",
    kontak: initialData?.kontak ?? "",
    rating: initialData?.rating ?? "",
    status: initialData?.status ?? "aktif",
    nilai: initialData?.nilai ?? "",
  });

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Validasi: nama & kontak wajib, rating 0-5
  const ratingNum = Number(form.rating);
  const isValid =
    form.nama.trim() !== "" &&
    form.kontak.trim() !== "" &&
    !isNaN(ratingNum) && ratingNum >= 0 && ratingNum <= 5 &&
    form.nilai.trim() !== "";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSave({
      nama: form.nama.trim(),
      kat: form.kat,
      kontak: form.kontak.trim(),
      rating: Math.round(ratingNum * 10) / 10, // bulatkan 1 desimal
      status: form.status as Vendor["status"],
      nilai: form.nilai.trim(),
    });
  };

  const fc = "w-full px-3.5 py-2.5 rounded-lg border border-border bg-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50";
  const lc = "block text-xs font-semibold text-foreground mb-1.5";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold text-base">{mode === "create" ? "Tambah Vendor Baru" : "Edit Data Vendor"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X size={16} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="p-5 space-y-4">
            <div>
              <label className={lc}>Nama Vendor</label>
              <input className={fc} placeholder="cth: PT Kimia Farma T&D" value={form.nama} onChange={(e) => set("nama", e.target.value)} autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lc}>Kategori</label>
                <select className={fc} value={form.kat} onChange={(e) => set("kat", e.target.value)}>
                  {["Farmasi", "Alkes & Farmasi", "Distribusi", "Limbah B3", "ATK & Umum", "Lainnya"].map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={lc}>Status</label>
                <select className={fc} value={form.status} onChange={(e) => set("status", e.target.value)}>
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>
            </div>
            <div>
              <label className={lc}>Kontak / Telepon</label>
              <input className={fc} placeholder="cth: 021-5555-1234" value={form.kontak} onChange={(e) => set("kontak", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lc}>Rating (0 - 5)</label>
                <input type="number" min="0" max="5" step="0.1" className={fc} value={form.rating} onChange={(e) => set("rating", e.target.value)} />
              </div>
              <div>
                <label className={lc}>Nilai Kontrak</label>
                <input className={fc} placeholder="cth: Rp 2,8 M" value={form.nilai} onChange={(e) => set("nilai", e.target.value)} />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 p-4 border-t border-border bg-muted/50 rounded-b-2xl">
            <button type="button" className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors" onClick={onClose}>Batal</button>
            <button type="submit" disabled={!isValid} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {mode === "create" ? "Simpan Vendor Baru" : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL VIEW
// ═══════════════════════════════════════════════════════════════
function ViewModal({ data, onClose }: { data: Vendor; onClose: () => void }) {
  const items = [
    { label: "ID Vendor", value: data.id, mono: true },
    { label: "Nama Vendor", value: data.nama },
    { label: "Kategori", value: data.kat },
    { label: "Kontak", value: data.kontak },
    { label: "Nilai Kontrak", value: data.nilai, mono: true },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold text-base">Detail Vendor</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X size={16} /></button>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 gap-4">
            {items.map((item) => (
              <div key={item.label}>
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{item.label}</div>
                <div className={`text-sm font-semibold text-foreground ${item.mono ? "font-mono text-xs" : ""}`}>{item.value}</div>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Rating</div>
            <StarRating rating={data.rating} size={18} />
          </div>
          <div className="mt-5">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Status</div>
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
              data.status === "aktif" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
            }`}>
              {data.status === "aktif" ? "Aktif" : "Nonaktif"}
            </span>
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
function ConfirmModal({ vendor, onConfirm, onClose }: { vendor: Vendor; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
          <h4 className="font-bold text-base mb-2">Hapus Data Vendor?</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Anda akan menghapus <strong>{vendor.nama}</strong> ({vendor.id}). Tindakan ini tidak bisa dibatalkan.
          </p>
        </div>
        <div className="flex justify-center gap-2 p-4 border-t border-border bg-muted/50 rounded-b-2xl">
          <button className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors" onClick={onClose}>Batal</button>
          <button className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors" onClick={onConfirm}>Ya, Hapus</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  KOMPONEN UTAMA
// ═══════════════════════════════════════════════════════════════
export default function VendorTable() {
  const [vendors, setVendors] = useState<Vendor[]>(INITIAL_VENDORS);
  const [search, setSearch] = useState("");
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Vendor | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [openDownload, setOpenDownload] = useState(false);

  const toast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  // ── Filter ──
  const q = search.toLowerCase();
  const filtered = vendors.filter(
    (v) =>
      v.id.toLowerCase().includes(q) ||
      v.nama.toLowerCase().includes(q) ||
      v.kat.toLowerCase().includes(q) ||
      v.status.includes(q)
  );

  // ── Ringkasan ──
  const aktif = vendors.filter((v) => v.status === "aktif").length;
  const avgRating = vendors.length > 0
    ? (vendors.reduce((sum, v) => sum + v.rating, 0) / vendors.length).toFixed(1)
    : "0.0";

  // ── Label untuk export (BEDA dengan DrugTable) ──
  const exportLabels = {
    id: "ID Vendor",
    nama: "Nama Vendor",
    kat: "Kategori",
    kontak: "Kontak",
    rating: "Rating",
    status: "Status",
    nilai: "Nilai Kontrak",
  };

  // ── CRUD ──
  const handleCreate = (data: Omit<Vendor, "id">) => {
    const newVendor: Vendor = { id: generateVendorId(vendors), ...data };
    setVendors((prev) => [newVendor, ...prev]);
    close();
    toast(`"${newVendor.nama}" berhasil ditambahkan`);
  };

  const handleUpdate = (data: Omit<Vendor, "id">) => {
    if (!selected) return;
    setVendors((prev) => prev.map((v) => (v.id === selected.id ? { ...v, ...data } : v)));
    close();
    toast(`"${data.nama}" berhasil diperbarui`);
  };

  const handleDelete = () => {
    if (!selected) return;
    const nama = selected.nama;
    setVendors((prev) => prev.filter((v) => v.id !== selected.id));
    close();
    toast(`"${nama}" berhasil dihapus`, "danger");
  };

  // ── Download (PAKAI HELPER YANG SAMA, hanya label & filename beda) ──
  const today = new Date().toISOString().slice(0, 10);

  const handleDownloadCSV = () => {
    try {
      downloadCSV(filtered, `vendor-${today}.csv`, exportLabels);
      setOpenDownload(false);
      toast(`CSV didownload (${filtered.length} baris)`, "info");
    } catch (err) { console.error(err); toast(`Gagal: ${(err as Error).message}`, "danger"); }
  };

  const handleDownloadExcel = () => {
    try {
      downloadExcel(filtered, `vendor-${today}`, exportLabels, "Vendor");
      setOpenDownload(false);
      toast(`Excel didownload (${filtered.length} baris)`, "info");
    } catch (err) { console.error(err); toast(`Gagal: ${(err as Error).message}`, "danger"); }
  };

  const handleDownloadPDF = () => {
    try {
      downloadPDF(filtered, `vendor-${today}`, exportLabels, "Daftar Vendor - MediCore HIS");
      setOpenDownload(false);
      toast(`PDF didownload (${filtered.length} baris)`, "info");
    } catch (err) { console.error(err); toast(`Gagal: ${(err as Error).message}`, "danger"); }
  };

  const close = () => { setModalMode(null); setSelected(null); };

  // ── Render ──
  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
          <span>MediCore HIS</span>
          <ChevronDown size={10} className="rotate-[-90deg]" />
          <span>Modul 10 – ERP</span>
          <ChevronDown size={10} className="rotate-[-90deg]" />
          <span className="text-foreground font-medium">Vendor Disposal</span>
        </div>
        <h2 className="text-xl font-bold text-foreground">Daftar Vendor</h2>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Vendor", value: vendors.length, color: "#1549A0" },
          { label: "Aktif", value: aktif, color: "#10B981" },
          { label: "Nonaktif", value: vendors.length - aktif, color: "#EF4444" },
          { label: "Rata-rata Rating", value: avgRating, color: "#F59E0B" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm border border-border flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.color + "18" }}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground font-mono">{s.value}</div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-wrap gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari vendor..." className="w-full pl-8 pr-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50" />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setOpenDownload(!openDownload)} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors">
                <Download size={14} /> Download <ChevronDown size={12} />
              </button>
              {openDownload && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpenDownload(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-border rounded-xl shadow-xl p-1.5 min-w-[200px]">
                    <button onClick={handleDownloadCSV} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors text-left">
                      <FileText size={16} className="text-emerald-600" /> Download CSV
                    </button>
                    <button onClick={handleDownloadExcel} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors text-left">
                      <FileSpreadsheet size={16} className="text-blue-600" /> Download Excel
                    </button>
                    <button onClick={handleDownloadPDF} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors text-left">
                      <File size={16} className="text-red-500" /> Download PDF
                    </button>
                  </div>
                </>
              )}
            </div>
            <button onClick={() => { setSelected(null); setModalMode("create"); }} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-blue-700 transition-colors">
              <Plus size={14} /> Tambah Vendor
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <SearchX size={40} className="mx-auto mb-3 opacity-40" />
              <div className="font-semibold text-foreground mb-1">Tidak ditemukan</div>
              <div className="text-sm">Coba ubah kata kunci pencarian.</div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  {["ID", "Nama Vendor", "Kategori", "Kontak", "Rating", "Nilai Kontrak", "Status", "Aksi"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 border-b border-border font-mono text-xs">{v.id}</td>
                    <td className="px-4 py-3 border-b border-border font-semibold">{v.nama}</td>
                    <td className="px-4 py-3 border-b border-border text-muted-foreground">{v.kat}</td>
                    <td className="px-4 py-3 border-b border-border text-muted-foreground font-mono text-xs">{v.kontak}</td>
                    {/* ★ ELEMEN BARU: Bintang rating di dalam tabel */}
                    <td className="px-4 py-3 border-b border-border">
                      <StarRating rating={v.rating} size={13} />
                    </td>
                    <td className="px-4 py-3 border-b border-border font-mono text-xs font-semibold">{v.nilai}</td>
                    <td className="px-4 py-3 border-b border-border">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                        v.status === "aktif" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      }`}>
                        {v.status === "aktif" ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b border-border">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setSelected(v); setModalMode("view"); }} className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"><Eye size={14} /></button>
                        <button onClick={() => { setSelected(v); setModalMode("edit"); }} className="p-1.5 rounded hover:bg-amber-50 text-amber-600 transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => { setSelected(v); setModalMode("delete"); }} className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-border text-xs text-muted-foreground">
          <span>Menampilkan <strong className="text-foreground">{filtered.length}</strong> dari <strong className="text-foreground">{vendors.length}</strong> vendor</span>
          <span className="text-emerald-600 font-bold">{aktif} aktif</span>
        </div>
      </div>

      {/* Modals */}
      {modalMode === "create" && <FormModal mode="create" initialData={null} onSave={handleCreate} onClose={close} />}
      {modalMode === "edit" && selected && <FormModal mode="edit" initialData={selected} onSave={handleUpdate} onClose={close} />}
      {modalMode === "view" && selected && <ViewModal data={selected} onClose={close} />}
      {modalMode === "delete" && selected && <ConfirmModal vendor={selected} onConfirm={handleDelete} onClose={close} />}

      <ToastContainer toasts={toasts} />
    </div>
  );
}