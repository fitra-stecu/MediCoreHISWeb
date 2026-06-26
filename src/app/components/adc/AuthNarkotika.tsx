import { useState } from "react";
import { Shield, Fingerprint, CheckCircle, X, ChevronRight, FileText, User, Pill } from "lucide-react";

const C = { blue: "#1549A0", green: "#00897B", purple: "#8B5CF6", emerald: "#10B981" };
function PageHeader({ title, breadcrumbs, children }: { title: string; breadcrumbs: string[]; children?: React.ReactNode }) {
  return (<div className="mb-5"><div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">{breadcrumbs.map((b, i) => (<span key={i} className="flex items-center gap-1.5">{i > 0 && <ChevronRight size={10} />}<span className={i === breadcrumbs.length - 1 ? "text-foreground font-medium" : ""}>{b}</span></span>))}</div><div className="flex items-center justify-between">{children && <div className="order-last">{children}</div>}<h2 className="text-xl font-bold text-foreground">{title}</h2></div></div>);
}
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (<div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden"><div className="px-5 py-4 border-b border-border"><h3 className="font-semibold text-sm text-foreground">{title}</h3></div><div className="p-5">{children}</div></div>);
}
function Btn({ children, variant = "primary", size = "md", onClick, disabled, className = "" }: { children: React.ReactNode; variant?: string; size?: string; onClick?: () => void; disabled?: boolean; className?: string }) {
  const base = "inline-flex items-center gap-1.5 font-semibold rounded-lg transition-all cursor-pointer border-0"; const sizes: Record<string, string> = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm" }; const variants: Record<string, string> = { primary: "bg-primary text-white hover:bg-blue-700 shadow-sm", outline: "border border-border bg-white text-foreground hover:bg-muted" }; return <button onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}>{children}</button>;
}

export default function AuthNarkotika({ navigate }: { navigate: (p: string) => void }) {
  const [step, setStep] = useState(1);
  const [scanning, setScanning] = useState(false);
  const [form, setForm] = useState({ resep: "", pasien: "", dokter: "", narkotika: "Morphine 10mg/1ml", dosis: "" });

  const handleSubmitForm = (e: React.FormEvent) => { e.preventDefault(); setStep(2); };
  const handleScanFinger = () => {
    setScanning(true);
    setTimeout(() => { setScanning(false); setStep(3); }, 2500);
  };

  const stepsConfig = [
    { id: 1, label: "Verifikasi Data", icon: FileText },
    { id: 2, label: "Sidik Jari Petugas", icon: Fingerprint },
    { id: 3, label: "Pengambilan Disetujui", icon: CheckCircle },
  ];

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Auth Narkotika Step-Up" breadcrumbs={["Modul 4 – ADC", "Auth Narkotika Step-Up"]} />

      <div className="flex items-center justify-center gap-4 mb-2">
        {stepsConfig.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${step >= s.id ? "bg-primary border-primary text-white" : "bg-white border-muted text-muted-foreground"}`}>
              <s.icon size={18} />
            </div>
            <span className={`text-xs font-semibold hidden sm:block ${step >= s.id ? "text-primary" : "text-muted-foreground"}`}>{s.label}</span>
            {i < stepsConfig.length - 1 && <div className={`w-16 h-1 rounded-full mx-2 ${step > s.id ? "bg-primary" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      <div className="max-w-2xl mx-auto">
        {step === 1 && (
          <SectionCard title="Data Resep & Penerima">
            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-foreground mb-1">No. Resep</label><input required className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" value={form.resep} onChange={e => setForm({...form, resep: e.target.value})} placeholder="RSP-2026-XXXX" /></div>
                <div><label className="block text-xs font-semibold text-foreground mb-1">Nama Pasien</label><input required className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" value={form.pasien} onChange={e => setForm({...form, pasien: e.target.value})} placeholder="Nama Lengkap" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-foreground mb-1">Dokter Pengirim</label><input required className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" value={form.dokter} onChange={e => setForm({...form, dokter: e.target.value})} placeholder="dr. XXX" /></div>
                <div><label className="block text-xs font-semibold text-foreground mb-1">Dosis</label><input required className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" value={form.dosis} onChange={e => setForm({...form, dosis: e.target.value})} placeholder="1 Ampul" /></div>
              </div>
              <div><label className="block text-xs font-semibold text-foreground mb-1">Obat Narkotika</label><select className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" value={form.narkotika} onChange={e => setForm({...form, narkotika: e.target.value})}><option>Morphine 10mg/1ml</option><option>Fentanyl 50mcg/ml</option><option>Pethidine 100mg/2ml</option></select></div>
              <div className="flex justify-end pt-2"><Btn type="submit">Lanjut Verifikasi Biometrik <Shield size={14} /></Btn></div>
            </form>
          </SectionCard>
        )}

        {step === 2 && (
          <SectionCard title="Autentikasi Sidik Jari">
            <div className="flex flex-col items-center py-8">
              <div className={`w-32 h-32 rounded-full flex items-center justify-center border-4 mb-6 transition-all ${scanning ? "border-purple-500 bg-purple-50 animate-pulse" : "border-muted bg-muted/50"}`}>
                <Fingerprint size={64} className={scanning ? "text-purple-600" : "text-muted-foreground"} />
              </div>
              <p className="text-sm text-muted-foreground mb-6">{scanning ? "Memindai sidik jari..." : "Silakan tempelkan sidik jari pada alat pemindai"}</p>
              <Btn onClick={handleScanFinger} disabled={scanning}><Fingerprint size={14} /> {scanning ? "Memverifikasi..." : "Mulai Pemindaian"}</Btn>
            </div>
          </SectionCard>
        )}

        {step === 3 && (
          <SectionCard title="Verifikasi Berhasil">
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-4"><CheckCircle size={40} className="text-emerald-600" /></div>
              <h3 className="text-lg font-bold text-foreground mb-1">Akses Diizinkan</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">Pengambilan <strong>{form.narkotika}</strong> untuk pasien <strong>{form.pasien}</strong> telah disetujui dan dicatat log audit.</p>
              <div className="flex gap-3">
                <Btn variant="outline" onClick={() => navigate("adc-stok")}>Ke Monitoring Stok</Btn>
                <Btn onClick={() => setStep(1)}>Transaksi Baru</Btn>
              </div>
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}