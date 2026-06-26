import { useState, useCallback } from "react";
import { CheckCircle, Edit, X, Camera } from "lucide-react";

// ═══════════════════════════════════════════════════════════════
//  UI PRIMITIVES
// ═══════════════════════════════════════════════════════════════
function PageHeader({ title, breadcrumbs }: { title: string; breadcrumbs: string[] }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        {breadcrumbs.map((b, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-muted-foreground/40">›</span>}
            <span className={i === breadcrumbs.length - 1 ? "text-foreground font-medium" : ""}>{b}</span>
          </span>
        ))}
      </div>
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
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
  const base = "inline-flex items-center gap-1.5 font-semibold rounded-lg transition-all cursor-pointer";
  const sizes: Record<string, string> = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm" };
  const variants: Record<string, string> = {
    primary: "bg-primary text-white hover:bg-blue-700 shadow-sm",
    ghost: "bg-transparent text-muted-foreground hover:bg-muted",
    outline: "bg-white text-foreground border border-border hover:bg-muted shadow-sm",
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}>
      {children}
    </button>
  );
}

function Badge({ variant, children }: { variant: string; children: React.ReactNode }) {
  const map: Record<string, string> = {
    aktif: "bg-emerald-100 text-emerald-700",
    nonaktif: "bg-gray-100 text-gray-600",
  };
  return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${map[variant] || map.aktif}`}>{children}</span>;
}

// ═══════════════════════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════════════════════
interface Toast { id: number; message: string; type: "success" | "info"; }
function ToastContainer({ toasts }: { toasts: Toast[] }) {
  const colorMap = { success: "bg-emerald-600", info: "bg-blue-700" };
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
interface ProfilData {
  namaLengkap: string;
  nip: string;
  jabatan: string;
  unitKerja: string;
  aksesSistem: string;
  levelAkses: string;
  terakhirLogin: string;
  sesiAktifSejak: string;
  roleDisplay: string; // untuk avatar & sidebar
  modulAkses: string[];
}

const INITIAL_DATA: ProfilData = {
  namaLengkap: "Dr. Administratus Logisticus, S.Farm",
  nip: "197808152005011005",
  jabatan: "Kepala Instalasi Farmasi & Logistik",
  unitKerja: "Instalasi Farmasi & Penunjang Medis",
  aksesSistem: "Paket Mahasiswa 4 – Logistics Master",
  levelAkses: "Administrator",
  terakhirLogin: "22 Jun 2026, 07:45 WIB",
  sesiAktifSejak: "22 Jun 2026, 07:45 WIB",
  roleDisplay: "Admin Logistik",
  modulAkses: ["Modul 4 – ADC", "Modul 10 – ERP & Supply Chain", "Modul 17 – Clinical Nutrition", "Modul 21 – Medical Waste"],
};

// ═══════════════════════════════════════════════════════════════
//  HELPER: Ambil inisial dari nama
// ═══════════════════════════════════════════════════════════════
function getInitials(name: string): string {
  return name
    .split(/[\s,]+/)
    .filter((w) => w.length > 0 && !["Dr.", "S.Farm", "S.Ked", "Sp.", "M.Sc"].includes(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// ═══════════════════════════════════════════════════════════════
//  MODAL: EDIT PROFIL
// ═══════════════════════════════════════════════════════════════
function EditProfilModal({ data, onSave, onCancel }: {
  data: ProfilData; onSave: (updated: ProfilData) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState(data);
  const set = (key: keyof ProfilData, value: string) => setForm((p) => ({ ...p, [key]: value }));

  // Hanya field identitas yang boleh diedit (NIP, level, login tidak bisa)
  const editableFields: { key: keyof ProfilData; label: string; type?: string }[] = [
    { key: "namaLengkap", label: "Nama Lengkap" },
    { key: "jabatan", label: "Jabatan" },
    { key: "unitKerja", label: "Unit Kerja" },
    { key: "roleDisplay", label: "Nama Tampilan (Sidebar)" },
  ];

  const isValid = form.namaLengkap !== "" && form.jabatan !== "" && form.roleDisplay !== "";

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
          <h3 className="font-semibold text-base">Edit Profil</h3>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X size={16} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="p-5 space-y-4">

            {/* Preview Avatar */}
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl border border-border">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg flex-shrink-0">
                {getInitials(form.namaLengkap) || "AD"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-foreground truncate">{form.namaLengkap || "—"}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{form.jabatan || "—"}</div>
                <div className="text-[10px] text-muted-foreground mt-1">Inisial avatar akan otomatis mengikuti nama</div>
              </div>
            </div>

            {/* Editable Fields */}
            {editableFields.map((f) => (
              <div key={f.key}>
                <label className={lc}>{f.label}</label>
                <input
                  type={f.type || "text"}
                  className={fc}
                  value={form[f.key] as string}
                  onChange={(e) => set(f.key, e.target.value)}
                  autoFocus={f.key === "namaLengkap"}
                />
              </div>
            ))}

            {/* Readonly Info */}
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg space-y-1.5">
              <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Informasi Sistem (Tidak Dapat Diubah)</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <div><span className="text-muted-foreground">NIP:</span> <span className="font-semibold text-foreground">{form.nip}</span></div>
                <div><span className="text-muted-foreground">Level:</span> <span className="font-semibold text-foreground">{form.levelAkses}</span></div>
                <div><span className="text-muted-foreground">Akses:</span> <span className="font-semibold text-foreground truncate block">{form.aksesSistem}</span></div>
                <div><span className="text-muted-foreground">Login:</span> <span className="font-semibold text-foreground">{form.terakhirLogin}</span></div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 p-4 border-t border-border bg-muted/50 rounded-b-2xl">
            <button type="button" className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors" onClick={onCancel}>Batal</button>
            <button type="submit" disabled={!isValid} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5">
              <CheckCircle size={14} /> Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  KOMPONEN UTAMA
// ═══════════════════════════════════════════════════════════════
export default function ProfilPage() {
  const [profil, setProfil] = useState<ProfilData>(INITIAL_DATA);
  const [showEditModal, setShowEditModal] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }, []);

  const handleSave = (updated: ProfilData) => {
    setProfil(updated);
    setShowEditModal(false);
    showToast("Profil berhasil diperbarui");
  };

  // Bangun ulang array detail akun dari state agar dinamis
  const detailAkun: [string, string][] = [
    ["Nama Lengkap", profil.namaLengkap],
    ["NIP", profil.nip],
    ["Jabatan", profil.jabatan],
    ["Unit Kerja", profil.unitKerja],
    ["Akses Sistem", profil.aksesSistem],
    ["Level Akses", profil.levelAkses],
    ["Terakhir Login", profil.terakhirLogin],
    ["Sesi Aktif Sejak", profil.sesiAktifSejak],
  ];

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Profil Administrator" breadcrumbs={["MediCore HIS", "Profil Admin"]} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <SectionCard title="Identitas Pengguna">
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="relative group">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {getInitials(profil.namaLengkap) || "AD"}
              </div>
              <div className="absolute inset-0 w-20 h-20 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => setShowEditModal(true)}>
                <Camera size={18} className="text-white" />
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">{profil.roleDisplay}</div>
              <div className="text-sm text-muted-foreground">{profil.jabatan}</div>
              <div className="mt-1"><Badge variant="aktif">Aktif</Badge></div>
            </div>
            <Btn variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
              <Edit size={13} /> Edit Profil
            </Btn>
          </div>
        </SectionCard>

        <div className="lg:col-span-2 space-y-4">
          <SectionCard title="Detail Akun">
            <div className="grid grid-cols-2 gap-4">
              {detailAkun.map(([l, v]) => (
                <div key={l}>
                  <div className="text-xs text-muted-foreground">{l}</div>
                  <div className="text-sm font-semibold text-foreground mt-0.5">{v}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Akses Modul">
            <div className="grid grid-cols-2 gap-2">
              {profil.modulAkses.map(m => (
                <div key={m} className="flex items-center gap-2 p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
                  <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-emerald-800">{m}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      {showEditModal && <EditProfilModal data={profil} onSave={handleSave} onCancel={() => setShowEditModal(false)} />}
      <ToastContainer toasts={toasts} />
    </div>
  );
}