// src/app/components/DashboardPage.tsx

import { useState, useCallback } from "react";
import {
  LayoutDashboard, Menu, ChevronRight, ChevronDown,
  Bell, Search, User, Settings, LogOut, Download, Filter, Plus, Edit, Trash, Eye, RefreshCw,
  AlertTriangle, CheckCircle, Clock, Info, TrendingUp, TrendingDown, Activity,
  Pill, ShoppingCart, Utensils, Trash2, Zap, FileText, Truck, Shield,
} from "lucide-react";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { downloadCSV } from "../../helpers/exportCsv";

// ═══════════════════════════════════════════════════════════════
//  TYPE
// ═══════════════════════════════════════════════════════════════
type Page =
  | "dashboard"
  | "adc-dashboard" | "adc-stok" | "adc-clma" | "adc-farmakologi" | "adc-narkotika" | "adc-daftar"
  | "erp-dashboard" | "erp-prediksi" | "erp-kanban" | "erp-gudang" | "erp-cssd" | "erp-logistik" | "erp-tender"
  | "nut-dashboard" | "nut-interaksi" | "nut-makro" | "nut-monitoring" | "nut-meal" | "nut-kafetaria"
  | "waste-dashboard" | "waste-manifest" | "waste-tps" | "waste-vendor" | "waste-serah" | "waste-ipal"
  | "profil" | "pengaturan";

interface NotifItem {
  id: number;
  type: "danger" | "warning" | "info" | "success";
  msg: string;
  time: string;
  read: boolean;
  page: Page | null;  // ← BARU: setiap notif tahu harus navigasi ke mana
}

interface LogItem {
  waktu: string;
  user: string;
  aksi: string;
  modul: "ADC" | "ERP" | "Nutrisi" | "Limbah" | "Sistem";
  page: Page | null;  // ← BARU: setiap log tahu harus navigasi ke mana
}

interface Toast { id: number; message: string; type: "success" | "info" | "danger"; }

// ═══════════════════════════════════════════════════════════════
//  DATA CHART
// ═══════════════════════════════════════════════════════════════
const activityChart = [
  { jam: "06:00", dispensing: 12, penerimaan: 8, pengambilan: 15 },
  { jam: "08:00", dispensing: 45, penerimaan: 22, pengambilan: 38 },
  { jam: "10:00", dispensing: 78, penerimaan: 35, pengambilan: 62 },
  { jam: "12:00", dispensing: 56, penerimaan: 18, pengambilan: 45 },
  { jam: "14:00", dispensing: 89, penerimaan: 41, pengambilan: 73 },
  { jam: "16:00", dispensing: 67, penerimaan: 28, pengambilan: 55 },
  { jam: "18:00", dispensing: 34, penerimaan: 15, pengambilan: 28 },
  { jam: "20:00", dispensing: 23, penerimaan: 9, pengambilan: 19 },
];

const wasteDistChart = [
  { name: "Infeksius", value: 285, color: "#EF4444" },
  { name: "B3 Kimia",  value: 142, color: "#F59E0B" },
  { name: "Patologis", value: 68,  color: "#8B5CF6" },
  { name: "Farmasi",   value: 95,  color: "#0891B2" },
  { name: "Non-Med",   value: 210, color: "#10B981" },
];

// ═══════════════════════════════════════════════════════════════
//  DATA NOTIFIKASI — SETIAP ITEM PUNYA "page"
//  Ini kunci "interconnection": notif bukan cuma teks,
//  tapi tahu harus membawa user ke halaman mana
// ═══════════════════════════════════════════════════════════════
const INITIAL_NOTIFS: NotifItem[] = [
  { id: 1, type: "danger",  msg: "Stok Paracetamol 500mg kritis! Sisa 85 tab (min: 300)",          time: "5 mnt lalu",  read: false, page: "adc-stok" },
  { id: 2, type: "danger",  msg: "Stok Captopril 25mg kritis! Sisa 42 tab (min: 100)",             time: "12 mnt lalu", read: false, page: "adc-stok" },
  { id: 3, type: "warning", msg: "Interaksi obat: Warfarin + Aspirin – Pasien P-0891 Agus Salim",  time: "28 mnt lalu", read: false, page: "nut-interaksi" },
  { id: 4, type: "warning", msg: "Stok Ciprofloxacin di bawah level minimum (ADC-03)",             time: "1 jam lalu", read: true,  page: "adc-stok" },
  { id: 5, type: "info",    msg: "PO-2026-0251 diterima dari PT Kimia Farma senilai Rp 125 juta", time: "2 jam lalu", read: true,  page: "erp-kanban" },
  { id: 6, type: "success", msg: "Sterilisasi batch CST-0892 selesai dan siap distribusi",          time: "3 jam lalu", read: true,  page: "erp-cssd" },
  { id: 7, type: "info",    msg: "Manifest limbah WM-0450 diserahkan ke PT Wastec International",   time: "5 jam lalu", read: true,  page: "waste-manifest" },
];

