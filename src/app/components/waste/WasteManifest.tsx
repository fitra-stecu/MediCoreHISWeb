import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Download, Plus, Filter, Calendar, X, CheckCircle, ChevronRight, Trash2, Eye, Pencil, FileSpreadsheet, FileText } from "lucide-react";
import { downloadCSV } from "../../../helpers/exportCsv";
import { downloadExcel } from "../../../helpers/exportExcel";
// ═══════════════════════════════════════════════════════════════
//  UI PRIMITIVES (self-contained agar tidak dependensi luar)
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
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}>
      {children}
    </button>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted border-b border-border whitespace-nowrap">{children}</th>;
}
function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return <td className={`px-4 py-3 border-b border-border text-sm text-foreground ${mono ? "font-mono text-xs" : ""}`}>{children}</td>;
}

function TableWrapper({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto -mx-5"><table className="w-full text-sm">{children}</table></div>;
}

function SearchBar({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <input
      type="text" placeholder={placeholder} value={value} onChange={onChange}
      className="px-3.5 py-2 rounded-lg border border-border bg-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 min-w-[220px]"
    />
  );
}

function Badge({ variant, children }: { variant: string; children: React.ReactNode }) {
  const map: Record<string, string> = {
    danger: "bg-red-100 text-red-700",
    warning: "bg-amber-100 text-amber-700",
    default: "bg-gray-100 text-gray-700",
    Diterima: "bg-emerald-100 text-emerald-700",
    Diproses: "bg-blue-100 text-blue-700",
    Ditolak: "bg-red-100 text-red-700",
    Disposal: "bg-gray-100 text-gray-600",
  };
  return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${map[variant] || map.default}`}>{children}</span>;
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
//  TYPES & DATA
// ═══════════════════════════════════════════════════════════════
interface Manifest {
  id: string; tgl: string; jenis: string; vol: string; sumber: string; vendor: string; status: string;
}

const wasteManifestData: Manifest[] = [
  { id: "MNF-240115-001", tgl: "2025-01-15", jenis: "Infeksius", vol: "85 kg", sumber: "IRNA Lantai 3", vendor: "Truk Hijau HT-1234", status: "Diterima" },
  { id: "MNF-240115-002", tgl: "2025-01-15", jenis: "B3 Kimia", vol: "32 kg", sumber: "Ruang Operasi Pusat", vendor: "Truk Kuning RK-089", status: "Diproses" },
  { id: "MNF-240115-003", tgl: "2025-01-14", jenis: "Patologis", vol: "12 kg", sumber: "Lab Patologi", vendor: "Motor Box MB-01", status: "Diterima" },
  { id: "MNF-240115-004", tgl: "2025-01-14", jenis: "Infeksius", vol: "48 kg", sumber: "IGD", vendor: "Truk Hijau HT-1234", status: "Disposal" },
  { id: "MNF-240115-005", tgl: "2025-01-13", jenis: "Farmasi", vol: "18 kg", sumber: "Farmasi Rawat Jalan", vendor: "Truk Biru FK-221", status: "Diterima" },
  { id: "MNF-240115-006", tgl: "2025-01-13", jenis: "Infeksius", vol: "62 kg", sumber: "IRNA Lantai 5", vendor: "Truk Hijau HT-1234", status: "Diproses" },
  { id: "MNF-240115-007", tgl: "2025-01-12", jenis: "B3 Kimia", vol: "25 kg", sumber: "Lab Kimia Klinik", vendor: "Truk Kuning RK-089", status: "Diterima" },
  { id: "MNF-240115-008", tgl: "2025-01-12", jenis: "Non-Medis", vol: "110 kg", sumber: "Poliklinik Umum", vendor: "Mobil Angkut LA-01", status: "Diterima" },
];

// ═══════════════════════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════════════════════
interface Toast { id: number; message: string; type: "success" | "info" | "danger" | "warning"; }
function ToastContainer({ toasts }: { toasts: Toast[] }) {
  const colorMap = { success: "bg-emerald-600", danger: "bg-red-600", info: "bg-blue-700", warning: "bg-amber-500" };
  return (
    <div className="fixed top-5 right-5 z-[200] flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-white text-sm font-semibold shadow-lg animate-[slideIn_0.3s_ease] ${colorMap[t.type]}`}>
          <CheckCircle size={16} /> {t.message}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL: INPUT MANIFEST BARU
// ═══════════════════════════════════════════════════════════════
function ManifestFormModal({ onSave, onCancel }: {
  onSave: (data: Omit<Manifest, "id">) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState({
    tgl: new Date().toISOString().split("T")[0],
    jenis: "Infeksius", vol: "", sumber: "", vendor: "", status: "Diterima",
  });
  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));
  const isValid = form.sumber !== "" && form.vol !== "" && form.vendor !== "";
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSave({ tgl: form.tgl, jenis: form.jenis, vol: form.vol, sumber: form.sumber, vendor: form.vendor, status: form.status });
  };
  const fc = "w-full px-3.5 py-2.5 rounded-lg border border-border bg-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50";
  const lc = "block text-xs font-semibold text-foreground mb-1.5";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold text-base">Input Manifest Baru</h3>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X size={16} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lc}>Tanggal</label><input type="date" className={fc} value={form.tgl} onChange={(e) => set("tgl", e.target.value)} /></div>
              <div>
                <label className={lc}>Jenis Limbah</label>
                <select className={fc} value={form.jenis} onChange={(e) => set("jenis", e.target.value)}>
                  <option value="Infeksius">Infeksius</option><option value="B3 Kimia">B3 Kimia</option>
                  <option value="Patologis">Patologis</option><option value="Farmasi">Farmasi</option>
                  <option value="Non-Medis">Non-Medis</option>
                </select>
              </div>
            </div>
            <div><label className={lc}>Sumber / Asal</label><input type="text" className={fc} value={form.sumber} onChange={(e) => set("sumber", e.target.value)} placeholder="cth: IRNA Lantai 3" autoFocus /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lc}>Volume</label><input type="text" className={fc} value={form.vol} onChange={(e) => set("vol", e.target.value)} placeholder="cth: 85 kg" /></div>
              <div>
                <label className={lc}>Status</label>
                <select className={fc} value={form.status} onChange={(e) => set("status", e.target.value)}>
                  <option value="Diterima">Diterima</option><option value="Diproses">Diproses</option>
                  <option value="Ditolak">Ditolak</option><option value="Disposal">Disposal</option>
                </select>
              </div>
            </div>
            <div><label className={lc}>Vendor Transporter</label><input type="text" className={fc} value={form.vendor} onChange={(e) => set("vendor", e.target.value)} placeholder="cth: Truk Hijau HT-1234" /></div>
          </div>
          <div className="flex justify-end gap-2 p-4 border-t border-border bg-muted/50 rounded-b-2xl">
            <button type="button" className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors" onClick={onCancel}>Batal</button>
            <button type="submit" disabled={!isValid} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"><Plus size={14} /> Input Manifest</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  KOMPONEN UTAMA
