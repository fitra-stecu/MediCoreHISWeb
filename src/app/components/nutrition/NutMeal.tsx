// src/app/components/nutrition/NutMeal.tsx

import { useState, useCallback, useMemo } from "react";
import {
  ChevronRight, Plus, Calendar, X, AlertTriangle, CheckCircle, Info, Trash2,
} from "lucide-react";

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

function Badge({ variant = "default", children }: { variant?: string; children: React.ReactNode }) {
  const cls: Record<string, string> = {
    default: "bg-blue-100 text-blue-700",
    mingguan: "bg-sky-100 text-sky-700",
    "2 mingguan": "bg-amber-100 text-amber-700",
    bulanan: "bg-purple-100 text-purple-700",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${cls[variant] || cls.default}`}>{children}</span>;
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
//  TYPES & DATA
// ═══════════════════════════════════════════════════════════════
type PeriodType = "Mingguan" | "2 Mingguan" | "Bulanan";

interface MealPlan {
  id: string;
  nama: string;
  period: PeriodType;
  grid: string[][] | null; // null = pakai template default, kalau sudah diedit bakal berisi array
}

const ORIGINAL_GRID: string[][] = [
  ["Nasi Tim, Sup Ayam, Buah Pepaya", "Bubur Nasi, Telur Rebus, Jus Jambu", "Nasi Putih, Ikan Kukus, Sayur Bayam", "Nasi Tim, Daging Sapi Rebus, Sup Bening", "Nasi Putih, Ayam Panggang, Brokoli", "Bubur Ayam, Sayur Sop", "Nasi Tim, Ikan Tahu, Sayur"],
  ["Nasi, Ikan Bakar, Gado-gado, Buah", "Nasi, Ayam Goreng Rendah Minyak, Tumis", "Nasi, Daging Rendang (sedikit), Sayur", "Nasi, Ikan Kukus Bumbu Kuning, Urap", "Nasi, Opor Ayam (sedikit santan), Lalapan", "Nasi, Telur Balado, Sayur Asem", "Nasi, Pepes Ikan, Tumis Kangkung"],
  ["Biskuit Gandum, Susu Rendah Lemak", "Buah Pisang, Yoghurt", "Roti Gandum, Teh Tanpa Gula", "Apel, Kacang Rebus", "Pepaya, Air Putih", "Singkong Rebus, Teh Herbal", "Ubi Kukus, Susu"],
  ["Bubur Kacang Hijau, Teh Herbal", "Nasi Tim, Sup Sayuran, Tempe", "Roti Gandum, Sup Miso, Buah", "Bubur Ayam, Sayur Bening", "Nasi, Ikan Pepes, Lalapan Segar", "Nasi Tim, Telur Kukus, Bening Sayur", "Bubur, Sup Tofu, Teh Herbal"],
];

const INITIAL_PLANS: MealPlan[] = [
  { id: "RCP-001", nama: "Diet Standar Rumah Sakit", period: "Mingguan", grid: null },
];

const PERIOD_DAYS_MAP: Record<PeriodType, string[]> = {
  "Mingguan": ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
  "2 Mingguan": Array.from({ length: 14 }, (_, i) => `Hari ${i + 1}`),
  "Bulanan": Array.from({ length: 30 }, (_, i) => `Hari ${i + 1}`),
};

const meals = ["Sarapan", "Makan Siang", "Snack Sore", "Makan Malam"];

// ═══════════════════════════════════════════════════════════════
//  MODAL: BUAT RENCANA
// ═══════════════════════════════════════════════════════════════
function PlanFormModal({ onSave, onCancel }: {
  onSave: (data: Omit<MealPlan, "id">) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState({ nama: "", period: "Mingguan" as PeriodType });
  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));
  const isValid = form.nama !== "";
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (!isValid) return; onSave({ nama: form.nama, period: form.period, grid: null }); };
  const fc = "w-full px-3.5 py-2.5 rounded-lg border border-border bg-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50";
  const lc = "block text-xs font-semibold text-foreground mb-1.5";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border"><h3 className="font-semibold text-base">Buat Rencana Makan Baru</h3><button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X size={16} /></button></div>
        <form onSubmit={submit}>
          <div className="p-5 space-y-4">
            <div><label className={lc}>Nama Rencana</label><input type="text" className={fc} value={form.nama} onChange={(e) => set("nama", e.target.value)} placeholder="cth: Diet DM Tipe 2 Lantai 3" autoFocus /></div>
            <div>
              <label className={lc}>Periode</label>
              <select className={fc} value={form.period} onChange={(e) => set("period", e.target.value)}>
                <option value="Mingguan">Mingguan (7 Hari)</option>
                <option value="2 Mingguan">2 Mingguan (14 Hari)</option>
                <option value="Bulanan">Bulanan (30 Hari)</option>
              </select>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
              Menu standar akan dimuat dan bisa diedit langsung di tabel sesuai kebutuhan.
            </div>
          </div>
          <div className="flex justify-end gap-2 p-4 border-t border-border bg-muted/50 rounded-b-2xl">
            <button type="button" className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors" onClick={onCancel}>Batal</button>
            <button type="submit" disabled={!isValid} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><Plus size={14} /> Buat Rencana</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL: KONFIRMASI HAPUS
// ═══════════════════════════════════════════════════════════════
function PlanConfirmModal({ plan, onConfirm, onCancel }: { plan: MealPlan; onConfirm: () => void; onCancel: () => void; }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4"><AlertTriangle size={28} className="text-red-500" /></div>
          <h4 className="font-bold text-base mb-2">Hapus Rencana?</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">Hapus <strong>{plan.nama}</strong> ({plan.period})? Semua customisasi menu akan hilang.</p>
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
export default function NutMeal() {
  const [plans, setPlans] = useState<MealPlan[]>(INITIAL_PLANS);
  const [filterPeriod, setFilterPeriod] = useState<PeriodType | "Semua">("Semua");
  const [activePlanId, setActivePlanId] = useState(INITIAL_PLANS[0].id);
  const [modal, setModal] = useState<null | "create" | "delete">(null);
  const [selected, setSelected] = useState<MealPlan | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now(); setToasts((p) => [...p, { id, message, type }]); setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }, []);

  const filteredPlans = useMemo(() => {
    if (filterPeriod === "Semua") return plans;
    return plans.filter(p => p.period === filterPeriod);
  }, [plans, filterPeriod]);

  const currentPlan = plans.find(p => p.id === activePlanId) || filteredPlans[0];
  const currentDays = currentPlan ? PERIOD_DAYS_MAP[currentPlan.period] : [];

  // Mengambil grid: kalau null pakai default, kalau sudah disimpan pakai yang disimpan
  const currentGrid = useMemo(() => {
    if (!currentPlan) return [];
    if (currentPlan.grid) return currentPlan.grid;
    return meals.map((_, mi) => {
      if (currentDays.length <= 7) return [...ORIGINAL_GRID[mi]];
      return Array.from({ length: currentDays.length }, (_, di) => ORIGINAL_GRID[mi][di % 7]);
    });
  }, [currentPlan, currentDays]);

  const openCreate = () => { setSelected(null); setModal("create"); };
  const openDelete = (p: MealPlan) => { setSelected(p); setModal("delete"); };
  const close = () => { setModal(null); setSelected(null); };

  const handleCreate = (data: Omit<MealPlan, "id">) => {
    const id = "RCP-" + String(Math.max(...plans.map((p) => parseInt(p.id.replace(/\D/g, ""), 10)), 0) + 1).padStart(3, "0");
    setPlans((p) => [{ ...data, id }, ...p]);
    setActivePlanId(id);
    close();
    showToast(`Rencana "${data.nama}" dibuat. Klik sel untuk edit menu.`);
  };

  const handleDelete = () => {
    if (!selected) return;
    const id = selected.id;
    setPlans((p) => p.filter((pl) => pl.id !== id));
    if (activePlanId === id && filteredPlans.length > 0) setActivePlanId(filteredPlans[0].id);
    close();
    showToast(`Rencana "${selected.nama}" dihapus`, "danger");
  };

  // ── EDIT CELL HANDLER ──
  const handleUpdateCell = (mi: number, di: number, value: string) => {
    if (!activePlanId) return;
    setPlans(prev => prev.map(p => {
      if (p.id !== activePlanId) return p;
      
      // Buat base grid kalau belum pernah disimpan (masih null)
      let baseGrid: string[][];
      if (p.grid) {
        baseGrid = p.grid.map(row => [...row]);
      } else {
        const days = PERIOD_DAYS_MAP[p.period];
        baseGrid = meals.map((_, mIdx) => {
          if (days.length <= 7) return [...ORIGINAL_GRID[mIdx]];
          return Array.from({ length: days.length }, (_, dIdx) => ORIGINAL_GRID[mIdx][dIdx % 7]);
        });
      }
      
      baseGrid[mi][di] = value; // Update isi sel
      return { ...p, grid: baseGrid };
    }));
  };

  return (
    <div className="p-6 space-y-5">
      {/* ═══ HEADER ═══ */}
      <PageHeader title="Meal Planning – Rencana Makan Mingguan" breadcrumbs={["Modul 17 – Nutrisi", "Meal Planning"]}>
        <div className="flex gap-2">
          <Btn size="sm" onClick={openCreate}><Plus size={13} /> Buat Rencana</Btn>
        </div>
      </PageHeader>

      {/* ═══ FILTER PERIODE ═══ */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["Semua", "Mingguan", "2 Mingguan", "Bulanan"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setFilterPeriod(p)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-all ${
              filterPeriod === p ? "bg-primary text-white border-primary shadow-sm" : "bg-white text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            <Calendar size={13} />
            {p === "Semua" ? "Semua Periode" : p}
            {p !== "Semua" && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${filterPeriod === p ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
                {plans.filter(pl => pl.period === p).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ═══ TABEL ═══ */}
      <SectionCard 
        title={currentPlan ? `Jadwal Makan ${currentPlan.period} – ${currentPlan.nama}` : "Jadwal Makan"} 
        actions={
          currentPlan ? (
            <div className="flex items-center gap-2">
              {filteredPlans.length > 1 && (
                <select value={activePlanId} onChange={(e) => setActivePlanId(e.target.value)} className="px-3 py-1.5 text-xs border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                  {filteredPlans.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                </select>
              )}
              <button onClick={() => openDelete(currentPlan)} className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors" title="Hapus Rencana Ini"><Trash2 size={14} /></button>
            </div>
          ) : null
        }
      >
        {currentPlan ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="p-2 bg-muted text-left font-semibold text-muted-foreground border border-border w-28">Waktu Makan</th>
                  {currentDays.map(d => <th key={d} className="p-2 bg-muted text-center font-semibold text-muted-foreground border border-border">{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {meals.map((meal, mi) => (
                  <tr key={meal}>
                    <td className="p-2 border border-border font-semibold text-foreground bg-secondary/30 w-28">{meal}</td>
                    {currentDays.map((d, di) => (
                      <td key={d} className="p-0 border border-border align-top hover:bg-primary/5 transition-colors">
                        <input
                          type="text"
                          className="w-full p-2 m-0 text-xs bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground/40 focus:bg-primary/10 transition-colors"
                          value={currentGrid[mi]?.[di] || ""}
                          onChange={(e) => handleUpdateCell(mi, di, e.target.value)}
                          placeholder="Klik untuk edit..."
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <Calendar size={48} className="mx-auto mb-3 text-gray-300" />
            <div className="font-semibold text-foreground mb-1">Belum ada rencana makan</div>
            <div className="text-sm text-muted-foreground">Klik "Buat Rencana" untuk memulai.</div>
          </div>
        )}
      </SectionCard>

      {/* ═══ MODALS ═══ */}
      {modal === "create" && <PlanFormModal onSave={handleCreate} onCancel={close} />}
      {modal === "delete" && selected && <PlanConfirmModal plan={selected} onConfirm={handleDelete} onCancel={close} />}

      <ToastContainer toasts={toasts} />
    </div>
  );
}