// ═══════════════════════════════════════════════════════════════
//  DATA ACTIVITY LOG — SETIAP ITEM PUNYA "page"
// ═══════════════════════════════════════════════════════════════
const INITIAL_LOGS: LogItem[] = [
  { waktu: "14:32", user: "Ns. Sari Dewi",     aksi: "Pengambilan ADC-02: Amoxicillin 500mg ×3 Tab – Pasien Mawar-204",     modul: "ADC",     page: "adc-stok" },
  { waktu: "14:28", user: "Apt. Budi Hartono",  aksi: "Verifikasi stok CSSD Batch CST-0892 selesai sterilisasi",           modul: "ERP",     page: "erp-cssd" },
  { waktu: "14:15", user: "Ahli Gizi Rina S.",   aksi: "Update diet plan pasien P-0894 Ahmad Fauzi (CKD IV)",              modul: "Nutrisi", page: "nut-monitoring" },
  { waktu: "14:02", user: "Dr. Agus Setiawan",   aksi: "Setujui PO-2026-0251 senilai Rp 125.000.000",                    modul: "ERP",     page: "erp-kanban" },
  { waktu: "13:55", user: "Sanitarian Hendra",    aksi: "Input manifest WM-2026-0451 – 85 kg limbah infeksius",            modul: "Limbah",  page: "waste-manifest" },
  { waktu: "13:42", user: "Ns. Dewi R.",         aksi: "Auth narkotika: Morfin 10mg/mL – Pasien ICU-02, saksi: Apt. Suharto", modul: "ADC",  page: "adc-narkotika" },
  { waktu: "13:15", user: "Sistem",              aksi: "Auto-reorder trigger: Paracetamol 500mg stok kritis",              modul: "Sistem",  page: null },
];

// ═══════════════════════════════════════════════════════════════
//  STAT CARDS — SETIAP KARTU PUNYA "page" SEBAGAI TARGET NAVIGASI
// ═══════════════════════════════════════════════════════════════
const STAT_CARDS = [
  { label: "Total Item Obat",   value: "847",    sub: "item terdaftar",       icon: Pill,         color: "#1549A0", trend: "+12",     page: "adc-stok" as Page },
  { label: "Nilai Persediaan",  value: "Rp 8,4 M", sub: "aktif bulan ini",     icon: ShoppingCart, color: "#00897B", trend: "+3.2%",   page: "erp-dashboard" as Page },
  { label: "Pasien Nutrisi",    value: "186",    sub: "terpantau hari ini",    icon: Utensils,     color: "#0891B2", trend: "+8",      page: "nut-dashboard" as Page },
  { label: "Limbah Hari Ini",   value: "312 kg", sub: "total semua jenis",    icon: Trash2,      color: "#F59E0B", trend: "-5.1%",   page: "waste-dashboard" as Page },
  { label: "ADC Unit Aktif",    value: "6/6",    sub: "semua beroperasi",     icon: Zap,          color: "#10B981", trend: undefined, page: "adc-dashboard" as Page },
  { label: "PO Aktif",          value: "23",     sub: "nilai Rp 2,1 M",       icon: FileText,     color: "#8B5CF6", trend: undefined, page: "erp-kanban" as Page },
  { label: "Stok Kritis",       value: "4 item", sub: "perlu reorder segera", icon: AlertTriangle, color: "#EF4444", trend: undefined, page: "adc-stok" as Page },
  { label: "Vendor Aktif",      value: "18",     sub: "terverifikasi 2026",   icon: Truck,        color: "#EA580C", trend: undefined, page: "waste-vendor" as Page },
];

// Warna per modul (dipakai di log & notif)
const MODUL_COLORS: Record<string, string> = {
  ADC: "#1549A0",
  ERP: "#00897B",
  Nutrisi: "#0891B2",
  Limbah: "#F59E0B",
  Sistem: "#8B5CF6",
};

