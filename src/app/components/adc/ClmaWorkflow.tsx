// src/app/components/adc/ClmaWorkflow.tsx

import { useState, useMemo } from "react";
import {
  ChevronRight, QrCode, Scan, Pill, Check, RefreshCw,
  AlertCircle, ChevronDown, UserCheck, ShieldCheck,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════
//  UI PRIMITIVES (sama seperti di App.tsx asli, supaya visual identik)
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
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {children}
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
  const sizes: Record<string, string> = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-sm" };
  const variants: Record<string, string> = {
    primary: "bg-primary text-white hover:bg-blue-700 shadow-sm",
    secondary: "bg-secondary text-primary hover:bg-blue-100",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "bg-transparent text-muted-foreground hover:bg-muted",
    outline: "border border-border bg-white text-foreground hover:bg-muted",
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}>
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
//  DATABASE SIMULASI (untuk cascading dropdown manual)
// ═══════════════════════════════════════════════════════════════
interface Nurse { id: string; nama: string; unit: string; shift: string; }
interface Patient { id: string; nama: string; kamar: string; diagnosa: string; nurseId: string; }
interface Prescription { id: string; patientId: string; drugId: string; drugNama: string; dosis: string; rute: string; batch: string; exp: string; adc: string; }

const DB_NURSES: Nurse[] = [
  { id: "NS-001", nama: "Ns. Sari Dewi",    unit: "Mawar (Bedah)",  shift: "Siang" },
  { id: "NS-002", nama: "Ns. Dewi Rahayu",  unit: "Melati (Dalam)", shift: "Siang" },
  { id: "NS-003", nama: "Ns. Rina Kusuma",  unit: "Anggrek (Anak)", shift: "Sore" },
  { id: "NS-004", nama: "Ns. Budi Santoso", unit: "ICU",            shift: "Malam" },
  { id: "NS-005", nama: "Ns. Ayu Lestari",  unit: "Tulip (Obgyn)",  shift: "Siang" },
];

const DB_PATIENTS: Patient[] = [
  { id: "P-0891", nama: "Agus Salim",    kamar: "Mawar-204",  diagnosa: "Fraktur Femur",    nurseId: "NS-001" },
  { id: "P-0892", nama: "Budi Santoso",   kamar: "Mawar-201",  diagnosa: "Apendisitis Akut", nurseId: "NS-001" },
  { id: "P-0893", nama: "Sri Wahyuni",    kamar: "Melati-108",  diagnosa: "DM Tipe 2",       nurseId: "NS-002" },
  { id: "P-0894", nama: "Ahmad Fauzi",    kamar: "ICU-03",     diagnosa: "CKD Stad. IV",     nurseId: "NS-004" },
  { id: "P-0895", nama: "Dewi Rahayu",    kamar: "Anggrek-312", diagnosa: "Post Partum",     nurseId: "NS-003" },
  { id: "P-0896", nama: "Slamet Riyadi",  kamar: "Tulip-205",  diagnosa: "Ca Paru Stad. III", nurseId: "NS-005" },
  { id: "P-0897", nama: "Ratna Sari",     kamar: "Mawar-208",  diagnosa: "Cholelithiasis",  nurseId: "NS-001" },
  { id: "P-0898", nama: "Hendra Wijaya",  kamar: "Melati-112",  diagnosa: "Hipertensi",      nurseId: "NS-002" },
];

const DB_PRESCRIPTIONS: Prescription[] = [
  { id: "RX-001", patientId: "P-0891", drugId: "OBT001", drugNama: "Amoxicillin 500mg",    dosis: "3x1 Tab", rute: "PO", batch: "AMX-2025-0892", exp: "2027-08-15", adc: "ADC-03" },
  { id: "RX-002", patientId: "P-0891", drugId: "OBT002", drugNama: "Paracetamol 500mg",    dosis: "3x1 Tab", rute: "PO", batch: "PCM-2025-1204", exp: "2026-12-31", adc: "ADC-03" },
  { id: "RX-003", patientId: "P-0891", drugId: "OBT010", drugNama: "Captopril 25mg",       dosis: "2x1 Tab", rute: "PO", batch: "CPT-2025-0511", exp: "2026-08-20", adc: "ADC-01" },
  { id: "RX-004", patientId: "P-0892", drugId: "OBT001", drugNama: "Amoxicillin 500mg",    dosis: "3x1 Tab", rute: "PO", batch: "AMX-2025-0892", exp: "2027-08-15", adc: "ADC-03" },
  { id: "RX-005", patientId: "P-0892", drugId: "OBT005", drugNama: "Amlodipine 5mg",       dosis: "1x1 Tab", rute: "PO", batch: "AML-2025-0723", exp: "2027-11-10", adc: "ADC-02" },
  { id: "RX-006", patientId: "P-0893", drugId: "OBT003", drugNama: "Metformin 500mg",     dosis: "2x1 Tab", rute: "PO", batch: "MET-2025-0308", exp: "2027-03-22", adc: "ADC-02" },
  { id: "RX-007", patientId: "P-0894", drugId: "OBT006", drugNama: "Omeprazole 20mg",     dosis: "1x1 Kap", rute: "PO", batch: "OMP-2025-0119", exp: "2027-01-15", adc: "ADC-04" },
  { id: "RX-008", patientId: "P-0894", drugId: "OBT010", drugNama: "Captopril 25mg",       dosis: "2x1 Tab", rute: "PO", batch: "CPT-2025-0511", exp: "2026-08-20", adc: "ADC-01" },
  { id: "RX-009", patientId: "P-0895", drugId: "OBT002", drugNama: "Paracetamol 500mg",    dosis: "3x1 Tab", rute: "PO", batch: "PCM-2025-1204", exp: "2026-12-31", adc: "ADC-03" },
  { id: "RX-010", patientId: "P-0896", drugId: "OBT007", drugNama: "Morfin HCl 10mg/mL",  dosis: "PRN",     rute: "IV", batch: "MOR-2025-0044", exp: "2026-11-30", adc: "ADC-06" },
  { id: "RX-011", patientId: "P-0897", drugId: "OBT004", drugNama: "Ciprofloxacin 500mg",  dosis: "2x1 Tab", rute: "PO", batch: "CIP-2025-0602", exp: "2026-09-30", adc: "ADC-03" },
  { id: "RX-012", patientId: "P-0898", drugId: "OBT005", drugNama: "Amlodipine 5mg",       dosis: "1x1 Tab", rute: "PO", batch: "AML-2025-0723", exp: "2027-11-10", adc: "ADC-02" },
];

// ═══════════════════════════════════════════════════════════════
//  CLMA WORKFLOW — VISUAL ASLI + TAMBAHAN MANUAL INPUT
// ═══════════════════════════════════════════════════════════════
function CLMAWorkflow() {
  // ── STATE ASLI (jangan diubah) ──
  const [step, setStep] = useState(0);
  const [scanning, setScanning] = useState(false);

  // ── STATE TAMBAHAN: manual input ──
  const [showManual, setShowManual] = useState(false);
  const [nurseId, setNurseId] = useState("");
  const [patientId, setPatientId] = useState("");
  const [rxId, setRxId] = useState("");
  const [manualDone, setManualDone] = useState(false);

  // ── DATA STEPS ASLI (jangan diubah) ──
  const steps = [
    { title: "Scan ID Perawat", icon: QrCode, desc: "Pindai kartu identitas atau barcode badge perawat", data: "NIP: 198502152015042001\nNama: Ns. Sari Dewi, S.Kep\nUnit: Bangsal Mawar (Bedah)\nSif: Siang (07:00-14:00)" },
    { title: "Scan Gelang Pasien", icon: Scan, desc: "Pindai barcode gelang identitas pasien di tangan", data: "No. RM: 00-41-29-87\nNama: Budi Santoso\nTgl Lahir: 15 Feb 1968\nKamar: Mawar-204 / DM Tipe 2" },
    { title: "Scan Barcode Obat", icon: Pill, desc: "Pindai barcode pada kemasan obat yang akan diambil", data: "Kode: OBT001\nNama: Amoxicillin 500mg Tab\nBatch: AMX-2025-0892\nExp: 2027-08-15 / ADC-03" },
  ];

  // ── CASCADING FILTERS ──
  const filteredPatients = useMemo(() => {
    if (!nurseId) return [];
    return DB_PATIENTS.filter((p) => p.nurseId === nurseId);
  }, [nurseId]);

  const filteredRx = useMemo(() => {
    if (!patientId) return [];
    return DB_PRESCRIPTIONS.filter((r) => r.patientId === patientId);
  }, [patientId]);

  const selNurse = useMemo(() => DB_NURSES.find((n) => n.id === nurseId), [nurseId]);
  const selPatient = useMemo(() => DB_PATIENTS.find((p) => p.id === patientId), [patientId]);
  const selRx = useMemo(() => DB_PRESCRIPTIONS.find((r) => r.id === rxId), [rxId]);
  const isNarkotika = selRx?.drugId === "OBT007" || selRx?.drugId === "OBT008";
  const isFormValid = nurseId !== "" && patientId !== "" && rxId !== "";

  const handleNurseChange = (id: string) => { setNurseId(id); setPatientId(""); setRxId(""); setManualDone(false); };
  const handlePatientChange = (id: string) => { setPatientId(id); setRxId(""); setManualDone(false); };

  // ── SUBMIT MANUAL: langsung loncat ke selesai ──
  const handleManualSubmit = () => {
    if (!isFormValid || !selNurse || !selPatient || !selRx) return;
    // Override data steps dengan data dari manual input
    steps[0].data = `ID: ${selNurse.id}\nNama: ${selNurse.nama}\nUnit: ${selNurse.unit}\nShift: ${selNurse.shift}`;
    steps[1].data = `No. RM: ${selPatient.id}\nNama: ${selPatient.nama}\nKamar: ${selPatient.kamar} / ${selPatient.diagnosa}`;
    steps[2].data = `Kode: ${selRx.drugId}\nNama: ${selRx.drugNama}\nBatch: ${selRx.batch}\nExp: ${selRx.exp} / ${selRx.adc}`;
    setManualDone(true);
    setStep(3);
  };

  // ── DO SCAN ASLI (jangan diubah) ──
  const doScan = () => {
    setScanning(true);
    setTimeout(() => { setScanning(false); setStep((s) => Math.min(s + 1, 3)); }, 1500);
  };

  const fc = "w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50";

  return (
    <div className="p-6 space-y-5">

      {/* ── HEADER ASLI (jangan diubah) ── */}
      <PageHeader title="CLMA Workflow – Closed-Loop Medication Administration" breadcrumbs={["Modul 4 – ADC", "CLMA Workflow"]}>
        <Btn variant="ghost" size="sm" onClick={() => { setStep(0); setManualDone(false); setNurseId(""); setPatientId(""); setRxId(""); }}><RefreshCw size={13} /> Reset</Btn>
      </PageHeader>

      {/* ════════════════════════════════════════════════════════════
          TAMBAHAN: Input Manual (kecil, di atas stepper)
      ════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <UserCheck size={14} className="text-primary" />
            <span className="text-sm font-semibold text-foreground">Input Manual</span>
            <span className="text-[10px] text-muted-foreground">— tanpa scanner, ketik ID langsung</span>
          </div>
          <button
            onClick={() => setShowManual(!showManual)}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            {showManual ? "Tutup" : "Buka"}
            <ChevronDown size={12} className={`transition-transform ${showManual ? "rotate-180" : ""}`} />
          </button>
        </div>

        {showManual && (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Dropdown Perawat */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">ID Perawat</label>
                <select value={nurseId} onChange={(e) => handleNurseChange(e.target.value)} className={fc}>
                  <option value="">— Pilih —</option>
                  {DB_NURSES.map((n) => (
                    <option key={n.id} value={n.id}>{n.id} — {n.nama}</option>
                  ))}
                </select>
              </div>

              {/* Dropdown Pasien (cascade) */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">ID Pasien</label>
                {!nurseId ? (
                  <div className={`${fc} opacity-40 flex items-center gap-1.5 text-xs text-muted-foreground`}>
                    <AlertCircle size={12} /> Pilih perawat dulu
                  </div>
                ) : filteredPatients.length === 0 ? (
                  <div className={`${fc} bg-amber-50 border-amber-200 text-xs text-amber-600 flex items-center gap-1.5`}>
                    <AlertCircle size={12} /> Tidak ada pasien
                  </div>
                ) : (
                  <select value={patientId} onChange={(e) => handlePatientChange(e.target.value)} className={fc}>
                    <option value="">— Pilih ({filteredPatients.length}) —</option>
                    {filteredPatients.map((p) => (
                      <option key={p.id} value={p.id}>{p.id} — {p.nama} ({p.kamar})</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Dropdown Obat (cascade) */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">ID Obat</label>
                {!patientId ? (
                  <div className={`${fc} opacity-40 flex items-center gap-1.5 text-xs text-muted-foreground`}>
                    <AlertCircle size={12} /> Pilih pasien dulu
                  </div>
                ) : filteredRx.length === 0 ? (
                  <div className={`${fc} bg-amber-50 border-amber-200 text-xs text-amber-600 flex items-center gap-1.5`}>
                    <AlertCircle size={12} /> Tidak ada resep
                  </div>
                ) : (
                  <select value={rxId} onChange={(e) => setRxId(e.target.value)} className={fc}>
                    <option value="">— Pilih ({filteredRx.length}) —</option>
                    {filteredRx.map((r) => (
                      <option key={r.id} value={r.id}>{r.drugId} — {r.drugNama} ({r.dosis})</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Info baris yang dipilih + tombol */}
            {selPatient && selRx && (
              <div className="flex items-center justify-between mt-3 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-blue-700"><strong>{selNurse?.nama}</strong></span>
                  <span className="text-blue-400">→</span>
                  <span className="text-blue-700"><strong>{selPatient.nama}</strong> ({selPatient.kamar})</span>
                  <span className="text-blue-400">→</span>
                  <span className="text-blue-700"><strong>{selRx.drugNama}</strong> {selRx.dosis}</span>
                  {isNarkotika && (
                    <span className="text-[9px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">NARKOTIKA</span>
                  )}
                </div>
                <button
                  onClick={handleManualSubmit}
                  disabled={!isFormValid}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ShieldCheck size={13} /> Verifikasi & Simpan
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── PROGRESS ASLI (jangan diubah) ── */}
      <div className="flex items-center justify-center gap-0">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${i < step ? "bg-emerald-500 border-emerald-500 text-white" : i === step ? "bg-primary border-primary text-white" : "bg-white border-border text-muted-foreground"}`}>
              {i < step ? <Check size={14} /> : i + 1}
            </div>
            <div className="hidden sm:block ml-2 mr-4">
              <div className={`text-xs font-semibold ${i === step ? "text-primary" : i < step ? "text-emerald-600" : "text-muted-foreground"}`}>{s.title}</div>
            </div>
            {i < steps.length - 1 && <div className={`w-16 h-0.5 mr-4 ${i < step ? "bg-emerald-400" : "bg-border"}`} />}
          </div>
        ))}
        <div className="flex items-center ml-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${step === 3 ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-border text-muted-foreground"}`}>
            {step === 3 ? <Check size={14} /> : "✓"}
          </div>
          <div className="hidden sm:block ml-2"><div className="text-xs font-semibold text-muted-foreground">Selesai</div></div>
        </div>
      </div>

      {/* ── KONTEN ASLI (jangan diubah) ── */}
      {step < 3 ? (
        <div className="max-w-lg mx-auto">
          <SectionCard title={`Langkah ${step + 1}: ${steps[step].title}`}>
            <div className="text-center space-y-5">
              <div className="w-32 h-32 mx-auto bg-blue-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-primary/30">
                {scanning ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-primary font-medium">Memindai...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    {(() => { const Icon = steps[step].icon; return <Icon size={40} className="text-primary/40" />; })()}
                    <span className="text-xs">Arahkan scanner</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{steps[step].desc}</p>
              <Btn onClick={doScan} disabled={scanning} className="w-full justify-center">
                <Scan size={14} /> {scanning ? "Memindai..." : `Simulasi Scan ${steps[step].title}`}
              </Btn>
              {step > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-left">
                  <div className="text-xs font-semibold text-emerald-700 mb-1 flex items-center gap-1"><Check size={12} /> Data Terverifikasi (Langkah {step})</div>
                  <pre className="text-xs text-emerald-800 whitespace-pre-line">{steps[step - 1].data}</pre>
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      ) : (
        <div className="max-w-lg mx-auto">
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-6 text-center">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-emerald-800 mb-2">Verifikasi Berhasil!</h3>
            <p className="text-emerald-700 text-sm mb-4">
              {manualDone ? "CLMA via input manual berhasil." : "Semua tahap CLMA telah selesai. Obat siap dikeluarkan dari ADC."}
            </p>
            <div className="bg-white rounded-xl p-4 text-left space-y-2 mb-4">
              {steps.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <Check size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">{s.title}: </span>
                    <span className="text-muted-foreground">{s.data.split("\n")[0]}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-emerald-100 rounded-lg p-3 text-xs text-emerald-800 font-mono mb-4">
              Transaction ID: CLMA-{new Date().toISOString().slice(0, 10).replace(/-/g, "")}-{Math.floor(Math.random() * 9000) + 1000}
              {manualDone && (
                <span className="block text-[10px] mt-1 opacity-70">Metode: Input Manual</span>
              )}
            </div>
            <Btn variant="success" onClick={() => { setStep(0); setManualDone(false); setNurseId(""); setPatientId(""); setRxId(""); }} className="w-full justify-center">
              <RefreshCw size={13} /> Mulai Transaksi Baru
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClmaWorkflowWrapper() {
  // Biar bisa dipanggil dari App.tsx tanpa conflict nama
 return <CLMAWorkflow />;
}