// ═══════════════════════════════════════════════════════════════
export default function WasteManifest() {
  const [manifests, setManifests] = useState<Manifest[]>(wasteManifestData);
  const [search, setSearch] = useState("");
  const [filterJenis, setFilterJenis] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState("");
  const [showFilterJenis, setShowFilterJenis] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const filterRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilterJenis(false);
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) setShowDatePicker(false);
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExportMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    return manifests.filter((m) => {
      const matchSearch = m.id.toLowerCase().includes(search.toLowerCase());
      const matchJenis = !filterJenis || m.jenis === filterJenis;
      const matchDate = !filterDate || m.tgl === filterDate;
      return matchSearch && matchJenis && matchDate;
    });
  }, [manifests, search, filterJenis, filterDate]);

  const jenisOptions = useMemo(() => [...new Set(manifests.map((m) => m.jenis))], [manifests]);
  const activeFilterCount = (filterJenis ? 1 : 0) + (filterDate ? 1 : 0);

  const showToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }, []);

  // ── Data siap export (format flat object) ──
  const exportData = useMemo(() => filtered.map((m) => ({
    "ID Manifest": m.id,
    "Tanggal": m.tgl,
    "Jenis Limbah": m.jenis,
    "Volume": m.vol,
    "Sumber": m.sumber,
    "Vendor Transporter": m.vendor,
    "Status": m.status,
  })), [filtered]);

  const fileName = `manifest_limbah_${new Date().toISOString().split("T")[0]}`;

  // ── Export via helper project ──
  const handleExportCSV = () => {
    setShowExportMenu(false);
    downloadCSV(exportData, fileName);
    showToast(`${filtered.length} manifest di-export ke CSV`, "info");
  };

  const handleExportExcel = () => {
    setShowExportMenu(false);
    downloadExcel(exportData, fileName);
    showToast(`${filtered.length} manifest di-export ke Excel`, "info");
  };

  const handleCreate = (data: Omit<Manifest, "id">) => {
    const id = "MNF-" + Date.now().toString().slice(-6);
    setManifests((p) => [{ ...data, id }, ...p]);
    setShowCreateModal(false);
    showToast(`Manifest ${id} berhasil diinput — ${data.sumber} (${data.vol})`);
  };

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Tracking Manifest Limbah Infeksius" breadcrumbs={["Modul 21 – Limbah", "Tracking Manifest"]}>
        <div className="flex gap-2">

          {/* ── Export Dropdown ── */}
          <div className="relative" ref={exportRef}>
            <Btn variant="ghost" size="sm" onClick={() => { setShowExportMenu(!showExportMenu); setShowFilterJenis(false); setShowDatePicker(false); }}>
              <Download size={13} /> Export
            </Btn>
            {showExportMenu && (
              <div className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-lg border border-border py-1 z-50 min-w-[200px]">
                <button
                  onClick={handleExportCSV}
                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-muted transition-colors flex items-center gap-2.5 text-foreground"
                >
                  <FileText size={15} className="text-emerald-600" />
                  <div>
                    <div className="font-semibold">Export CSV</div>
                    <div className="text-[10px] text-muted-foreground">Kompatibel dengan semua sistem</div>
                  </div>
                </button>
                <button
                  onClick={handleExportExcel}
                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-muted transition-colors flex items-center gap-2.5 text-foreground"
                >
                  <FileSpreadsheet size={15} className="text-green-700" />
                  <div>
                    <div className="font-semibold">Export Excel (.xlsx)</div>
                    <div className="text-[10px] text-muted-foreground">Format Microsoft Excel</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <Btn size="sm" onClick={() => setShowCreateModal(true)}><Plus size={13} /> Input Manifest Baru</Btn>
        </div>
      </PageHeader>

      <div className="flex gap-3 flex-wrap items-center">
        <SearchBar placeholder="Cari nomor manifest..." value={search} onChange={(e) => setSearch(e.target.value)} />

        <div className="relative" ref={filterRef}>
          <Btn variant="ghost" size="sm" onClick={() => { setShowFilterJenis(!showFilterJenis); setShowDatePicker(false); setShowExportMenu(false); }}>
            <Filter size={13} /> Filter Jenis
            {filterJenis && <span className="ml-1 w-4 h-4 rounded-full bg-primary text-white text-[10px] inline-flex items-center justify-center font-bold">1</span>}
          </Btn>
          {showFilterJenis && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-border py-1 z-50 min-w-[170px]">
              <button className={`w-full text-left px-3.5 py-2 text-xs hover:bg-muted transition-colors flex items-center justify-between ${!filterJenis ? "text-primary font-semibold" : ""}`} onClick={() => { setFilterJenis(null); setShowFilterJenis(false); }}>
                Semua Jenis {!filterJenis && <CheckCircle size={13} />}
              </button>
              {jenisOptions.map((j) => (
                <button key={j} className={`w-full text-left px-3.5 py-2 text-xs hover:bg-muted transition-colors flex items-center justify-between ${filterJenis === j ? "text-primary font-semibold" : ""}`} onClick={() => { setFilterJenis(filterJenis === j ? null : j); setShowFilterJenis(false); }}>
                  {j} {filterJenis === j && <CheckCircle size={13} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative" ref={dateRef}>
          <Btn variant="ghost" size="sm" onClick={() => { setShowDatePicker(!showDatePicker); setShowFilterJenis(false); setShowExportMenu(false); }}>
            <Calendar size={13} /> Pilih Tanggal
            {filterDate && <span className="ml-1 w-4 h-4 rounded-full bg-primary text-white text-[10px] inline-flex items-center justify-center font-bold">1</span>}
          </Btn>
          {showDatePicker && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-border p-3 z-50 flex items-center gap-2">
              <input type="date" className="px-2.5 py-1.5 rounded-lg border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/30" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
              {filterDate && <button onClick={() => setFilterDate("")} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><X size={14} /></button>}
            </div>
          )}
        </div>

        {activeFilterCount > 0 && (
          <button onClick={() => { setFilterJenis(null); setFilterDate(""); setSearch(""); }} className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 transition-colors">
            <X size={12} /> Reset Filter ({activeFilterCount})
          </button>
        )}
      </div>

      <SectionCard title="Daftar Manifest Limbah" actions={<span className="text-xs text-muted-foreground">Menampilkan <strong className="text-foreground">{filtered.length}</strong> dari {manifests.length} manifest</span>}>
        <TableWrapper>
          <thead>
            <tr>
              <Th>ID Manifest</Th><Th>Tanggal</Th><Th>Jenis Limbah</Th><Th>Volume</Th><Th>Sumber</Th><Th>Vendor Transporter</Th><Th>Status</Th><Th>Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">Tidak ada manifest yang cocok dengan filter</td></tr>
            ) : filtered.map((m) => (
              <tr key={m.id} className="hover:bg-muted/40">
                <Td mono>{m.id}</Td>
                <Td>{m.tgl}</Td>
                <Td><Badge variant={m.jenis === "Infeksius" ? "danger" : m.jenis === "B3 Kimia" ? "warning" : "default"}>{m.jenis}</Badge></Td>
                <Td mono>{m.vol}</Td>
                <Td>{m.sumber}</Td>
                <Td>{m.vendor}</Td>
                <Td><Badge variant={m.status}>{m.status}</Badge></Td>
                <Td><CrudActions /></Td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      </SectionCard>

      {showCreateModal && <ManifestFormModal onSave={handleCreate} onCancel={() => setShowCreateModal(false)} />}
      <ToastContainer toasts={toasts} />
    </div>
  );
}