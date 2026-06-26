import { useState, useCallback } from "react";
import {
  Plus, Search, Eye, Pencil, Trash2, Download,
  ChevronDown, X, AlertTriangle, CheckCircle, Info, SearchX,
  FileText, FileSpreadsheet, File,
} from "lucide-react";
import { downloadCSV } from "../../../helpers/exportCsv";
import { downloadExcel } from "../../../helpers/exportExcel";
import { downloadPDF } from "../../../helpers/exportPdf";
// ═══════════════════════════════════════════════════════════════
//  TYPE
// ═══════════════════════════════════════════════════════════════
interface Drug {
  id: string;
  nama: string;
  kat: string;
  stok: number;
  min: number;
  max: number;
  sat: string;
  exp: string;
  status: "normal" | "rendah" | "kritis";
}

type ModalMode = null | "create" | "edit" | "view" | "delete";

// ═══════════════════════════════════════════════════════════════
//  DATA AWAL
//  (Nanti bisa diganti fetch dari API)
// ═══════════════════════════════════════════════════════════════
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
//  SUB-KOMPONEN: Toast
// ═══════════════════════════════════════════════════════════════
interface Toast {
  id: number;
  message: string;
  type: "success" | "danger" | "info";
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  const iconMap = {
    success: <CheckCircle size={16} />,
    danger: <Trash2 size={16} />,
    info: <Info size={16} />,
  };
  const colorMap = {
    success: "bg-emerald-600",
    danger: "bg-red-600",
    info: "bg-blue-700",
  };

  return (
    <div className="fixed top-5 right-5 z-[200] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-white text-sm font-semibold shadow-lg animate-[slideIn_0.3s_ease] ${colorMap[t.type]}`}
        >
          {iconMap[t.type]}
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  SUB-KOMPONEN: Modal Form (Create / Edit)
// ═══════════════════════════════════════════════════════════════
function FormModal({
  mode,
  initialData,
  onSave,
  onClose,
}: {
  mode: "create" | "edit";
  initialData: Drug | null;
  onSave: (data: Omit<Drug, "id">) => void;
  onClose: () => void;
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

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

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
      nama: form.nama.trim(),
      kat: form.kat,
      stok: stokNum,
      min: minNum,
      max: Number(form.max),
      sat: form.sat,
      exp: form.exp,
      status: hitungStatus(stokNum, minNum),
    });
  };

  const fieldClass =
    "w-full px-3.5 py-2.5 rounded-lg border border-border bg-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50";
  const labelClass = "block text-xs font-semibold text-foreground mb-1.5";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold text-base">{mode === "create" ? "Tambah Obat Baru" : "Edit Data Obat"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X size={16} /></button>
        </div>

