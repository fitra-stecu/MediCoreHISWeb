import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutDashboard, ChevronRight, ChevronDown,
  Bell, Search, User, Settings,
  Building2, AlertCircle, Lock, Pill, ShoppingCart, Utensils, Trash2,
} from "lucide-react";

// ─── IMPORT KOMPONEN MATERIAL ────────────────────────────────────────────────
import DashboardPage from "./components/DashboardPage";
import DrugTable from "./components/adc/DrugTable";
import ClmaWorkflow from "./components/adc/ClmaWorkflow";
import PharmacologyAlert from "./components/adc/PharmacologyAlert";
import DaftarObat from "./components/adc/DaftarObat";
import VendorTable from "./components/erp/VendorTable";
import KanbanBoard from "./components/erp/KanbanBoard";
import CssdStepper from "./components/erp/CssdStepper";
import { ERPDashboard, ERPPrediksi } from "./components/erp/ErpDashboard";
import ErpGudang from "./components/erp/ErpGudang";
import ERPCSSD from "./components/erp/ErpCSSD";
import ERPLogistik from "./components/erp/ERPLogistik";
import ERPTender from "./components/erp/ERPTender";
import FoodDrugAlerts from "./components/nutrition/FoodDrugAlerts";
import NutDashboard from "./components/nutrition/NutDashboard";
import NutMonitoring from "./components/nutrition/NutMonitoring";
import NutMeal from "./components/nutrition/NutMeal";
import NutKafetaria from "./components/nutrition/NutKafetaria";
import IpalMonitor from "./components/waste/IpalMonitor";
import WasteDashboard from "./components/waste/WasteDashBoard";
import WasteManifest from "./components/waste/WasteManifest";
import WasteTPS from "./components/waste/WasteTPS";
import WasteSerah from "./components/waste/WasteSerah";
import ProfilPage from "./components/ProfilPage";
import PengaturanPage from "./components/PengaturanPage";
import ADCDashboard from "./components/adc/ADCDashboard";
import AuthNarkotika from "./components/adc/AuthNarkotika";
import MacroDashboard from "./components/nutrition/MacroDashboard";


// ─── TYPES ───────────────────────────────────────────────────────────────────
type Page =
  | "login" | "dashboard"
  | "adc-dashboard" | "adc-stok" | "adc-clma" | "adc-farmakologi" | "adc-narkotika" | "adc-daftar"
  | "erp-dashboard" | "erp-prediksi" | "erp-kanban" | "erp-gudang" | "erp-cssd" | "erp-logistik" | "erp-tender"
  | "nut-dashboard" | "nut-interaksi" | "nut-makro" | "nut-monitoring" | "nut-meal" | "nut-kafetaria"
  | "waste-dashboard" | "waste-manifest" | "waste-tps" | "waste-vendor" | "waste-serah" | "waste-ipal"
  | "profil" | "pengaturan";

// ─── PALETTE (Hanya untuk Layout) ────────────────────────────────────────────
const C = { blue: "#1549A0", navy: "#0B2D6B" };

// ─── DATA (Hanya yang dipakai Header) ────────────────────────────────────────
const notifData = [
  { id: 1, type: "danger", msg: "Stok Paracetamol 500mg kritis! Sisa 85 tab (min: 300)", time: "5 mnt lalu", read: false },
  { id: 2, type: "danger", msg: "Stok Captopril 25mg kritis! Sisa 42 tab (min: 100)", time: "12 mnt lalu", read: false },
  { id: 3, type: "warning", msg: "Interaksi obat: Warfarin + Aspirin – Pasien P-0891 Agus Salim", time: "28 mnt lalu", read: false },
  { id: 4, type: "warning", msg: "Stok Ciprofloxacin di bawah level minimum (ADC-03)", time: "1 jam lalu", read: true },
  { id: 5, type: "info", msg: "PO-2026-0251 diterima dari PT Kimia Farma senilai Rp 125 juta", time: "2 jam lalu", read: true },
  { id: 6, type: "success", msg: "Sterilisasi batch CST-0892 selesai dan siap distribusi", time: "3 jam lalu", read: true },
  { id: 7, type: "info", msg: "Manifest limbah WM-0450 diserahkan ke PT Wastec International", time: "5 jam lalu", read: true },
];

