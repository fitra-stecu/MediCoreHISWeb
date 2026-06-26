import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Download, Plus, FileSpreadsheet, FileText, X, CheckCircle, ChevronRight, Trash2, Eye, Pencil } from "lucide-react";
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

function Badge({ variant, children }: { variant: string; children: React.ReactNode }) {
  const map: Record<string, string> = {
    danger: "bg-red-100 text-red-700",
    warning: "bg-amber-100 text-amber-700",
    default: "bg-gray-100 text-gray-700",
    aktif: "bg-emerald-100 text-emerald-700",
    proses: "bg-blue-100 text-blue-700",
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
//  TYPES & DATA
// ═══════════════════════════════════════════════════════════════
interface SerahTerima {
  id: string; tgl: string; manifest: string; jenis: string; vol: string;
  vendor: string; driver: string; kendaraan: string; petugas: string; status: string;
}

const INITIAL_RECORDS: SerahTerima[] = [
  { id: "ST-2026-0451", tgl: "22 Jun 2026", manifest: "WM-2026-0451", jenis: "Infeksius", vol: "85 kg", vendor: "PT Wastec Intl", driver: "Sugeng W.", kendaraan: "B 1234 XY", petugas: "Sanitarian Hendra P.", status: "proses" },
  { id: "ST-2026-0450", tgl: "21 Jun 2026", manifest: "WM-2026-0450", jenis: "Patologis", vol: "12 kg", vendor: "PT Wastec Intl", driver: "Ahmad S.", kendaraan: "B 5678 XZ", petugas: "Sanitarian Hendra P.", status: "selesai" },
  { id: "ST-2026-0449", tgl: "20 Jun 2026", manifest: "WM-2026-0449", jenis: "B3 Kimia", vol: "45 L", vendor: "PT PPLI", driver: "Budiono", kendaraan: "D 9012 AB", petugas: "Sanitarian Hendra P.", status: "selesai" },
];

// ═══════════════════════════════════════════════════════════════
//  MODAL: BUAT SERAH TERIMA
// ═══════════════════════════════════════════════════════════════
function SerahTerimaFormModal({ onSave, onCancel }: {
  onSave: (data: Omit<SerahTerima, "id" | "status">) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState({
    tgl: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
    manifest: "", jenis: "Infeksius", vol: "", vendor: "", driver: "", kendaraan: "", petugas: "",
  });
  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));
  const isValid = form.manifest !== "" && form.vol !== "" && form.vendor !== "" && form.driver !== "" && form.kendaraan !== "" && form.petugas !== "";
  
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSave(form);
  };

  const fc = "w-full px-3.5 py-2.5 rounded-lg border border-border bg-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50";
  const lc = "block text-xs font-semibold text-foreground mb-1.5";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold text-base">Buat Serah Terima Baru</h3>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X size={16} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lc}>Tanggal</label><input type="text" className={fc} value={form.tgl} onChange={(e) => set("tgl", e.target.value)} /></div>
              <div><label className={lc}>No. Manifest</label><input type="text" className={fc} value={form.manifest} onChange={(e) => set("manifest", e.target.value)} placeholder="WM-2026-xxxx" autoFocus /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lc}>Jenis Limbah</label>
                <select className={fc} value={form.jenis} onChange={(e) => set("jenis", e.target.value)}>
                  <option value="Infeksius">Infeksius</option><option value="B3 Kimia">B3 Kimia</option>
                  <option value="Patologis">Patologis</option><option value="Farmasi">Farmasi</option>
                </select>
              </div>
              <div><label className={lc}>Volume</label><input type="text" className={fc} value={form.vol} onChange={(e) => set("vol", e.target.value)} placeholder="cth: 85 kg" /></div>
            </div>
            <div><label className={lc}>Vendor Penerima</label><input type="text" className={fc} value={form.vendor} onChange={(e) => set("vendor", e.target.value)} placeholder="cth: PT Wastec Intl" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lc}>Nama Driver</label><input type="text" className={fc} value={form.driver} onChange={(e) => set("driver", e.target.value)} placeholder="Nama lengkap" /></div>
              <div><label className={lc}>No. Kendaraan</label><input type="text" className={fc} value={form.kendaraan} onChange={(e) => set("kendaraan", e.target.value)} placeholder="cth: B 1234 XY" /></div>
            </div>
            <div><label className={lc}>Petugas RS (Penyerah)</label><input type="text" className={fc} value={form.petugas} onChange={(e) => set("petugas", e.target.value)} placeholder="cth: Sanitarian Hendra P." /></div>
          </div>
          <div className="flex justify-end gap-2 p-4 border-t border-border bg-muted/50 rounded-b-2xl">
            <button type="button" className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors" onClick={onCancel}>Batal</button>
            <button type="submit" disabled={!isValid} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"><Plus size={14} /> Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  KOMPONEN UTAMA