        {/* Form */}
        <form onSubmit={submit}>
          <div className="p-5 space-y-4">
            <div>
              <label className={labelClass}>Nama Obat</label>
              <input className={fieldClass} placeholder="cth: Amoxicillin 500mg" value={form.nama} onChange={(e) => set("nama", e.target.value)} autoFocus />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Kategori</label>
                <select className={fieldClass} value={form.kat} onChange={(e) => set("kat", e.target.value)}>
                  {["Antibiotik", "Analgesik", "Antidiabetik", "Antihipertensi", "GI", "Narkotika", "Lainnya"].map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Satuan</label>
                <select className={fieldClass} value={form.sat} onChange={(e) => set("sat", e.target.value)}>
                  {["Tab", "Kap", "Amp", "Sir", "Vial", "Pcs"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Stok Saat Ini</label>
                <input type="number" min="0" className={fieldClass} value={form.stok} onChange={(e) => set("stok", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Stok Minimum</label>
                <input type="number" min="0" className={fieldClass} value={form.min} onChange={(e) => set("min", e.target.value)} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Stok Maksimum</label>
              <input type="number" min="0" className={fieldClass} value={form.max} onChange={(e) => set("max", e.target.value)} />
            </div>

            <div>
              <label className={labelClass}>Tanggal Expired</label>
              <input type="date" className={fieldClass} value={form.exp} onChange={(e) => set("exp", e.target.value)} />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t border-border bg-muted/50 rounded-b-2xl">
            <button type="button" className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors" onClick={onClose}>
              Batal
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mode === "create" ? "Simpan Obat Baru" : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  SUB-KOMPONEN: Modal View Detail
// ═══════════════════════════════════════════════════════════════
function ViewModal({ data, onClose }: { data: Drug; onClose: () => void }) {
  const pct = Math.min(100, (data.stok / data.max) * 100);
  const barColor = data.status === "kritis" ? "bg-red-500" : data.status === "rendah" ? "bg-amber-500" : "bg-emerald-500";

  const items = [
    { label: "ID Obat", value: data.id, mono: true },
    { label: "Nama Obat", value: data.nama },
    { label: "Kategori", value: data.kat },
    { label: "Satuan", value: data.sat },
    { label: "Stok", value: data.stok.toLocaleString("id-ID"), mono: true },
    { label: "Min / Max", value: `${data.min.toLocaleString("id-ID")} / ${data.max.toLocaleString("id-ID")}`, mono: true },
    { label: "Expired", value: new Date(data.exp).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) },
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
              <div key={item.label}>
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{item.label}</div>
                <div className={`text-sm font-semibold text-foreground ${item.mono ? "font-mono text-xs" : ""}`}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Status badge */}
          <div className="mt-5">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Status</div>
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
              data.status === "normal" ? "bg-emerald-100 text-emerald-700" :
              data.status === "rendah" ? "bg-amber-100 text-amber-700" :
              "bg-red-100 text-red-700"
            }`}>
              {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
            </span>
          </div>

          {/* Progress bar */}
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
//  SUB-KOMPONEN: Modal Konfirmasi Hapus
// ═══════════════════════════════════════════════════════════════
function ConfirmModal({
  drug,
  onConfirm,
  onClose,
}: {
  drug: Drug;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
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
export default function DrugTable() {
  // ── State ──
  const [drugs, setDrugs] = useState<Drug[]>(INITIAL_DRUGS);
  const [search, setSearch] = useState("");
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Drug | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [openDownload, setOpenDownload] = useState(false);

  // ── Toast helper ──
  const toast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  // ── Filter ──
  const q = search.toLowerCase();
  const filtered = drugs.filter(
    (d) =>
      d.id.toLowerCase().includes(q) ||
      d.nama.toLowerCase().includes(q) ||
      d.kat.toLowerCase().includes(q) ||
      d.status.includes(q)
  );

  // ── Ringkasan ──
  const kritis = drugs.filter((d) => d.status === "kritis").length;
  const rendah = drugs.filter((d) => d.status === "rendah").length;

  // ── CRUD Handlers ──
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

  // ── Download CSV ──
  const handleDownloadCSV = () => {
    const today = new Date().toISOString().slice(0, 10);
    downloadCSV(
      filtered,
      `stok-obat-${today}.csv`,
      {
        id: "ID Obat",
        nama: "Nama Obat",
        kat: "Kategori",
        stok: "Stok",
        min: "Stok Minimum",
        max: "Stok Maksimum",
        sat: "Satuan",
        exp: "Tanggal Expired",
        status: "Status",
      }
    );
    setOpenDownload(false);
    toast(`CSV didownload (${filtered.length} baris)`, "info");
  };


  //excel
    const handleDownloadExcel = () => {
    const today = new Date().toISOString().slice(0, 10);
    downloadExcel(
      filtered,
      `stok-obat-${today}`,
      {
        id: "ID Obat",
        nama: "Nama Obat",
        kat: "Kategori",
        stok: "Stok",
        min: "Stok Minimum",
        max: "Stok Maksimum",
        sat: "Satuan",
        exp: "Tanggal Expired",
        status: "Status",
      }
    );
    setOpenDownload(false);
    toast(`Excel didownload (${filtered.length} baris)`, "info");
  };

  //pdf
    const handleDownloadPDF = () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      downloadPDF(
        filtered,
        `stok-obat-${today}`,
        {
          id: "ID Obat",
          nama: "Nama Obat",
          kat: "Kategori",
          stok: "Stok",
          min: "Stok Minimum",
          max: "Stok Maksimum",
          sat: "Satuan",
          exp: "Tanggal Expired",
          status: "Status",
        },
        "Laporan Stok Obat - MediCore HIS"
      );
      setOpenDownload(false);
      toast(`PDF didownload (${filtered.length} baris)`, "info");
    } catch (err) {
      console.error("PDF Error:", err);
      toast(`Gagal download PDF: ${err.message}`, "danger");
    }
  };

  // ── Modal helpers ──
  const close = () => { setModalMode(null); setSelected(null); };

  // ── Render ──
  return (
    <div className="p-6 space-y-5">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <span>MediCore HIS</span>
            <ChevronDown size={10} className="rotate-[-90deg]" />
            <span>Modul 4 – ADC</span>
            <ChevronDown size={10} className="rotate-[-90deg]" />
            <span className="text-foreground font-medium">Monitoring Stok Obat</span>
          </div>
          <h2 className="text-xl font-bold text-foreground">Monitoring Stok Obat</h2>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Obat", value: drugs.length, color: "#1549A0" },
          { label: "Normal", value: drugs.length - kritis - rendah, color: "#10B981" },
          { label: "Rendah", value: rendah, color: "#F59E0B" },
          { label: "Kritis", value: kritis, color: "#EF4444" },
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

      {/* ── Tabel Card ── */}
      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-wrap gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari ID, nama, kategori..."
              className="w-full pl-8 pr-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
            />
          </div>
          <div className="flex items-center gap-2">
  {/* Dropdown Download */}
  <div className="relative">
    <button
      onClick={() => setOpenDownload(!openDownload)}
      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors"
    >
      <Download size={14} /> Download <ChevronDown size={12} />
    </button>
    {openDownload && (
      <>
        <div className="fixed inset-0 z-40" onClick={() => setOpenDownload(false)} />
        <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-border rounded-xl shadow-xl p-1.5 min-w-[200px]">
          <button
            onClick={handleDownloadCSV}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors text-left"
          >
            <FileText size={16} className="text-emerald-600" /> Download CSV
          </button>
          <button
            onClick={handleDownloadExcel}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors text-left"
          >
            <FileSpreadsheet size={16} className="text-blue-600" /> Download Excel
          </button>
          <button
            onClick={handleDownloadPDF}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors text-left"
          >
            <File size={16} className="text-red-500" /> Download PDF
          </button>
        </div>
      </>
    )}
  </div>
  <button
              onClick={() => { setSelected(null); setModalMode("create"); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-blue-700 transition-colors"
            >
              <Plus size={14} /> Tambah Obat
            </button>
          </div>
        </div>

        {/* Tabel */}
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
                  {["ID", "Nama Obat", "Kategori", "Stok", "Level", "Sat", "Expired", "Status", "Aksi"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => {
                  const pct = Math.min(100, (d.stok / d.max) * 100);
                  const barColor = d.status === "kritis" ? "bg-red-500" : d.status === "rendah" ? "bg-amber-500" : "bg-emerald-500";
                  return (
                    <tr key={d.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 border-b border-border font-mono text-xs">{d.id}</td>
                      <td className="px-4 py-3 border-b border-border font-semibold">{d.nama}</td>
                      <td className="px-4 py-3 border-b border-border text-muted-foreground">{d.kat}</td>
                      <td className="px-4 py-3 border-b border-border font-mono text-xs">{d.stok.toLocaleString("id-ID")}</td>
                      <td className="px-4 py-3 border-b border-border">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="font-mono text-[11px] text-muted-foreground">{Math.round(pct)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b border-border text-muted-foreground">{d.sat}</td>
                      <td className="px-4 py-3 border-b border-border font-mono text-xs">{d.exp}</td>
                      <td className="px-4 py-3 border-b border-border">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                          d.status === "normal" ? "bg-emerald-100 text-emerald-700" :
                          d.status === "rendah" ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-b border-border">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setSelected(d); setModalMode("view"); }} className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"><Eye size={14} /></button>
                          <button onClick={() => { setSelected(d); setModalMode("edit"); }} className="p-1.5 rounded hover:bg-amber-50 text-amber-600 transition-colors"><Pencil size={14} /></button>
                          <button onClick={() => { setSelected(d); setModalMode("delete"); }} className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border text-xs text-muted-foreground">
          <span>Menampilkan <strong className="text-foreground">{filtered.length}</strong> dari <strong className="text-foreground">{drugs.length}</strong> data</span>
          <span>
            {kritis > 0 && <span className="text-red-600 font-bold mr-3">{kritis} kritis</span>}
            {rendah > 0 && <span className="text-amber-600 font-bold">{rendah} rendah</span>}
          </span>
        </div>
      </div>

      {/* ── Modals ── */}
      {modalMode === "create" && <FormModal mode="create" initialData={null} onSave={handleCreate} onClose={close} />}
      {modalMode === "edit" && selected && <FormModal mode="edit" initialData={selected} onSave={handleUpdate} onClose={close} />}
      {modalMode === "view" && selected && <ViewModal data={selected} onClose={close} />}
      {modalMode === "delete" && selected && <ConfirmModal drug={selected} onConfirm={handleDelete} onClose={close} />}

      {/* ── Toasts ── */}
      <ToastContainer toasts={toasts} />

      {/* ── Icon shims (karena dropdown pakai icon yang belum di-import di atas) ── */}
      {/* Ini temporary, nanti di langkah berikutnya kita import dengan benar */}
      {/* tambah import: FileText dari lucide-react */}
      
    </div>
  );
}