// ─── NAVIGATION ──────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", label: "Dashboard Utama", icon: LayoutDashboard, page: "dashboard" as Page },
  {
    id: "adc", label: "Modul 4 – ADC", icon: Pill, children: [
      { label: "Dashboard ADC", page: "adc-dashboard" as Page },
      { label: "Monitoring Stok Obat", page: "adc-stok" as Page },
      { label: "CLMA Workflow", page: "adc-clma" as Page },
      { label: "Pharmacology Conflict Alert", page: "adc-farmakologi" as Page },
      { label: "Auth Narkotika Step-Up", page: "adc-narkotika" as Page },
      { label: "Daftar Obat & Riwayat", page: "adc-daftar" as Page },
    ]
  },
  {
    id: "erp", label: "Modul 10 – ERP & Supply Chain", icon: ShoppingCart, children: [
      { label: "Dashboard ERP", page: "erp-dashboard" as Page },
      { label: "Prediksi Stok Habis", page: "erp-prediksi" as Page },
      { label: "Procurement Kanban", page: "erp-kanban" as Page },
      { label: "3D Warehouse Map", page: "erp-gudang" as Page },
      { label: "CSSD Sterilization", page: "erp-cssd" as Page },
      { label: "Pengadaan Logistik & ATK", page: "erp-logistik" as Page },
      { label: "Vendor Tender Portal", page: "erp-tender" as Page },
    ]
  },
  {
    id: "nutrition", label: "Modul 17 – Clinical Nutrition", icon: Utensils, children: [
      { label: "Dashboard Nutrisi", page: "nut-dashboard" as Page },
      { label: "Food & Drug Interaction", page: "nut-interaksi" as Page },
      { label: "Macronutrient Dashboard", page: "nut-makro" as Page },
      { label: "Monitoring Nutrisi Pasien", page: "nut-monitoring" as Page },
      { label: "Meal Planning", page: "nut-meal" as Page },
      { label: "Kuota Kafetaria Staf", page: "nut-kafetaria" as Page },
    ]
  },
  {
    id: "waste", label: "Modul 21 – Medical Waste", icon: Trash2, children: [
      { label: "Dashboard Limbah Medis", page: "waste-dashboard" as Page },
      { label: "Tracking Manifest Limbah", page: "waste-manifest" as Page },
      { label: "Monitoring TPS B3", page: "waste-tps" as Page },
      { label: "Vendor Disposal", page: "waste-vendor" as Page },
      { label: "Serah Terima Vendor", page: "waste-serah" as Page },
      { label: "Dashboard IoT IPAL", page: "waste-ipal" as Page },
    ]
  },
  { id: "profil", label: "Profil Admin", icon: User, page: "profil" as Page },
  { id: "pengaturan", label: "Pengaturan", icon: Settings, page: "pengaturan" as Page },
];

