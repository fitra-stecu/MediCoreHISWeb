// src/app/components/nutrition/NutDashboard.tsx

import { useState, useCallback } from "react";
import {
  ChevronRight, Plus, Utensils, AlertTriangle, Calendar, CheckCircle,
  ArrowRight, X, Eye, Pencil, Trash2, Ban, Send,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend,
} from "recharts";

// ═══════════════════════════════════════════════════════════════
//  PALETTE & UI PRIMITIVES
// ═══════════════════════════════════════════════════════════════
const C = {
  blue: "#1549A0",
  green: "#00897B",
  teal: "#0891B2",
  amber: "#F59E0B",
  red: "#EF4444",
  emerald: "#10B981",
  orange: "#EA580C",
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
      <div className="flex items-center justify-between">
        {children && <div className="order-last">{children}</div>}
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
      </div>
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
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}>
      {children}
    </button>
  );
}

function StatCard({ label, value, sub, icon: Icon, color, trend, onClick }: {
  label: string; value: string | number; sub: string; icon: React.ElementType; color: string; trend?: string; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-4 shadow-sm border border-border flex items-center gap-3 ${onClick ? "cursor-pointer hover:shadow-md hover:border-primary/30 transition-all" : ""}`}
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "18" }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xl font-bold text-foreground font-mono">{value}</div>
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="text-[10px] text-muted-foreground">{sub}</div>
      </div>
      {trend && (
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">{trend}</span>
      )}
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

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
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
    selesai: "bg-sky-100 text-sky-700",
    dibatalkan: "bg-gray-200 text-gray-500 line-through",
    oral: "bg-blue-100 text-blue-700",
    enteral: "bg-amber-100 text-amber-700",
    parenteral: "bg-purple-100 text-purple-700",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${cls[variant] || cls.default}`}>{children}</span>;
}

