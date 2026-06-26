// src/app/components/erp/ErpCSSD.tsx

import { useState, useCallback, useMemo} from "react";
import {
  ChevronRight, Package, Droplets, CheckCircle, Thermometer, Truck,
  X, AlertTriangle, RefreshCw, Plus, Pencil, Trash2, Eye,
  Check, Info, Play, RotateCcw, Search,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════
//  PALETTE & UI PRIMITIVES
// ═══════════════════════════════════════════════════════════════
const C = {
  blue: "#1549A0", green: "#00897B", amber: "#F59E0AB",
  red: "#EF4444", purple: "#8B5CF6", teal: "#0891B2",
  emerald: "#10B981", orange: "#EA580C",
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
    proses: "bg-blue-100 text-blue-700",
    selesai: "bg-emerald-100 text-emerald-700",
    dekontaminasi: "bg-amber-100 text-amber-700",
    pengemasan: "bg-purple-100 text-purple-700",
    sterilisasi: "bg-orange-100 text-orange-700",
    distribusi: "bg-teal-100 text-teal-700",
    "siap distribusi": "bg-emerald-100 text-emerald-700",
    "belum selesai": "bg-blue-50 text-blue-700",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${cls[variant] || cls.default}`}>{children}</span>;
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
//  STEPS DATA
// ═════════════════════════════════════════════════════════════
const CSSD_STEPS = [
  { step: 1, nama: "Penerimaan Instrumen", desc: "Verifikasi dan pencatatan instrumen kotor dari ruang operasi", icon: Package, durasi: "15 mnt" },
  { step: 2, nama: "Dekontaminasi", desc: "Pembersihan manual dan mesin washer-disinfector ultrasonik", icon: Droplets, durasi: "45 mnt" },
  { step: 3, nama: "Pengecekan & Pengemasan", desc: "Inspeksi kondisi, packing dengan indikator kimia internal", icon: CheckCircle, durasi: "30 mnt" },
  { step: 4, nombre: "Sterilisasi", desc: "Autoklaf uap jenuh 134°C / EO Gas untuk instrumen sensitif panas", icon: Thermometer, durasi: "60 mnt" },
  { step: 5, nama: "Penyimpanan & Distribusi", desc: "Penyimpanan steril terkontrol dan distribusi ke unit pelayanan", icon: Truck, durasi: "20 mnt" },
];

const STEP_STATUS_MAP: Record<number, string> = {
  1: "diterima",
  2: "dekontaminasi",
  3: "pengemasan",
  4: "sterilisasi",
  5: "siap distribusi",
};

// ═════════════════════════════════════════════════════════════
//  TYPES & DATA
// ═════════════════════════════════════════════════════════════
interface Batch {
  id: string;
  instrumen: string;
  qty: number;
  step: number;
  status: string;
}

const INSTRUMEN_OPTIONS = [
  "Set Laparotomi",
  "Set Orthopedi Minor",
  "Set Partus",
  "Set Minor Surgery",
  "Set Mayor Surgery",
  "Set Urologi",
  "Set Bedah Saraf",
  "Set Thorax",
  "Set ENT",
  "Set Oftalmologi",
  "Set Onkologi",
  "Set Gigi",
  "Set Fisioterapi",
  "Set Neurologi",
  "Instrumen Umum Lainnya",
];

const INITIAL_BATCHES: Batch[] = [
  { id: "CST-0892", instrumen: "Set Laparotomi",       qty: 3, step: 5, status: "siap distribusi" },
  { id: "CST-0891", instrumen: "Set Orthopedi Minor",   qty: 2, step: 4, status: "sterilisasi" },
  { id: "CST-0890", instrumen: "Set Partus",           qty: 5, step: 3, status: "pengemasan" },
  { id: "CST-0889", instrumen: "Set Minor Surgery",   qty: 8, step: 2, status: "dekontaminasi" },
  { id: "CST-0888", instrumen: "Set Mayor Surgery",    qty: 2, step: 5, status: "siap distribusi" },
  { id: "CST-0887", instrumen: "Set Thorax",          qty: 4, step: 5, status: "selesai" },
  { id: "CST-0886", instrumen: "Set Urologi",          qty: 6, step: 3, status: "pengemasan" },
];

// ═════════════════════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════════════════════
interface Toast { id: number; message: string; type: "success" | "info" | "danger" | "warning"; }

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

// ═══════════════════════════════════════════════════════════════
//  MODAL: VIEW DETAIL
// ═══════════════════════════════════════════════════════════════
function ViewModal({ batch, onClose }: { batch: Batch; onClose: () => void }) {
  const items = [
    { l: "ID Batch", v: batch.id },
    { l: "Instrumen", v: batch.instrumen },
    { l: "Jumlah", v: `${batch.qty} set` },
    { l: "Tahap Saat Ini", v: CSSD_STEPS[Math.min(batch.step - 1, 4)].nama },
    { l: "Progress", v: `${batch.step} dari 5 tahap` },
    { l: "Status", v: batch.status },
  ];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold text-base">Detail Batch</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3">
          {items.map((item) => (
            <div key={item.l}>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">{item.l}</div>
              <div className="text-sm font-semibold text-foreground">{item.v}</div>
            </div>
          ))}
          <div className="pt-2">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Progress Lengkap</div>
            <div className="space-y-2">
              {CSSD_STEPS.map((s, i) => {
                const done = i < batch.step;
                const active = i === batch.step - 1;
                return (
                  <div key={i} className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${done ? "border-emerald-200 bg-emerald-50/50" : active ? "border-primary/30 bg-primary/5" : "border-border opacity-50"}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-emerald-500 text-white" : active ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                      {done ? <Check size={14} /> : <span className="text-xs font-bold">{s.step}</span>}
                    </div>
                    <span className={`text-xs ${done || active ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{s.nama}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto font-mono">{s.durasi}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex justify-end p-4 border-t border-border bg-muted/50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors">Tutup</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL: FORM (Create / Edit)
// ═════════════════════════════════════════════════════════════
function FormModal({
  mode, initialData, onSave, onCancel,
}: {
  mode: "create" | "edit";
  initialData: Batch | null;
  onSave: (data: Omit<Batch, "id" | "status">) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    instrumen: initialData?.instrumen ?? "",
    qty: initialData?.qty ?? "",
    step: initialData?.step ?? 1,
  });

  const set = (key: string, value: string | number) => setForm((prev) => ({ ...prev, [key]: value }));

  const isValid = form.instrumen !== "" && Number(form.qty) > 0 && Number(form.qty) <= 999;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSave({
      instrumen: form.instrumen,
      qty: Number(form.qty),
      step: form.step,
    });
  };

  const fc = "w-full px-3.5 py-2.5 rounded-lg border border-border bg-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50";
  const lc = "block text-xs font-semibold text-foreground mb-1.5";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold text-base">{mode === "create" ? "Input Batch Baru" : "Edit Batch"}</h3>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X size={16} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="p-5 space-y-4">
            <div>
              <label className={lc}>Nama Instrumen</label>
              <select className={fc} value={form.instrumen} onChange={(e) => set("instrumen", e.target.value)} autoFocus>
                <option value="">— Pilih Instrumen —</option>
                {INSTRUMEN_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lc}>Jumlah (set)</label>
                <input type="number" min="1" max="999" className={fc} value={form.qty} onChange={(e) => set("qty", e.target.value)} placeholder="cth: 5" />
              </div>
              <div>
                <label className={lc}>Tahap Awal</label>
                <select className={fc} value={String(form.step)} onChange={(e) => set("step", Number(e.target.value))}>
                  {CSSD_STEPS.map((s) => (
                    <option key={s.step} value={s.step}>
                      {s.step}. {s.nama} ({s.durasi})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isValid && (
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Preview</div>
                <div className="text-xs text-blue-800">
                  <span className="font-mono font-bold">{mode === "create" ? "CST-" + String(Math.max(...INITIAL_BATCHES.map(b => parseInt(b.id.replace(/\D/g, ""), 10))) + 1).padStart(4, "0") : initialData?.id}</span>
                  {" "}— {form.instrumen} ({form.qty} set, mulai dari tahap {CSSD_STEPS[form.step - 1].nama})
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 p-4 border-t border-border bg-muted/50 rounded-b-2xl">
            <button type="button" className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors" onClick={onCancel}>Batal</button>
            <button type="submit" disabled={!isValid} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Plus size={14} /> {mode === "create" ? "Input Batch" : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL: KONFIRMASI HAPUS
// ═══════════════════════════════════════════════════════════════
function ConfirmModal({ batch, onConfirm, onCancel }: { batch: Batch; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
          <h4 className="font-bold text-base mb-2">Hapus Batch?</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Anda akan menghapus <strong>{batch.id}</strong> ({batch.instrumen}, {batch.qty} set). Tindakan ini tidak bisa dibatalkan.
          </p>
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
//  KOMPONENEN UTAMA
// ═════════════════════════════════════════════════════════════
export default function ERPCSSD() {
  const [batches, setBatches] = useState<Batch[]>(INITIAL_BATCHES);
  const [activeStep, setActiveStep] = useState(0);
  const [modal, setModal] = useState<null | "create" | "edit" | "view" | "delete">(null);
  const [selected, setSelected] = useState<Batch | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  const generateId = () => {
    if (batches.length === 0) return "CST-0891";
    const nums = batches.map((b) => parseInt(b.id.replace(/\D/g, ""), 10));
    return "CST-" + String(Math.max(...nums) + 1).padStart(4, "0");
  };

  const openCreate = () => { setSelected(null); setModal("create"); };
  const openEdit = (b: Batch) => { setSelected(b); setModal("edit"); };
  const openView = (b: Batch) => { setSelected(b); setModal("view"); };
  const openDelete = (b: Batch) => { setSelected(b); setModal("delete"); };
  const close = () => { setModal(null); setSelected(null); };

  const handleCreate = (data: Omit<Batch, "id" | "status">) => {
    const newBatch: Batch = {
      id: generateId(),
      ...data,
      status: STEP_STATUS_MAP[data.step] || "diterima",
    };
    setBatches((prev) => [newBatch, ...prev]);
    close();
    showToast(`Batch ${newBatch.id} diinput — ${data.instrumen}`);
  };

  const handleUpdate = (data: Omit<Batch, "id" | "status">) => {
    if (!selected) return;
    setBatches((prev) =>
      prev.map((b) =>
        b.id === selected.id ? { ...b, ...data, status: STEP_STATUS_MAP[data.step] || b.status } : b
      )
    );
    close();
    showToast(`Batch ${selected.id} diperbarui`);
  };

  const handleDelete = () => {
    if (!selected) return;
    const id = selected.id;
    setBatches((prev) => prev.filter((b) => b.id !== id));
    close();
    showToast(`Batch ${id} dihapus`, "danger");
  };

  const handleAdvance = (b: Batch) => {
    if (b.step >= 5) return;
    const nextStep = b.step + 1;
    setBatches((prev) =>
      prev.map((item) =>
        item.id === b.id
          ? { ...item, step: nextStep, status: STEP_STATUS_MAP[nextStep] || item.status }
          : item
      )
    );
    showToast(`${b.id} dilanjutkan ke tahap ${CSSD_STEPS[nextStep - 1].nama}`, "success");
  };

  const handleReset = (b: Batch) => {
    if (b.step <= 1) return;
    setBatches((prev) =>
      prev.map((item) =>
        item.id === b.id
          ? { ...item, step: 1, status: "diterima" }
          : item
      )
    );
    showToast(`${b.id} direset ke tahap 1`, "warning");
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setBatches((prev) =>
        prev.map((b) => {
          if (b.step >= 5) return { ...b, status: "selesai" };
          const nextStep = b.step + 1;
          return { ...b, step: nextStep, status: STEP_STATUS_MAP[nextStep] || b.status };
        })
      );
      setRefreshing(false);
      showToast("Semua batch diperbarui", "info");
    }, 1500);
  };

  const filteredBatches = useMemo(() => {
    if (activeStep === 0) return batches;
    if (activeStep === 6) return batches.filter((b) => b.step < 5);
    return batches.filter((b) => b.step === activeStep);
  }, [batches, activeStep]);

  const totalInstrumen = batches.reduce((s, b) => s + b.qty, 0);
  const belumSelesai = batches.filter((b) => b.step < 5).length;
  const selesai = batches.filter((b) => b.step >= 5).length;
  const filterLabel = activeStep === 0 ? "Semua Batch" : activeStep === 6 ? "Belum Selesai" : CSSD_STEPS[activeStep - 1]?.nama ?? "";
  const canAdvance = (b: Batch) => b.step < 5;
  const canReset = (b: Batch) => b.step > 1;

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="CSSD Sterilization Workflow" breadcrumbs={["Modul 10 – ERP", "CSSD Sterilization"]}>
        <div className="flex gap-2">
          <Btn variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Updating..." : "Refresh All"}
          </Btn>
          <Btn size="sm" onClick={openCreate}><Plus size={13} /> Input Batch Baru</Btn>
        </div>
      </PageHeader>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: C.blue + "18" }}>
            <Package size={16} style={{ color: C.blue }} />
          </div>
          <div>
            <div className="text-xl font-bold text-foreground font-mono">{batches.length}</div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total Batch</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: C.amber + "18" }}>
            <Thermometer size={16} style={{ color: C.amber }} />
          </div>
          <div>
            <div className="text-xl font-bold text-foreground font-mono">{belumSelesai}</div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Belum Selesai</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: C.emerald + "18" }}>
            <CheckCircle size={16} style={{ color: C.emerald }} />
          </div>
          <div>
            <div className="text-xl font-bold text-foreground font-mono">{selesai}</div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Selesai</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-sm text-foreground">Alur Proses Sterilisasi</h4>
          <span className="text-[10px] font-mono text-muted-foreground">{totalInstrumen} instrumen total</span>
        </div>
        <div className="flex items-start gap-0 overflow-x-auto pb-2">
          <div className="flex flex-col items-center gap-2 cursor-pointer w-28 shrink-0 text-center p-3 rounded-xl transition-all border-2 border-transparent hover:bg-muted/50" onClick={() => setActiveStep(0)}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeStep === 0 ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
              <span className="text-xs font-bold">All</span>
            </div>
            <div className="text-xs font-semibold text-foreground leading-tight">Semua Batch</div>
          </div>
          <div className="flex flex-col items-center gap-2 cursor-pointer w-28 shrink-0 text-center p-3 rounded-xl transition-all border-2 border-transparent hover:bg-muted/50" onClick={() => setActiveStep(6)}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeStep === 6 ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"}`}>
              <AlertTriangle size={16} />
            </div>
            <div className="text-xs font-semibold leading-tight text-foreground">Belum Selesai</div>
            {belumSelesai > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold rounded-md mt-0.5">{belumSelesai}</span>
            )}
          </div>
          {CSSD_STEPS.map((s) => {
            const isActive = activeStep === s.step;
            const isDone = activeStep === 0 ? false : activeStep > s.step;
            const count = activeStep === 0
              ? batches.length
              : activeStep === 6
                ? batches.filter((b) => b.step < 5).length
                : batches.filter((b) => b.step === s.step).length;
            return (
              <div key={s.step} className="flex items-center">
                <div className={`flex flex-col items-center gap-2 cursor-pointer w-28 shrink-0 text-center p-3 rounded-xl transition-all border-2 ${isActive ? "bg-primary/10 border-primary" : isDone ? "opacity-70 border-transparent hover:bg-muted/50" : "opacity-50 border-transparent hover:bg-muted/50"}`} onClick={() => setActiveStep(s.step)}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDone || isActive ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                    {isDone ? <Check size={18} /> : <s.icon size={18} />}
                  </div>
                  <div className="text-xs font-semibold text-foreground leading-tight">{s.nama}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{s.durasi}</div>
                  {count > 0 && (
                    <span className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-bold rounded-md mt-0.5 ${isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{count}</span>
                  )}
                </div>
                {s.step < 5 && (
                  <div className={`w-8 h-0.5 shrink-0 ${isDone ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{filterLabel}:</span>{" "}
          {activeStep === 0 ? "Menampilkan semua batch" : activeStep === 6 ? "Batch yang belum mencapai tahap 5" : CSSD_STEPS[activeStep - 1].desc}
        </div>
      </div>

      <SectionCard
        title={`Batch Sterilisasi${filterLabel !== "Semua Batch" ? ` — ${filterLabel}` : ""}`}
        actions={<span className="text-xs text-muted-foreground">Menampilkan <strong className="text-foreground">{filteredBatches.length}</strong> dari <strong className="text-foreground">{batches.length}</strong></span>}
      >
        {filteredBatches.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">Tidak ada batch di filter ini</div>
        ) : (
          <TableWrapper>
            <thead>
              <tr>
                <Th>ID Batch</Th>
                <Th>Instrumen</Th>
                <Th>Qty</Th>
                <Th>Progress</Th>
                <Th>Tahap</Th>
                <Th>Status</Th>
                <Th>Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.map((b) => (
                <tr key={b.id} className="hover:bg-muted/40 transition-colors">
                  <Td mono>{b.id}</Td>
                  <Td><span className="font-medium">{b.instrumen}</span></Td>
                  <Td mono>{b.qty} set</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <ProgressBar value={b.step} max={5} color={b.step >= 5 ? C.emerald : C.green} />
                      <span className="text-xs font-mono">{b.step}/5</span>
                    </div>
                  </Td>
                  <Td>{CSSD_STEPS[Math.min(b.step - 1, 4)].nama}</Td>
                  <Td><Badge variant={b.status as any}>{b.status}</Badge></Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openView(b)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors" title="Lihat Detail"><Eye size={14} /></button>
                      <button onClick={() => openEdit(b)} className="p-1.5 rounded hover:bg-amber-50 text-amber-600 transition-colors" title="Edit"><Pencil size={14} /></button>
                      <button onClick={() => openDelete(b)} className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors" title="Hapus"><Trash2 size={14} /></button>
                      {canAdvance(b) && (
                        <button onClick={() => handleAdvance(b)} className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600 transition-colors" title="Lanjutkan ke tahap berikutnya"><Play size={14} /></button>
                      )}
                      {canReset(b) && (
                        <button onClick={() => handleReset(b)} className="p-1.5 rounded hover:bg-amber-50 text-amber-600 transition-colors" title="Reset ke tahap 1"><RotateCcw size={14} /></button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        )}
      </SectionCard>

      {modal === "create" && <FormModal mode="create" initialData={null} onSave={handleCreate} onCancel={close} />}
      {modal === "edit" && selected && <FormModal mode="edit" initialData={selected} onSave={handleUpdate} onCancel={close} />}
      {modal === "view" && selected && <ViewModal batch={selected} onClose={close} />}
      {modal === "delete" && selected && <ConfirmModal batch={selected} onConfirm={handleDelete} onCancel={close} />}

      <ToastContainer toasts={toasts} />
    </div>
  );
}