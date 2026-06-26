import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronRight, Download, FileSpreadsheet, FileText, X, CheckCircle, Utensils } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { downloadCSV } from "../../../helpers/exportCsv";
import { downloadExcel } from "../../../helpers/exportExcel";

const C = { blue: "#1549A0", green: "#00897B", amber: "#F59E0B", red: "#EF4444", teal: "#0891B2", emerald: "#10B981", purple: "#8B5CF6" };
function PageHeader({ title, breadcrumbs, children }: { title: string; breadcrumbs: string[]; children?: React.ReactNode }) { return (<div className="mb-5"><div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">{breadcrumbs.map((b, i) => (<span key={i} className="flex items-center gap-1.5">{i > 0 && <ChevronRight size={10} />}<span className={i === breadcrumbs.length - 1 ? "text-foreground font-medium" : ""}>{b}</span></span>))}</div><div className="flex items-center justify-between">{children && <div className="order-last">{children}</div>}<h2 className="text-xl font-bold text-foreground">{title}</h2></div></div>); }
function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub: string; icon: React.ElementType; color: string }) { return (<div className="bg-white rounded-xl p-4 shadow-sm border border-border flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "18" }}><Icon size={16} style={{ color }} /></div><div className="flex-1 min-w-0"><div className="text-xl font-bold text-foreground font-mono">{value}</div><div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</div><div className="text-[10px] text-muted-foreground">{sub}</div></div></div>); }
function SectionCard({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) { return (<div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden"><div className="flex items-center justify-between px-5 py-4 border-b border-border"><h3 className="font-semibold text-sm text-foreground">{title}</h3>{actions && <div className="flex items-center gap-2">{actions}</div>}</div><div className="p-5">{children}</div></div>); }
function Btn({ children, variant = "primary", size = "md", onClick, className = "" }: { children: React.ReactNode; variant?: string; size?: string; onClick?: () => void; className?: string }) { const base = "inline-flex items-center gap-1.5 font-semibold rounded-lg transition-all cursor-pointer border-0"; const sizes: Record<string, string> = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm" }; const variants: Record<string, string> = { primary: "bg-primary text-white hover:bg-blue-700 shadow-sm", ghost: "bg-transparent text-muted-foreground hover:bg-muted", outline: "border border-border bg-white text-foreground hover:bg-muted" }; return <button onClick={onClick} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>{children}</button>; }
function Badge({ variant, children }: { variant: string; children: React.ReactNode }) { const cls: Record<string, string> = { sesuai: "bg-emerald-100 text-emerald-700", defisit: "bg-red-100 text-red-700", surplus: "bg-amber-100 text-amber-700" }; return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${cls[variant] || "bg-gray-100 text-gray-700"}`}>{children}</span>; }
function Th({ children }: { children: React.ReactNode }) { return <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted border-b border-border whitespace-nowrap">{children}</th>; }
function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) { return <td className={`px-4 py-3 border-b border-border text-sm text-foreground ${mono ? "font-mono text-xs" : ""}`}>{children}</td>; }

interface Toast { id: number; message: string; type: "success" | "info" | "danger" | "warning"; }
function ToastContainer({ toasts }: { toasts: Toast[] }) { const colorMap = { success: "bg-emerald-600", info: "bg-blue-700", danger: "bg-red-600", warning: "bg-amber-500" }; return (<div className="fixed top-5 right-5 z-[200] flex flex-col gap-2">{toasts.map((t) => (<div key={t.id} className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-white text-sm font-semibold shadow-lg animate-[slideIn_0.3s_ease] ${colorMap[t.type]}`}><CheckCircle size={16} /> {t.message}</div>))}</div>); }

const patientData = [
  { id: "P-0892", nama: "Budi Santoso", kamar: "Mawar-204", targetP: 75, actualP: 72, targetK: 250, actualK: 240, targetL: 60, actualL: 65, status: "sesuai" },
  { id: "P-0893", nama: "Sri Wahyuni", kamar: "Melati-108", targetP: 85, actualK: 80, targetK: 280, actualK: 285, targetL: 70, actualL: 68, status: "sesuai" },
  { id: "P-0894", nama: "Ahmad Fauzi", kamar: "ICU-03", targetP: 55, actualP: 40, targetK: 200, actualK: 180, targetL: 50, actualL: 45, status: "defisit" },
  { id: "P-0895", nama: "Dewi Rahayu", kamar: "Anggrek-312", targetP: 95, actualP: 95, targetK: 300, actualK: 320, targetL: 80, actualL: 85, status: "surplus" },
];

const chartData = [
  { hari: "Sen", protein: 82, karbo: 65, lemak: 71 }, { hari: "Sel", protein: 88, karbo: 72, lemak: 68 },
  { hari: "Rab", protein: 75, karbo: 60, lemak: 74 }, { hari: "Kam", protein: 91, karbo: 78, lemak: 65 },
  { hari: "Jum", protein: 84, karbo: 69, lemak: 70 }, { hari: "Sab", protein: 79, karbo: 63, lemak: 67 },
  { hari: "Min", protein: 86, karbo: 74, lemak: 72 },
];

export default function MacroDashboard({ navigate }: { navigate: (p: string) => void }) {
  const [showExport, setShowExport] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => { const handler = (e: MouseEvent) => { if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExport(false); }; document.addEventListener("mousedown", handler); return () => document.removeEventListener("mousedown", handler); }, []);

  const showToast = (message: string, type: Toast["type"] = "success") => { const id = Date.now(); setToasts((p) => [...p, { id, message, type }]); setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000); };

  const exportData = useMemo(() => patientData.map(p => ({
    "ID Pasien": p.id, "Nama": p.nama, "Kamar": p.kamar,
    "Target Protein (g)": p.targetP, "Aktual Protein (g)": p.actualP,
    "Target Karbo (g)": p.targetK, "Aktual Karbo (g)": p.actualK,
    "Status": p.status.charAt(0).toUpperCase() + p.status.slice(1)
  })), []);

  const fileName = `makronutrien_${new Date().toISOString().split("T")[0]}`;

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Macronutrient Dashboard" breadcrumbs={["Modul 17 – Clinical Nutrition", "Macronutrient Dashboard"]}>
        <div className="flex gap-2">
          <div className="relative" ref={exportRef}>
            <Btn variant="ghost" size="sm" onClick={() => setShowExport(!showExport)}><Download size={13} /> Export</Btn>
            {showExport && (
              <div className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-lg border border-border py-1 z-50 min-w-[200px]">
                <button onClick={() => { setShowExport(false); downloadCSV(exportData, fileName); showToast("Data makronutrien di-export ke CSV", "info"); }} className="w-full text-left px-4 py-2.5 text-xs hover:bg-muted flex items-center gap-2.5 text-foreground"><FileText size={15} className="text-emerald-600" /><div><div className="font-semibold">Export CSV</div></div></button>
                <button onClick={() => { setShowExport(false); downloadExcel(exportData, fileName); showToast("Data makronutrien di-export ke Excel", "info"); }} className="w-full text-left px-4 py-2.5 text-xs hover:bg-muted flex items-center gap-2.5 text-foreground"><FileSpreadsheet size={15} className="text-green-700" /><div><div className="font-semibold">Export Excel</div></div></button>
              </div>
            )}
          </div>
        </div>
      </PageHeader>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Rata-rata Protein" value="84.2 g" sub="target 80g/pasien" icon={Utensils} color={C.red} />
        <StatCard label="Rata-rata Karbohidrat" value="68.7 g" sub="target 70g/pasien" icon={Utensils} color={C.amber} />
        <StatCard label="Rata-rata Lemak" value="69.6 g" sub="target 65g/pasien" icon={Utensils} color={C.teal} />
      </div>

      <SectionCard title="Tren Asupan Makronutrient 7 Hari Terakhir (Gram)">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="hari" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="protein" name="Protein" fill={C.red} radius={[4, 4, 0, 0]} />
            <Bar dataKey="karbo" name="Karbohidrat" fill={C.amber} radius={[4, 4, 0, 0]} />
            <Bar dataKey="lemak" name="Lemak" fill={C.teal} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      <SectionCard title="Monitoring Pasien vs Target" actions={<Btn variant="ghost" size="sm" onClick={() => navigate("nut-monitoring")}>Lihat Detail Pasien</Btn>}>
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead><tr><Th>ID</Th><Th>Nama Pasien</Th><Th>Kamar</Th><Th>Target P (g)</Th><Th>Aktual P (g)</Th><Th>Target K (g)</Th><Th>Aktual K (g)</Th><Th>Status</Th></tr></thead>
            <tbody>
              {patientData.map(p => (
                <tr key={p.id} className="hover:bg-muted/40">
                  <Td mono>{p.id}</Td><Td>{p.nama}</Td><Td><span className="text-xs">{p.kamar}</span></Td>
                  <Td mono>{p.targetP}</Td><Td mono className={p.actualP < p.targetP ? "text-red-500 font-bold" : ""}>{p.actualP}</Td>
                  <Td mono>{p.targetK}</Td><Td mono className={p.actualK > p.targetK ? "text-amber-500 font-bold" : ""}>{p.actualK}</Td>
                  <Td><Badge variant={p.status}>{p.status.charAt(0).toUpperCase() + p.status.slice(1)}</Badge></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
      <ToastContainer toasts={toasts} />
    </div>
  );
}