// ═══════════════════════════════════════════════════════════════
export default function WasteSerah() {
  const [records, setRecords] = useState<SerahTerima[]>(INITIAL_RECORDS);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExportMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const showToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }, []);

  // ── Data siap export ──
  const exportData = useMemo(() => records.map((r) => ({
    "ID Serah Terima": r.id,
    "Tanggal": r.tgl,
    "No. Manifest": r.manifest,
    "Jenis Limbah": r.jenis,
    "Volume": r.vol,
    "Vendor Penerima": r.vendor,
    "Driver": r.driver,
    "Kendaraan": r.kendaraan,
    "Petugas RS": r.petugas,
    "Status": r.status === "selesai" ? "Selesai" : "Dalam Proses",
  })), [records]);

  const fileName = `berita_acara_serah_terima_${new Date().toISOString().split("T")[0]}`;

  const handleExportCSV = () => {
    setShowExportMenu(false);
    downloadCSV(exportData, fileName);
    showToast("Berita Acara berhasil di-export ke CSV", "info");
  };

  const handleExportExcel = () => {
    setShowExportMenu(false);
    downloadExcel(exportData, fileName);
    showToast("Berita Acara berhasil di-export ke Excel", "info");
  };

  const handleCreate = (data: Omit<SerahTerima, "id" | "status">) => {
    const newId = `ST-${new Date().getFullYear()}-${String(records.length + 452).padStart(4, "0")}`;
    setRecords((p) => [{ ...data, id: newId, status: "proses" }, ...p]);
    setShowCreateModal(false);
    showToast(`Serah terima ${newId} berhasil dibuat`, "success");
  };

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Serah Terima Vendor – Berita Acara" breadcrumbs={["Modul 21 – Limbah", "Serah Terima Vendor"]}>
        <div className="flex gap-2">
          
          {/* ── Dropdown Cetak BA ── */}
          <div className="relative" ref={exportRef}>
            <Btn variant="ghost" size="sm" onClick={() => setShowExportMenu(!showExportMenu)}>
              <Download size={13} /> Cetak BA
            </Btn>
            {showExportMenu && (
              <div className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-lg border border-border py-1 z-50 min-w-[200px]">
                <button onClick={handleExportCSV} className="w-full text-left px-4 py-2.5 text-xs hover:bg-muted transition-colors flex items-center gap-2.5 text-foreground">
                  <FileText size={15} className="text-emerald-600" />
                  <div>
                    <div className="font-semibold">Export CSV</div>
                    <div className="text-[10px] text-muted-foreground">Kompatibel dengan semua sistem</div>
                  </div>
                </button>
                <button onClick={handleExportExcel} className="w-full text-left px-4 py-2.5 text-xs hover:bg-muted transition-colors flex items-center gap-2.5 text-foreground">
                  <FileSpreadsheet size={15} className="text-green-700" />
                  <div>
                    <div className="font-semibold">Export Excel (.xlsx)</div>
                    <div className="text-[10px] text-muted-foreground">Format Microsoft Excel</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <Btn size="sm" onClick={() => setShowCreateModal(true)}><Plus size={13} /> Buat Serah Terima</Btn>
        </div>
      </PageHeader>

      <SectionCard title="Rekap Serah Terima Limbah">
        <TableWrapper>
          <thead><tr><Th>ID</Th><Th>Tanggal</Th><Th>Manifest</Th><Th>Jenis</Th><Th>Volume</Th><Th>Vendor</Th><Th>Driver / Kendaraan</Th><Th>Petugas RS</Th><Th>Status</Th><Th>Aksi</Th></tr></thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id} className="hover:bg-muted/40">
                <Td mono>{r.id}</Td>
                <Td>{r.tgl}</Td>
                <Td mono>{r.manifest}</Td>
                <Td><Badge variant={r.jenis === "Infeksius" ? "danger" : r.jenis === "B3 Kimia" ? "warning" : "default"}>{r.jenis}</Badge></Td>
                <Td mono>{r.vol}</Td>
                <Td>{r.vendor}</Td>
                <Td><span className="text-xs">{r.driver} · {r.kendaraan}</span></Td>
                <Td><span className="text-xs">{r.petugas}</span></Td>
                <Td><Badge variant={r.status === "selesai" ? "aktif" : "proses"}>{r.status}</Badge></Td>
                <Td><CrudActions /></Td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      </SectionCard>

      {showCreateModal && <SerahTerimaFormModal onSave={handleCreate} onCancel={() => setShowCreateModal(false)} />}
      <ToastContainer toasts={toasts} />
    </div>
  );
}