// ═══════════════════════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════════════════════
interface Toast { id: number; message: string; type: "success" | "info" | "danger" | "warning"; }
function ToastContainer({ toasts }: { toasts: Toast[] }) {
  const iconMap = { success: <CheckCircle size={16} />, danger: <Trash2 size={16} />, info: <Eye size={16} />, warning: <AlertTriangle size={16} /> };
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
//  CHART DATA
// ═══════════════════════════════════════════════════════════════
const nutritionChart = [
  { hari: "Sen", protein: 82, karbo: 90, lemak: 75 },
  { hari: "Sel", protein: 78, karbo: 85, lemak: 80 },
  { hari: "Rab", protein: 85, karbo: 88, lemak: 72 },
  { hari: "Kam", protein: 80, karbo: 92, lemak: 78 },
  { hari: "Jum", protein: 88, karbo: 86, lemak: 74 },
  { hari: "Sab", protein: 75, karbo: 89, lemak: 82 },
  { hari: "Min", protein: 83, karbo: 91, lemak: 76 },
];

// ═══════════════════════════════════════════════════════════════
//  MEAL PLAN TYPES & DATA
// ═══════════════════════════════════════════════════════════════
interface MealPlan {
  id: string;
  pasien: string;
  tanggal: string;
  jenis: "Oral" | "Enteral" | "Parenteral";
  kalori: number;
  protein: number;
  status: "Aktif" | "Selesai" | "Dibatalkan";
  catatan: string;
}

const INITIAL_MEAL_PLANS: MealPlan[] = [
  { id: "MP-2025-001", pasien: "Agus Salim (P-0891)", tanggal: "2025-01-20", jenis: "Oral", kalori: 1800, protein: 65, status: "Aktif", catatan: "Diet rendah garam, batasi natrium <2g/hari" },
  { id: "MP-2025-002", pasien: "Sri Rahayu (P-0903)", tanggal: "2025-01-20", jenis: "Enteral", kalori: 1500, protein: 55, status: "Aktif", catatan: "Formula enteral via NGT, toleransi baik" },
  { id: "MP-2025-003", pasien: "Bambang S. (P-0915)", tanggal: "2025-01-19", jenis: "Oral", kalori: 2200, protein: 80, status: "Aktif", catatan: "Diet diabetes, indeks glikemik rendah" },
  { id: "MP-2025-004", pasien: "Rini P. (P-0922)", tanggal: "2025-01-18", jenis: "Parenteral", kalori: 1200, protein: 45, status: "Selesai", catatan: "TPN 3 hari, sudah migrasi ke enteral" },
  { id: "MP-2025-005", pasien: "Dewi A. (P-0934)", tanggal: "2025-01-17", jenis: "Oral", kalori: 1600, protein: 60, status: "Dibatalkan", catatan: "Pasien pulang paksa, ganti ke rawat jalan" },
];

// ═══════════════════════════════════════════════════════════════
//  MODAL: BUAT / EDIT MEAL PLAN
// ═══════════════════════════════════════════════════════════════
function MealPlanFormModal({ mode, initialData, onSave, onCancel }: {
  mode: "create" | "edit"; initialData: MealPlan | null;
  onSave: (data: Omit<MealPlan, "id">) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState({
    pasien: initialData?.pasien ?? "",
    tanggal: initialData?.tanggal ?? new Date().toISOString().split("T")[0],
    jenis: initialData?.jenis ?? "Oral",
    kalori: initialData?.kalori ?? "",
    protein: initialData?.protein ?? "",
    catatan: initialData?.catatan ?? "",
  });
  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));
  const isValid = form.pasien !== "" && Number(form.kalori) > 0 && Number(form.protein) > 0;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSave({
      pasien: form.pasien,
      tanggal: form.tanggal,
      jenis: form.jenis as MealPlan["jenis"],
      kalori: Number(form.kalori),
      protein: Number(form.protein),
      catatan: form.catatan,
      status: "Aktif",
    });
  };
  const fc = "w-full px-3.5 py-2.5 rounded-lg border border-border bg-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50";
  const lc = "block text-xs font-semibold text-foreground mb-1.5";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold text-base">{mode === "create" ? "Buat Meal Plan Baru" : "Edit Meal Plan"}</h3>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X size={16} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="p-5 space-y-4">
            <div>
              <label className={lc}>Nama Pasien</label>
              <input type="text" className={fc} value={form.pasien} onChange={(e) => set("pasien", e.target.value)} placeholder="cth: Budi Santoso (P-0940)" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lc}>Tanggal Mulai</label>
                <input type="date" className={fc} value={form.tanggal} onChange={(e) => set("tanggal", e.target.value)} />
              </div>
              <div>
                <label className={lc}>Jenis Diet</label>
                <select className={fc} value={form.jenis} onChange={(e) => set("jenis", e.target.value)}>
                  <option value="Oral">Oral</option>
                  <option value="Enteral">Enteral</option>
                  <option value="Parenteral">Parenteral (TPN)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lc}>Target Kalori (kcal)</label>
                <input type="number" min="1" className={fc} value={form.kalori} onChange={(e) => set("kalori", e.target.value)} placeholder="1800" />
              </div>
              <div>
                <label className={lc}>Target Protein (gram)</label>
                <input type="number" min="1" className={fc} value={form.protein} onChange={(e) => set("protein", e.target.value)} placeholder="65" />
              </div>
            </div>
            <div>
              <label className={lc}>Catatan Diet</label>
              <textarea className={fc + " min-h-[70px] resize-none"} value={form.catatan} onChange={(e) => set("catatan", e.target.value)} placeholder="Jenis makanan, pantangan, jadwal makan..." />
            </div>
            {isValid && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Preview</div>
                <div className="text-xs text-emerald-800">
                  {form.pasien} — {form.jenis} ({form.kalori} kcal, P: {form.protein}g)
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 p-4 border-t border-border bg-muted/50 rounded-b-2xl">
            <button type="button" className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors" onClick={onCancel}>Batal</button>
            <button type="submit" disabled={!isValid} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Plus size={14} /> {mode === "create" ? "Buat Meal Plan" : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL: VIEW DETAIL MEAL PLAN
// ═══════════════════════════════════════════════════════════════
function MealPlanViewModal({ plan, onClose }: { plan: MealPlan; onClose: () => void }) {
  const items = [
    { l: "ID Meal Plan", v: plan.id },
    { l: "Pasien", v: plan.pasien },
    { l: "Tanggal Mulai", v: plan.tanggal },
    { l: "Jenis Diet", v: plan.jenis },
    { l: "Target Kalori", v: `${plan.kalori} kcal` },
    { l: "Target Protein", v: `${plan.protein} gram` },
    { l: "Status", v: plan.status },
    { l: "Catatan", v: plan.catatan || "—" },
  ];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border"><h3 className="font-semibold text-base">Detail Meal Plan</h3><button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X size={16} /></button></div>
        <div className="p-5 space-y-3">
          {items.map((item) => (
            <div key={item.l}>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">{item.l}</div>
              <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                {item.v}
                {item.l === "Status" && <Badge variant={plan.status.toLowerCase()}>{plan.status}</Badge>}
                {item.l === "Jenis Diet" && <Badge variant={plan.jenis.toLowerCase()}>{plan.jenis}</Badge>}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end p-4 border-t border-border bg-muted/50 rounded-b-2xl"><button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors">Tutup</button></div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL: KONFIRMASI HAPUS / BATALKAN
// ═══════════════════════════════════════════════════════════════
function MealPlanConfirmModal({ type, plan, onConfirm, onCancel }: { type: "delete" | "cancel"; plan: MealPlan; onConfirm: () => void; onCancel: () => void; }) {
  const isDelete = type === "delete";
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${isDelete ? "bg-red-50" : "bg-amber-50"}`}>{isDelete ? <AlertTriangle size={28} className="text-red-500" /> : <Ban size={28} className="text-amber-500" />}</div>
          <h4 className="font-bold text-base mb-2">{isDelete ? "Hapus Meal Plan?" : "Batalkan Meal Plan?"}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{isDelete ? <>Hapus <strong>{plan.id}</strong> untuk {plan.pasien}?</> : <>Batalkan <strong>{plan.id}</strong> untuk {plan.pasien}?</>}</p>
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
export default function NutDashboard({ navigate }: { navigate: (p: string) => void }) {
  const [plans, setPlans] = useState<MealPlan[]>(INITIAL_MEAL_PLANS);
  const [modal, setModal] = useState<null | "create" | "edit" | "view" | "delete" | "cancel">(null);
  const [selected, setSelected] = useState<MealPlan | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }, []);

  const activePlans = plans.filter((p) => p.status === "Aktif").length;
  const totalPlans = plans.length;

  const openCreate = () => { setSelected(null); setModal("create"); };
  const openEdit = (p: MealPlan) => { setSelected(p); setModal("edit"); };
  const openView = (p: MealPlan) => { setSelected(p); setModal("view"); };
  const openDelete = (p: MealPlan) => { setSelected(p); setModal("delete"); };
  const openCancel = (p: MealPlan) => { setSelected(p); setModal("cancel"); };
  const close = () => { setModal(null); setSelected(null); };

  const handleCreate = (data: Omit<MealPlan, "id">) => {
    const id = "MP-2025-" + String(Math.max(...plans.map((p) => parseInt(p.id.replace(/\D/g, ""), 10)), 0) + 1).padStart(3, "0");
    setPlans((p) => [{ ...data, id }, ...p]);
    close();
    showToast(`Meal Plan ${id} dibuat untuk ${data.pasien}`);
  };
  const handleUpdate = (data: Omit<MealPlan, "id">) => {
    if (!selected) return;
    setPlans((p) => p.map((pl) => pl.id === selected.id ? { ...pl, ...data } : pl));
    close();
    showToast(`Meal Plan ${selected.id} diperbarui`);
  };
  const handleDelete = () => {
    if (!selected) return;
    const id = selected.id;
    setPlans((p) => p.filter((pl) => pl.id !== id));
    close();
    showToast(`Meal Plan ${id} dihapus`, "danger");
  };
  const handleCancel = () => {
    if (!selected) return;
    const id = selected.id;
    setPlans((p) => p.map((pl) => pl.id === id ? { ...pl, status: "Dibatalkan" as const } : pl));
    close();
    showToast(`Meal Plan ${id} dibatalkan`, "warning");
  };

  const canEdit = (p: MealPlan) => p.status === "Aktif";
  const canDelete = (p: MealPlan) => p.status === "Aktif";
  const canCancel = (p: MealPlan) => p.status === "Aktif";
  const isFinal = (p: MealPlan) => p.status === "Selesai" || p.status === "Dibatalkan";

  return (
    <div className="p-6 space-y-5">
      {/* ═══ HEADER ═══ */}
      <PageHeader title="Dashboard Nutrisi Klinis" breadcrumbs={["Modul 17 – Nutrisi", "Dashboard Nutrisi"]}>
        <Btn size="sm" onClick={openCreate}><Plus size={13} /> Buat Meal Plan</Btn>
      </PageHeader>

      {/* ═══ STAT CARDS ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pasien Terpantau" value="186" sub="hari ini" icon={Utensils} color={C.teal} trend="+8" onClick={() => navigate("nut-monitoring")} />
        <StatCard label="Alert Interaksi" value="5" sub="food-drug interaction" icon={AlertTriangle} color={C.red} onClick={() => navigate("nut-food-drug")} />
        <StatCard label="Meal Plan Aktif" value={activePlans} sub={`${totalPlans} rencana diet total`} icon={Calendar} color={C.green} onClick={() => document.getElementById("meal-plan-section")?.scrollIntoView({ behavior: "smooth", block: "start" })} />
        <StatCard label="Kepatuhan Diet" value="87.3%" sub="compliance rate" icon={CheckCircle} color={C.emerald} trend="+2.1%" onClick={() => navigate("nut-monitoring")} />
      </div>

      {/* ═══ CHART & PROGRESS ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard title="Tren Asupan Makronutrien (% AKG) – 7 Hari">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={nutritionChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hari" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[50, 100]} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v: number) => [`${v}%`, ""]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="protein" name="Protein" stroke={C.blue} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="karbo" name="Karbohidrat" stroke={C.green} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="lemak" name="Lemak" stroke={C.amber} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>
        <SectionCard title="Status Nutrisi Pasien">
          {[
            { label: "Sesuai Target", count: 142, total: 186, color: C.green },
            { label: "Defisit Nutrisi", count: 28, total: 186, color: C.red },
            { label: "Surplus / Kelebihan", count: 16, total: 186, color: C.amber },
          ].map(s => (
            <div key={s.label} className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-foreground">{s.label}</span>
                <span className="font-bold" style={{ fontFamily: "var(--font-mono)" }}>{s.count} / {s.total}</span>
              </div>
              <ProgressBar value={s.count} max={s.total} color={s.color} />
            </div>
          ))}
          <Btn variant="ghost" size="sm" onClick={() => navigate("nut-monitoring")} className="mt-2 w-full justify-center">
            <ArrowRight size={13} /> Lihat Detail Pasien
          </Btn>
        </SectionCard>
      </div>

      {/* ═══ DAFTAR MEAL PLAN ═══ */}
      <div id="meal-plan-section">
        <SectionCard
          title="Daftar Meal Plan"
          actions={
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                <strong className="text-emerald-600">{activePlans}</strong> aktif dari <strong className="text-foreground">{totalPlans}</strong> total
              </span>

            </div>
          }
        >
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <Th>ID</Th><Th>Pasien</Th><Th>Tanggal</Th><Th>Jenis</Th><Th>Kalori</Th><Th>Protein</Th><Th>Status</Th><Th>Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {plans.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-sm text-muted-foreground">Belum ada meal plan</td></tr>
                ) : (
                  plans.map((p) => (
                    <tr key={p.id} className={`hover:bg-muted/40 transition-colors ${isFinal(p) ? "opacity-60" : ""}`}>
                      <Td mono>{p.id}</Td>
                      <Td><span className="font-medium text-sm">{p.pasien}</span></Td>
                      <Td mono>{p.tanggal}</Td>
                      <Td><Badge variant={p.jenis.toLowerCase()}>{p.jenis}</Badge></Td>
                      <Td mono>{p.kalori} kcal</Td>
                      <Td mono>{p.protein} g</Td>
                      <Td><Badge variant={p.status.toLowerCase()}>{p.status}</Badge></Td>
                      <Td>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openView(p)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors" title="Lihat"><Eye size={14} /></button>
                          {canEdit(p) && <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-amber-50 text-amber-600 transition-colors" title="Edit"><Pencil size={14} /></button>}
                          {canDelete(p) && <button onClick={() => openDelete(p)} className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors" title="Hapus"><Trash2 size={14} /></button>}
                          {canCancel(p) && <button onClick={() => openCancel(p)} className="p-1.5 rounded hover:bg-amber-50 text-amber-600 transition-colors" title="Batalkan"><Ban size={14} /></button>}
                          {isFinal(p) && <span className="text-[10px] text-muted-foreground italic pl-1">Final</span>}
                        </div>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      {/* ═══ MODALS ═══ */}
      {modal === "create" && <MealPlanFormModal mode="create" initialData={null} onSave={handleCreate} onCancel={close} />}
      {modal === "edit" && selected && <MealPlanFormModal mode="edit" initialData={selected} onSave={handleUpdate} onCancel={close} />}
      {modal === "view" && selected && <MealPlanViewModal plan={selected} onClose={close} />}
      {modal === "delete" && selected && <MealPlanConfirmModal type="delete" plan={selected} onConfirm={handleDelete} onCancel={close} />}
      {modal === "cancel" && selected && <MealPlanConfirmModal type="cancel" plan={selected} onConfirm={handleCancel} onCancel={close} />}

      <ToastContainer toasts={toasts} />
    </div>
  );
}