// ─── LOGIN PAGE ──────────────────────────────────────────────────────────────
function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [user, setUser] = useState("admin.logistik");
  const [pass, setPass] = useState("MediCore2026!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = () => {
    if (!user || !pass) { setError("Username dan password wajib diisi."); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 1200);
  };

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #0B2D6B 0%, #1549A0 50%, #0891B2 100%)" }}>
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="absolute border border-white/20 rounded-full" style={{ width: `${(i + 1) * 80}px`, height: `${(i + 1) * 80}px`, left: "50%", top: "50%", transform: "translate(-50%, -50%)" }} />
          ))}
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"><Building2 size={22} className="text-white" /></div>
            <div><div className="text-lg font-bold tracking-wide">MediCore HIS</div><div className="text-blue-200 text-xs">Hospital Information System</div></div>
          </div>
        </div>
        <div className="relative z-10">
          <div className="inline-block bg-white/10 backdrop-blur-sm rounded-xl px-3 py-1.5 text-xs text-blue-100 font-semibold mb-5 border border-white/20">Paket Mahasiswa 4 · The Logistics & Supply Chain Master</div>
          <h1 className="text-4xl font-extrabold leading-tight mb-4">Kelola Rumah Sakit<br />dengan Cerdas & Efisien</h1>
          <p className="text-blue-100 text-base leading-relaxed max-w-sm">Sistem informasi rumah sakit terintegrasi untuk manajemen obat, supply chain, nutrisi klinis, dan pengelolaan limbah medis.</p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {[{ icon: Pill, label: "ADC & Farmasi", desc: "Dispensing otomatis" }, { icon: ShoppingCart, label: "ERP & Logistik", desc: "Supply chain cerdas" }, { icon: Utensils, label: "Nutrisi Klinis", desc: "Meal plan pasien" }, { icon: Trash2, label: "Limbah Medis", desc: "Compliance B3" }].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20"><Icon size={18} className="text-blue-200 shrink-0" /><div><div className="text-sm font-semibold text-white">{label}</div><div className="text-xs text-blue-200">{desc}</div></div></div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-blue-300 text-xs"></div>
      </div>
      <div className="flex flex-1 lg:flex-none lg:w-[440px] items-center justify-center p-8 bg-white/5 backdrop-blur-md">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center gap-2 mb-6"><div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center"><Building2 size={16} className="text-white" /></div><div><div className="text-sm font-bold text-foreground">MediCore HIS</div><div className="text-xs text-muted-foreground"> </div></div></div>
            <h2 className="text-2xl font-bold text-foreground mb-1">Selamat Datang</h2>
            <p className="text-muted-foreground text-sm mb-6">Masuk ke sistem untuk melanjutkan.</p>
            {error && (<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2"><AlertCircle size={14} /> {error}</div>)}
            <div className="space-y-4">
              <div><label className="block text-sm font-semibold text-foreground mb-1.5">Username / NIP</label><input value={user} onChange={e => setUser(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50" placeholder="Masukkan username" /></div>
              <div><label className="block text-sm font-semibold text-foreground mb-1.5">Password</label><input type="password" value={pass} onChange={e => setPass(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50" placeholder="Masukkan password" onKeyDown={e => e.key === "Enter" && handle()} /></div>
              <button onClick={handle} disabled={loading} className="w-full py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-70 text-sm">{loading ? "Memverifikasi..." : "Masuk ke Sistem"}</button>
            </div>
            <div className="mt-5 p-3 bg-blue-50 rounded-lg border border-blue-100"><p className="text-xs text-blue-700 font-semibold mb-1">Demo Login</p><p className="text-xs text-blue-600">User: admin.logistik · Pass: MediCore2026!</p></div>
            <div className="mt-4 flex items-center justify-center gap-3 text-xs text-muted-foreground"><Lock size={10} /> <span>Enkripsi TLS 1.3 · Sesi aman 8 jam</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function Sidebar({ currentPage, navigate, expanded, setExpanded }: {
  currentPage: Page; navigate: (p: Page) => void; expanded: Set<string>; setExpanded: (s: Set<string>) => void;
}) {
  const toggle = (id: string) => { const s = new Set(expanded); s.has(id) ? s.delete(id) : s.add(id); setExpanded(s); };
  const isActive = (page?: Page) => page === currentPage;
  const isGroupActive = (children?: { page: Page }[]) => children?.some(c => c.page === currentPage);

  return (
    <aside className="w-60 shrink-0 flex flex-col h-full" style={{ backgroundColor: "#0B2D6B" }}>
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/10">
        <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center"><Building2 size={16} className="text-white" /></div>
        <div><div className="text-white text-sm font-bold tracking-wide">MediCore HIS</div><div className="text-blue-300 text-[10px]"> </div></div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-none" style={{ scrollbarWidth: "none" }}>
        {NAV.map((item) => {
          if (!item.children) return (<button key={item.id} onClick={() => navigate(item.page!)} className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-all ${isActive(item.page) ? "bg-white/15 text-white" : "text-blue-200 hover:bg-white/8 hover:text-white"}`}><item.icon size={16} /><span>{item.label}</span>{isActive(item.page) && <div className="ml-auto w-1 h-4 bg-white rounded-full" />}</button>);
          const open = expanded.has(item.id);
          const groupActive = isGroupActive(item.children as { page: Page }[]);
          return (
            <div key={item.id}>
              <button onClick={() => toggle(item.id)} className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-all ${groupActive ? "text-white bg-white/10" : "text-blue-200 hover:bg-white/8 hover:text-white"}`}><item.icon size={16} /><span className="flex-1 text-left leading-tight text-xs">{item.label}</span>{open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}</button>
              {open && (<div className="bg-black/20">{item.children.map((child) => (<button key={child.page} onClick={() => navigate(child.page)} className={`w-full flex items-center gap-2 pl-9 pr-4 py-2 text-xs transition-all ${isActive(child.page) ? "text-white bg-white/15 font-semibold" : "text-blue-300 hover:text-white hover:bg-white/8"}`}><div className={`w-1 h-1 rounded-full shrink-0 ${isActive(child.page) ? "bg-white" : "bg-blue-500"}`} />{child.label}</button>))}</div>)}
            </div>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shrink-0"><span className="text-white text-xs font-bold">AD</span></div>
          <div className="flex-1 min-w-0"><div className="text-white text-xs font-semibold truncate">Admin Logistik</div><div className="text-blue-300 text-[10px] truncate">admin.logistik</div></div>
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0" />
        </div>
      </div>
    </aside>
  );
}

// Tambahkan useMemo dan useRef di baris import paling atas jika belum ada
// import React, { useState, useEffect, useMemo, useRef } from "react";

// ─── HEADER ──────────────────────────────────────────────────────────────────
function Header({ currentPage, navigate, notifCount, showNotif, setShowNotif, notifications, markRead }: {
  currentPage: Page; navigate: (p: Page) => void; notifCount: number; showNotif: boolean;
  setShowNotif: (b: boolean) => void; notifications: typeof notifData; markRead: (id: number) => void;
}) {
  const [time, setTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Tutup dropdown search saat klik di luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Gabungkan semua menu (termasuk sub-menu) menjadi 1 array rata
  const flatMenu = useMemo(() => {
    const items: { page: Page; label: string }[] = [];
    NAV.forEach((item) => {
      if (item.page) items.push({ page: item.page, label: item.label });
      if (item.children) {
        item.children.forEach((child) => items.push({ page: child.page, label: child.label }));
      }
    });
    return items;
  }, []);

  // Filter menu berdasarkan ketikan
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return flatMenu.filter((item) => item.label.toLowerCase().includes(q));
  }, [searchQuery, flatMenu]);

  const wib = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(time);
  const date = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(time);
  
  const notifIconClass = (type: string) => type === "danger" ? "text-red-500" : type === "warning" ? "text-amber-500" : type === "success" ? "text-emerald-500" : "text-blue-500";

  return (
    <header className="h-14 bg-white border-b border-border flex items-center px-5 gap-4 shrink-0 relative z-20">
      
      {/* ── SEARCH BAR (Sekarang Berfungsi) ── */}
      <div className="relative flex-1 max-w-xs" ref={searchRef}>
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari ..."
          className="w-full pl-8 pr-3 py-1.5 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
        />
        
        {/* Dropdown Hasil Pencarian */}
        {searchQuery.trim() !== "" && (
          <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-xl shadow-xl border border-border z-50 max-h-64 overflow-y-auto">
            {searchResults.length > 0 ? (
              searchResults.map((r) => (
                <button
                  key={r.page}
                  onClick={() => {
                    navigate(r.page);
                    setSearchQuery(""); // Tutup dropdown setelah pilih
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors flex items-center gap-3 ${
                    currentPage === r.page ? "bg-blue-50 text-primary font-semibold" : "text-foreground"
                  }`}
                >
                  <Search size={13} className="text-muted-foreground shrink-0" />
                  {r.label}
                  {currentPage === r.page && <span className="ml-auto text-[10px] text-primary">(Aktif)</span>}
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-sm text-muted-foreground text-center flex flex-col items-center gap-2">
                <Search size={20} className="opacity-30" />
                Menu tidak ditemukan untuk "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* Clock */}
      <div className="text-right hidden sm:block">
        <div className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-mono)" }}>{wib} WIB</div>
        <div className="text-[10px] text-muted-foreground">{date}</div>
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setShowNotif(!showNotif)}
          className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
        >
          <Bell size={18} className="text-muted-foreground" />
          {notifCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {notifCount}
            </span>
          )}
        </button>
        {showNotif && (
          <div className="absolute right-0 top-11 w-80 bg-white rounded-xl shadow-xl border border-border z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="font-semibold text-sm">Notifikasi</span>
              <span className="text-xs text-muted-foreground">{notifCount} belum dibaca</span>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`px-4 py-3 border-b border-border cursor-pointer hover:bg-muted transition-colors ${!n.read ? "bg-blue-50/50" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle size={13} className={`mt-0.5 shrink-0 ${notifIconClass(n.type)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground leading-relaxed">{n.msg}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
                    </div>
                    {!n.read && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0 mt-1" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Profile */}
      <button onClick={() => navigate("profil")} className="flex items-center gap-2 hover:bg-muted rounded-lg p-1.5 transition-colors">
        <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">AD</span>
        </div>
        <div className="hidden sm:block text-right">
          <div className="text-xs font-semibold text-foreground leading-none">Admin Logistik</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Paket Mahasiswa 4</div>
        </div>
      </button>
    </header>
  );
}

// ─── APP UTAMA (ROUTER) ──────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<Page>("login");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState(notifData);

  const notifCount = notifications.filter(n => !n.read).length;
  const markRead = (id: number) => setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n));

  if (page === "login") return <LoginPage onLogin={() => setPage("dashboard")} />;

  return (
    <div className="flex h-screen bg-gray-50 text-foreground">
      <Sidebar currentPage={page} navigate={setPage} expanded={expanded} setExpanded={setExpanded} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header currentPage={page} navigate={setPage} notifCount={notifCount} showNotif={showNotif} setShowNotif={setShowNotif} notifications={notifications} markRead={markRead} />
        
        <main className="flex-1 overflow-y-auto">
          {page === "dashboard" && <DashboardPage navigate={setPage} />}
          
          {page === "adc-dashboard" && <ADCDashboard navigate={setPage} />}
          {page === "adc-stok" && <DrugTable navigate={setPage} />}
          {page === "adc-clma" && <ClmaWorkflow navigate={setPage} />}
          {page === "adc-farmakologi" && <PharmacologyAlert navigate={setPage} />}
          {page === "adc-narkotika" && <AuthNarkotika navigate={setPage} />}
          {page === "adc-daftar" && <DaftarObat navigate={setPage} />}
          
          {page === "erp-dashboard" && <ERPDashboard navigate={setPage} />}
          {page === "erp-prediksi" && <ERPPrediksi navigate={setPage} />}
          {page === "erp-kanban" && <KanbanBoard navigate={setPage} />}
          {page === "erp-gudang" && <ErpGudang navigate={setPage} />}
          {page === "erp-cssd" && <ERPCSSD navigate={setPage} />}
          {page === "erp-logistik" && <ERPLogistik navigate={setPage} />}
          {page === "erp-tender" && <ERPTender navigate={setPage} />}
          
          {page === "nut-dashboard" && <NutDashboard navigate={setPage} />}
          {page === "nut-interaksi" && <FoodDrugAlerts navigate={setPage} />}
          {page === "nut-makro" && <MacroDashboard navigate={setPage} />}
          {page === "nut-monitoring" && <NutMonitoring navigate={setPage} />}
          {page === "nut-meal" && <NutMeal navigate={setPage} />}
          {page === "nut-kafetaria" && <NutKafetaria navigate={setPage} />}
          
          {page === "waste-dashboard" && <WasteDashboard navigate={setPage} />}
          {page === "waste-manifest" && <WasteManifest navigate={setPage} />}
          {page === "waste-tps" && <WasteTPS navigate={setPage} />}
          {page === "waste-vendor" && <VendorTable navigate={setPage} />}
          {page === "waste-serah" && <WasteSerah navigate={setPage} />}
          {page === "waste-ipal" && <IpalMonitor navigate={setPage} />}
          
          {page === "profil" && <ProfilPage />}
          {page === "pengaturan" && <PengaturanPage />}
        </main>
      </div>
    </div>
  );
}