// ═══════════════════════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════════════════════
function ToastContainer({ toasts }: { toasts: Toast[] }) {
  const iconMap = { success: <CheckCircle size={16} />, danger: <AlertTriangle size={16} />, info: <Info size={16} /> };
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
//  KOMPONEN UTAMA
// ═══════════════════════════════════════════════════════════════
export default function DashboardPage({ navigate }: { navigate: (p: Page) => void }) {
  const [notifs, setNotifs] = useState<NotifItem[]>(INITIAL_NOTIFS);
  const [logs] = useState<LogItem[]>(INITIAL_LOGS);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [chartTab, setChartTab] = useState("Hari Ini");
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // ── Toast helper ──
  const toast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  // ── Unread count ──
  const unreadCount = notifs.filter((n) => !n.read).length;

  // ════════════════════════════════════════════════════════════
  //  REFRESH: simulasi loading + toast
  // ════════════════════════════════════════════════════════════
  const handleRefresh = () => {
    setRefreshing(true);
    // Simulasi network delay
    setTimeout(() => {
      setRefreshing(false);
      toast("Data dashboard berhasil diperbarui", "success");
    }, 1200);
  };

  // ════════════════════════════════════════════════════════════
  //  EXPORT: download ringkasan dashboard sebagai CSV
  // ════════════════════════════════════════════════════════════
  const handleExport = () => {
    const summaryData = [
      { metrik: "Total Item Obat", nilai: "847", satuan: "item" },
      { metrik: "Nilai Persediaan", nilai: "8400000000", satuan: "Rp" },
      { metrik: "Pasien Nutrisi", nilai: "186", satuan: "orang" },
      { metrik: "Limbah Hari Ini", nilai: "312", satuan: "kg" },
      { metrik: "ADC Unit Aktif", nilai: "6/6", satuan: "unit" },
      { metrik: "PO Aktif", nilai: "23", satuan: "PO" },
      { metrik: "Stok Kritis", nilai: "4", satuan: "item" },
      { metrik: "Vendor Aktif", nilai: "18", satuan: "vendor" },
      { metrik: "Notif Belum Dibaca", nilai: String(unreadCount), satuan: "notif" },
    ];

    const today = new Date().toISOString().slice(0, 10);
    downloadCSV(summaryData, `dashboard-ringkasan-${today}.csv`, {
      metrik: "Metrik",
      nilai: "Nilai",
      satuan: "Satuan",
    });
    toast("Ringkasan dashboard didownload (CSV)", "info");
  };

  // ════════════════════════════════════════════════════════════
  //  NOTIFIKASI: klik → mark read + navigasi
  // ════════════════════════════════════════════════════════════
  const handleNotifClick = (notif: NotifItem) => {
    // 1. Tandai sudah dibaca
    setNotifs((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );

    // 2. Navigasi ke halaman yang benar (kalau ada)
    if (notif.page) {
      navigate(notif.page);
    }
  };

  // Mark semua sebagai dibaca
  const markAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    toast("Semua notifikasi ditandai sudah dibaca", "info");
  };

  // ════════════════════════════════════════════════════════════
  //  LOG: klik → navigasi ke dashboard modul
  // ════════════════════════════════════════════════════════════
  const handleLogClick = (log: LogItem) => {
    if (log.page) {
      navigate(log.page);
    }
  };

  // ── Waktu sekarang ──
  const now = new Date();
  const wib = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(now);
  const dateStr = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(now);

  // ── Notif styling config ──
  const notifStyle: Record<string, { bg: string; border: string; icon: React.ElementType; iconColor: string }> = {
    danger:  { bg: "bg-red-50",    border: "border-red-100",    icon: AlertTriangle, iconColor: "text-red-500" },
    warning: { bg: "bg-amber-50",  border: "border-amber-100",  icon: AlertTriangle, iconColor: "text-amber-500" },
    success: { bg: "bg-emerald-50", border: "border-emerald-100", icon: CheckCircle, iconColor: "text-emerald-500" },
    info:    { bg: "bg-blue-50",   border: "border-blue-100",   icon: Info,         iconColor: "text-blue-500" },
  };

  return (
    <div className="p-6 space-y-5">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <span>MediCore HIS</span>
            <ChevronRight size={10} />
            <span className="text-foreground font-medium">Dashboard Utama</span>
          </div>
          <h2 className="text-xl font-bold text-foreground">Dashboard Utama</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Tombol Refresh — ada loading state */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg bg-transparent text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Memuat..." : "Refresh"}
          </button>

          {/* Tombol Export */}
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {/* ═══ STAT CARDS — SEMUA KLIKABLE ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              onClick={() => navigate(s.page)}
              className="bg-white rounded-xl p-5 shadow-sm border border-border flex flex-col gap-3 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{s.label}</span>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: s.color + "18" }}>
                  <Icon size={18} style={{ color: s.color }} />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground font-mono">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  {s.trend && (
                    <span className={`font-semibold ${s.trend.startsWith("+") || s.trend.startsWith("-") ? (s.trend.startsWith("-") ? "text-emerald-600" : "text-emerald-600") : ""}`}>
                      {s.trend}
                    </span>
                  )}
                  {s.sub}
                </div>
              </div>
              {/* Indikator klik */}
              <div className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <Eye size={9} /> Klik untuk melihat detail
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ CHARTS ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-sm text-foreground">Aktivitas Sistem Hari Ini (per Jam)</h3>
            <div className="flex gap-1">
              {["Hari Ini", "7 Hari", "30 Hari"].map((t) => (
                <button
                  key={t}
                  onClick={() => setChartTab(t)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                    chartTab === t ? "bg-primary text-white" : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={activityChart}>
                <defs>
                  <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1549A0" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1549A0" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00897B" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#00897B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="jam" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="dispensing" name="Dispensing ADC" stroke="#1549A0" fill="url(#gBlue)" strokeWidth={2} />
                <Area type="monotone" dataKey="penerimaan" name="Penerimaan Barang" stroke="#00897B" fill="url(#gGreen)" strokeWidth={2} />
                <Area type="monotone" dataKey="pengambilan" name="Pengambilan Staf" stroke="#F59E0B" fill="none" strokeWidth={2} strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-sm text-foreground">Distribusi Limbah Medis</h3>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={wasteDistChart} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {wasteDistChart.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v: number) => [`${v} kg`, ""]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {wasteDistChart.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                    {d.name}
                  </div>
                  <span className="text-xs font-semibold text-foreground font-mono">{d.value} kg</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ NOTIFIKASI & ACTIVITY LOG ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Notifikasi — KLIKABLE, MARK READ, NAVIGASI ── */}
        <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-foreground">Notifikasi Sistem</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">{unreadCount} baru</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  Tandai semua dibaca
                </button>
              )}
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                {showNotifDropdown ? "Sembunyikan" : "Lihat Semua"}
              </button>
            </div>
          </div>
          <div className="divide-y divide-border">
            {(showNotifDropdown ? notifs : notifs.slice(0, 5)).map((n) => {
              const style = notifStyle[n.type];
              const NIcon = style.icon;
              return (
                <div
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  className={`flex items-start gap-2.5 px-5 py-3 cursor-pointer transition-colors hover:bg-muted/50 ${!n.read ? style.bg : ""}`}
                >
                  <NIcon size={13} className={`mt-0.5 shrink-0 ${style.iconColor}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-relaxed">{n.msg}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] text-muted-foreground">{n.time}</p>
                      {n.page && (
                        <span className="text-[10px] font-semibold text-primary flex items-center gap-0.5">
                          <ChevronRight size={8} /> Buka halaman
                        </span>
                      )}
                    </div>
                  </div>
                  {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Activity Log — KLIKABLE, NAVIGASI KE MODUL ── */}
        <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-sm text-foreground">Activity Log Terkini</h3>
            <span className="text-xs text-muted-foreground">{wib} WIB</span>
          </div>
          <div className="divide-y divide-border">
            {logs.map((log, i) => {
              const color = MODUL_COLORS[log.modul] || "#64748B";
              return (
                <div
                  key={i}
                  onClick={() => handleLogClick(log)}
                  className={`flex items-start gap-3 px-5 py-3 transition-colors ${log.page ? "cursor-pointer hover:bg-muted/50" : "cursor-default"}`}
                >
                  <div className="w-14 shrink-0">
                    <span className="text-[10px] font-bold text-muted-foreground font-mono">{log.waktu}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: color + "18", color }}
                      >
                        {log.modul}
                      </span>
                      <span className="text-[10px] font-semibold text-foreground truncate">{log.user}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{log.aksi}</p>
                    {log.page && (
                      <span className="text-[10px] font-semibold text-primary flex items-center gap-0.5 mt-0.5">
                        <ChevronRight size={8} /> Lihat di modul {log.modul}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ FOOTER INFO ═══ */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
        <span>{dateStr}</span>
        <span>MediCore HIS v2.0 — Paket Mahasiswa 4</span>
      </div>

      {/* Toasts */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}