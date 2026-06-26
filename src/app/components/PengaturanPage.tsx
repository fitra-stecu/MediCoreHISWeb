import { useState, useCallback, useEffect } from "react";
import { CheckCircle, Lock, Fingerprint, Shield, X, LogOut } from "lucide-react";

// ═══════════════════════════════════════════════════════════════
//  UI PRIMITIVES
// ═══════════════════════════════════════════════════════════════
function PageHeader({ title, breadcrumbs, children }: { title: string; breadcrumbs: string[]; children?: React.ReactNode }) {
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
      <div className="flex items-center justify-between">
        {children && <div className="order-last">{children}</div>}
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
      </div>
    </div>
  );
}

function SectionCard({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-border dark:border-gray-700 overflow-hidden transition-colors duration-300">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border dark:border-gray-700">
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
    ghost: "bg-transparent text-muted-foreground hover:bg-muted dark:hover:bg-gray-700",
    outline: "bg-white dark:bg-gray-700 text-foreground border border-border dark:border-gray-600 hover:bg-muted dark:hover:bg-gray-600 shadow-sm",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}>
      {children}
    </button>
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
//  MODALS (Tetap sama seperti sebelumnya)
// ═══════════════════════════════════════════════════════════════
function ActionModal({ title, icon: Icon, color, children, onClose }: {
  title: string; icon: React.ElementType; color: string; children: React.ReactNode; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 dark:text-gray-100 rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border dark:border-gray-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "18" }}><Icon size={16} style={{ color }} /></div>
            <h3 className="font-semibold text-base">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted dark:hover:bg-gray-700 transition-colors"><X size={16} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function GantiPasswordModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ lama: "", baru: "", konfirmasi: "" });
  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));
  const isMatch = form.baru !== "" && form.baru === form.konfirmasi;
  const isValid = form.lama.length >= 6 && form.baru.length >= 6 && isMatch;
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (!isValid) return; onSaved(); };
  const fc = "w-full px-3.5 py-2.5 rounded-lg border border-border dark:border-gray-600 bg-muted dark:bg-gray-700 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50";
  const lc = "block text-xs font-semibold text-foreground mb-1.5";

  return (
    <ActionModal title="Ganti Password" icon={Lock} color="#1549A0" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className={lc}>Password Lama</label><input type="password" className={fc} value={form.lama} onChange={(e) => set("lama", e.target.value)} placeholder="Masukkan password lama" autoFocus /></div>
        <div><label className={lc}>Password Baru</label><input type="password" className={fc} value={form.baru} onChange={(e) => set("baru", e.target.value)} placeholder="Minimal 6 karakter" /></div>
        <div>
          <label className={lc}>Konfirmasi Password Baru</label>
          <input type="password" className={fc} value={form.konfirmasi} onChange={(e) => set("konfirmasi", e.target.value)} placeholder="Ulangi password baru" />
          {form.konfirmasi !== "" && !isMatch && <div className="text-[10px] text-red-500 mt-1 font-semibold">Password tidak cocok</div>}
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-border dark:border-gray-700">
          <button type="button" className="px-4 py-2 text-sm font-semibold rounded-lg border border-border dark:border-gray-600 bg-white dark:bg-gray-700 text-foreground hover:bg-muted dark:hover:bg-gray-600 transition-colors" onClick={onClose}>Batal</button>
          <button type="submit" disabled={!isValid} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"><Lock size={13} /> Simpan Password</button>
        </div>
      </form>
    </ActionModal>
  );
}

function SidikJariModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [scanning, setScanning] = useState(false);
  const [done, setDone] = useState(false);
  const handleScan = () => { setScanning(true); setTimeout(() => { setScanning(false); setDone(true); }, 2500); };

  return (
    <ActionModal title="Daftarkan Sidik Jari" icon={Fingerprint} color="#8B5CF6" onClose={onClose}>
      {done ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} className="text-emerald-600" /></div>
          <h4 className="font-bold text-base mb-1">Sidik Jari Berhasil Didaftarkan</h4>
          <p className="text-sm text-muted-foreground mb-4">Anda sekarang dapat login menggunakan sidik jari.</p>
          <button onClick={onSaved} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-blue-700 transition-colors">Selesai</button>
        </div>
      ) : (
        <div className="text-center py-4">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 transition-colors ${scanning ? "bg-purple-50 border-purple-400" : "bg-muted dark:bg-gray-700 border-border dark:border-gray-600"}`}>
            <Fingerprint size={36} className={scanning ? "text-purple-600 animate-pulse" : "text-muted-foreground"} />
          </div>
          <p className="text-sm text-muted-foreground mb-5">{scanning ? "Menjalankan pemindai sidik jari..." : "Pastikan perangkat sidik jari tersambung ke perangkat ini."}</p>
          <button onClick={handleScan} disabled={scanning} className="px-4 py-2 text-sm font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 mx-auto">
            <Fingerprint size={14} /> {scanning ? "Memindai..." : "Mulai Pemindaian"}
          </button>
        </div>
      )}
    </ActionModal>
  );
}

function SesiModal({ onClose, onLogout }: { onClose: () => void; onLogout: (id: string) => void }) {
  const [sessions, setSessions] = useState([
    { id: "sess_01", device: "PC Ruang Farmasi – Windows 11", ip: "192.168.1.45", time: "22 Jun 2026, 07:45 WIB", current: true },
    { id: "sess_02", device: "Laptop Meeting Room – MacOS", ip: "192.168.1.88", time: "21 Jun 2026, 14:20 WIB", current: false },
    { id: "sess_03", device: "HP Samsung Galaxy S24", ip: "10.0.0.12", time: "20 Jun 2026, 09:10 WIB", current: false },
  ]);
  const handleLogout = (id: string) => { setSessions((p) => p.filter((s) => s.id !== id)); onLogout(id); };

  return (
    <ActionModal title="Kelola Sesi Aktif" icon={Shield} color="#00897B" onClose={onClose}>
      <div className="space-y-3">
        {sessions.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">Tidak ada sesi lain</div>
        ) : sessions.map((s) => (
          <div key={s.id} className="flex items-center justify-between p-3 bg-muted/50 dark:bg-gray-700/50 rounded-xl border border-border dark:border-gray-600">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">{s.device}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.ip} · {s.time}</div>
            </div>
            {s.current ? (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-md shrink-0">Sesi Ini</span>
            ) : (
              <button onClick={() => handleLogout(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 transition-colors shrink-0" title="Akhiri sesi"><LogOut size={14} /></button>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end pt-4 mt-4 border-t border-border dark:border-gray-700">
        <button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-lg border border-border dark:border-gray-600 bg-white dark:bg-gray-700 text-foreground hover:bg-muted dark:hover:bg-gray-600 transition-colors">Tutup</button>
      </div>
    </ActionModal>
  );
}

// ═══════════════════════════════════════════════════════════════
//  KOMPONEN UTAMA
// ═══════════════════════════════════════════════════════════════
export default function PengaturanPage() {
  const [notif, setNotif] = useState(true);
  const [email, setEmail] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [bahasa, setBahasa] = useState("Bahasa Indonesia");
  const [zona, setZona] = useState("WIB (UTC+7) – Jakarta, Surabaya");
  const [ambangStok, setAmbangStok] = useState(20);
  const [modal, setModal] = useState<null | "password" | "sidikjari" | "sesi">(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [refreshCount, setRefreshCount] = useState(0);

  const toggle = (setter: React.Dispatch<React.SetStateAction<boolean>>) => setter(v => !v);

  const showToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }, []);

  // ═════════════════════════════════════════════════════════════
  //  EFEK NYATA: DARK MODE
  //  Menambah/hapus class 'dark' di <html> sehingga seluruh
  //  halaman yang pakai `dark:bg-xxx` akan berubah.
  // ═════════════════════════════════════════════════════════════
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    // Simpan ke localStorage agar bertahan saat refresh
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Cek preferensi tersimpan saat pertama kali mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
    }
  }, []);

  // ═════════════════════════════════════════════════════════════
  //  EFEK NYATA: AUTO-REFRESH
  //  Jika aktif, jalankan interval setiap 30 detik (di-buat 30 detik
  //  supaya kamu bisa lihat efeknya, deskripsi tetap 5 menit).
  // ═════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setRefreshCount((c) => c + 1);
      showToast("Dashboard berhasil di-refresh otomatis", "info");
    }, 30000); // 30 detik untuk demo
    return () => clearInterval(interval);
  }, [autoRefresh, showToast]);

  // ═════════════════════════════════════════════════════════════
  //  EFEK NYATA: NOTIFIKASI STOK KRITIS
  //  Menggunakan Notification API bawaan browser + Toast.
  // ═════════════════════════════════════════════════════════════
  const handleToggleNotif = () => {
    const willBeActive = !notif;
    setNotif(willBeActive);

    if (willBeActive) {
      if ("Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification("MediCore HIS", { body: "Notifikasi stok kritis berhasil diaktifkan!" });
        } else if (Notification.permission !== "denied") {
          Notification.requestPermission().then((perm) => {
            if (perm === "granted") {
              new Notification("MediCore HIS", { body: "Notifikasi stok kritis berhasil diaktifkan!" });
            }
          });
        }
      }
      showToast("Notifikasi stok kritis diaktifkan", "success");
    } else {
      showToast("Notifikasi stok kritis dinonaktifkan", "warning");
    }
  };

  // ═════════════════════════════════════════════════════════════
  //  EFEK NYATA: NOTIFIKASI EMAIL
  // ═════════════════════════════════════════════════════════════
  const handleToggleEmail = () => {
    const willBeActive = !email;
    setEmail(willBeActive);
    if (willBeActive) {
      showToast("Rangkuman harian akan dikirim ke admin@medicore.rs.id", "success");
    } else {
      showToast("Pengiriman email rangkuman dinonaktifkan", "warning");
    }
  };

  const handleSave = () => showToast("Pengaturan berhasil disimpan", "success");
  const close = () => setModal(null);

  return (
    // Tambahkan dark:bg-gray-900 untuk memastikan background utama ikut gelap
    <div className="p-6 space-y-5 transition-colors duration-300 dark:bg-gray-900 min-h-screen">
      <PageHeader title="Pengaturan Sistem" breadcrumbs={["MediCore HIS", "Pengaturan"]}>
        <Btn size="sm" onClick={handleSave}><CheckCircle size={13} /> Simpan Perubahan</Btn>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard title="Preferensi Tampilan">
          <div className="space-y-4">
            {[
              { label: "Mode Gelap", desc: "Aktifkan tema gelap untuk tampilan malam", val: darkMode, fn: () => toggle(setDarkMode) },
              { 
                label: "Auto-Refresh Dashboard", 
                desc: `Perbarui data dashboard setiap 5 menit ${autoRefresh ? `(aktif, terakhir ${refreshCount}x)` : ""}`, 
                val: autoRefresh, 
                fn: () => toggle(setAutoRefresh) 
              },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <div className="flex-1 mr-4">
                  <div className="text-sm font-semibold text-foreground">{s.label}</div>
                  <div className="text-xs text-muted-foreground">{s.desc}</div>
                </div>
                <button onClick={s.fn} className={`w-10 h-6 rounded-full transition-all ${s.val ? "bg-primary" : "bg-muted dark:bg-gray-600"} relative shrink-0`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow ${s.val ? "left-5" : "left-1"}`} />
                </button>
              </div>
            ))}
            <div>
              <label className="text-sm font-semibold text-foreground">Bahasa Sistem</label>
              <select value={bahasa} onChange={(e) => setBahasa(e.target.value)} className="mt-1.5 w-full px-3 py-2 text-sm bg-muted dark:bg-gray-700 dark:border-gray-600 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option>Bahasa Indonesia</option>
                <option>English</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground">Zona Waktu</label>
              <select value={zona} onChange={(e) => setZona(e.target.value)} className="mt-1.5 w-full px-3 py-2 text-sm bg-muted dark:bg-gray-700 dark:border-gray-600 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option>WIB (UTC+7) – Jakarta, Surabaya</option>
                <option>WITA (UTC+8) – Makassar, Bali</option>
                <option>WIT (UTC+9) – Jayapura</option>
              </select>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Notifikasi & Alert">
          <div className="space-y-4">
            {[
              { label: "Notifikasi Stok Kritis", desc: "Alert saat stok obat di bawah level minimum", val: notif, fn: handleToggleNotif },
              { label: "Notifikasi Email", desc: "Kirim rangkuman harian ke email terdaftar", val: email, fn: handleToggleEmail },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <div className="flex-1 mr-4">
                  <div className="text-sm font-semibold text-foreground">{s.label}</div>
                  <div className="text-xs text-muted-foreground">{s.desc}</div>
                </div>
                <button onClick={s.fn} className={`w-10 h-6 rounded-full transition-all ${s.val ? "bg-primary" : "bg-muted dark:bg-gray-600"} relative shrink-0`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow ${s.val ? "left-5" : "left-1"}`} />
                </button>
              </div>
            ))}
            <div>
              <label className="text-sm font-semibold text-foreground">Ambang Batas Stok Kritis (<span className="font-mono text-primary">{ambangStok}%</span>)</label>
              <input type="range" min={5} max={50} value={ambangStok} onChange={(e) => setAmbangStok(Number(e.target.value))} className="w-full mt-2 accent-primary" />
              <div className="flex justify-between text-xs text-muted-foreground mt-0.5"><span>5%</span><span className={ambangStok === 20 ? "font-semibold text-foreground" : ""}>20% (default)</span><span>50%</span></div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Keamanan">
          <div className="space-y-3">
            <Btn variant="outline" size="md" className="w-full justify-center" onClick={() => setModal("password")}><Lock size={13} /> Ganti Password</Btn>
            <Btn variant="outline" size="md" className="w-full justify-center" onClick={() => setModal("sidikjari")}><Fingerprint size={13} /> Daftarkan Sidik Jari</Btn>
            <Btn variant="outline" size="md" className="w-full justify-center" onClick={() => setModal("sesi")}><Shield size={13} /> Kelola Sesi Aktif</Btn>
          </div>
        </SectionCard>

        <SectionCard title="Informasi Sistem">
          <div className="space-y-2 text-sm">
            {[
              ["Versi Aplikasi", "MediCore HIS v4.2.1"],
              ["Paket", "Mahasiswa 4 – Logistics & Supply Chain Master"],
              ["Server", "HIS-PROD-01 · Surabaya Data Center"],
              ["Database", "PostgreSQL 16.2 · SSL Enabled"],
              ["Terakhir Update", "20 Jun 2026, 02:00 WIB (Maintenance)"],
              ["Uptime", "99.97% (30 hari terakhir)"],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between py-1.5 border-b border-border dark:border-gray-700 last:border-0">
                <span className="text-muted-foreground text-xs">{l}</span>
                <span className="font-semibold text-xs text-foreground">{v}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {modal === "password" && <GantiPasswordModal onClose={close} onSaved={() => { close(); showToast("Password berhasil diubah", "success"); }} />}
      {modal === "sidikjari" && <SidikJariModal onClose={close} onSaved={() => { close(); showToast("Sidik jari berhasil didaftarkan", "success"); }} />}
      {modal === "sesi" && <SesiModal onClose={close} onLogout={(id) => showToast(`Sesi ${id} diakhiri`, "danger")} />}

      <ToastContainer toasts={toasts} />
    </div>
  );
}