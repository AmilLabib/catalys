import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Calendar,
  FileSpreadsheet,
  FileText,
  FileEdit,
  Lock,
  TrendingUp,
  PiggyBank,
  Wallet,
  Activity,
  Gauge,
  ArrowRight,
  Building2,
  Lightbulb,
} from "lucide-react";
import { usePageTitle } from "../hooks/usePageTitle";
import { useEntitasSendiri, useLaporan } from "../hooks/useLaporan";
import { useAccount } from "../context/AccountContext";
import { useToast } from "../context/ToastContext";
import { useJournal } from "../context/JournalContext";
import { useChartOfAccounts } from "../context/ChartOfAccountsContext";
import QuotaBadge from "../components/QuotaBadge";
import ScanStruk from "../components/ScanStruk";
import {
  ENTITAS,
  KONSOLIDASI,
  LABA_RUGI,
  TAHUN_TERSEDIA,
  TAHUN_BERJALAN,
  formatRp,
  formatRpSingkat,
  hitungLaporan,
  labelPeriode,
} from "../data/laporan";
import { susunCalk, susunTabel, type Baris } from "../data/laporanTabel";
import { eksporExcel, eksporPdf } from "../utils/eksporLaporan";
import { lockedMessage } from "../config/access";
import { BRANCHES } from "../config/access";

const WARNA = ["#012a3d", "#2f6b8f", "#5487ab", "#9cb2c1", "#0f766e", "#c2410c", "#7c3aed", "#be123c", "#64748b", "#ca8a04"];

const angka = (v: number | undefined) => {
  if (v === undefined) return "";
  const s = Math.abs(Math.round(v)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return v < 0 ? `(${s})` : s;
};

const persen = (v: number) => `${(v * 100).toFixed(1).replace(".", ",")}%`;

function tumbuh(now: number, before: number) {
  if (!before) return null;
  return (now - before) / Math.abs(before);
}

export default function Financial() {
  usePageTitle("Laporan Keuangan");
  const navigate = useNavigate();
  const { role, canSee, canUse, pakaiKuota, quotaRemaining, profile } = useAccount();
  const { toast } = useToast();
  const sendiri = useEntitasSendiri();

  const [tahun, setTahun] = useState(TAHUN_BERJALAN);
  const [entitas, setEntitas] = useState(sendiri);
  const [tab, setTab] = useState(0);
  const lap = useLaporan(tahun, entitas);
  const tabel = useMemo(() => susunTabel(lap), [lap]);
  const calk = useMemo(() => susunCalk(lap, profile.namaUsaha), [lap, profile.namaUsaha]);

  const R = lap.ringkasan;
  const RL = lap.ringkasanLalu;

  // ---------- Ekspor ----------
  const [mengekspor, setMengekspor] = useState<"excel" | "pdf" | null>(null);
  const ekspor = async (jenis: "excel" | "pdf") => {
    if (!pakaiKuota("eksporLaporan")) {
      toast("Kuota ekspor laporan habis. Upgrade ke paket Pro untuk ekspor tanpa batas.", "peringatan");
      return;
    }
    setMengekspor(jenis);
    try {
      if (jenis === "excel") await eksporExcel(lap, profile.namaUsaha);
      else await eksporPdf(lap, profile.namaUsaha);
      toast(`Laporan ${lap.tahun} berhasil diekspor ke ${jenis === "excel" ? "Excel" : "PDF"}`);
    } catch (e) {
      console.error(e);
      toast("Ekspor gagal. Coba lagi.", "peringatan");
    } finally {
      setMengekspor(null);
    }
  };
  const sisaEkspor = quotaRemaining("eksporLaporan");

  // ---------- Grafik ----------
  const komposisiBeban = LABA_RUGI.bebanUsaha
    .map((p) => { const n = p.label.replace("Beban ", ""); return { name: n[0].toUpperCase() + n.slice(1), value: lap.lr[p.key] || 0 }; })
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const perbandingan = [
    { pos: "Pendapatan", ini: R.totalPendapatan, lalu: RL.totalPendapatan },
    { pos: "Laba kotor", ini: R.labaKotor, lalu: RL.labaKotor },
    { pos: "Laba usaha", ini: R.labaUsaha, lalu: RL.labaUsaha },
    { pos: "Laba bersih", ini: R.labaBersih, lalu: RL.labaBersih },
  ];

  const { entries } = useJournal();
  const { accounts } = useChartOfAccounts();
  const kontribusiCabang = useMemo(() => {
    if (entitas !== KONSOLIDASI) return [];
    return BRANCHES.map((b) => ({
      name: b,
      value: hitungLaporan(b, tahun, [], accounts).ringkasan.totalPendapatan,
    }));
  }, [entitas, tahun, accounts]);

  // ---------- Insight ----------
  const rasio = {
    marginKotor: R.labaKotor / (R.totalPendapatan || 1),
    marginBersih: R.labaBersih / (R.totalPendapatan || 1),
    lancar: R.totalAsetLancar / (R.totalLiabilitasPendek || 1),
    der: R.totalLiabilitas / (R.totalEkuitas || 1),
    roa: R.labaBersih / (R.totalAset || 1),
    perputaranPersediaan: (lap.lr.hpp || 0) / (lap.neraca.persediaan || 1),
  };
  const faktor = 12 / lap.bulanBerjalan;
  const tumbuhPendapatan = tumbuh(R.totalPendapatan * faktor, RL.totalPendapatan);
  const bebanTerbesar = komposisiBeban[0];

  const insight: { judul: string; nilai: string; status: "baik" | "perhatian" | "waspada"; teks: string }[] = [
    {
      judul: "Margin laba bersih",
      nilai: persen(rasio.marginBersih),
      status: rasio.marginBersih >= 0.15 ? "baik" : rasio.marginBersih >= 0.08 ? "perhatian" : "waspada",
      teks:
        rasio.marginBersih >= 0.15
          ? "Profitabilitas sehat. Pertahankan disiplin biaya."
          : "Margin tipis. Tinjau harga jual dan beban terbesar.",
    },
    {
      judul: "Rasio lancar",
      nilai: `${rasio.lancar.toFixed(2).replace(".", ",")}x`,
      status: rasio.lancar >= 1.5 ? "baik" : rasio.lancar >= 1 ? "perhatian" : "waspada",
      teks:
        rasio.lancar >= 1.5
          ? "Aset lancar cukup untuk menutup utang jangka pendek."
          : "Likuiditas ketat. Percepat penagihan piutang.",
    },
    {
      judul: "Utang terhadap ekuitas",
      nilai: `${rasio.der.toFixed(2).replace(".", ",")}x`,
      status: rasio.der <= 1 ? "baik" : rasio.der <= 2 ? "perhatian" : "waspada",
      teks: rasio.der <= 1 ? "Struktur modal konservatif, ruang pendanaan masih ada." : "Ketergantungan pada utang cukup tinggi.",
    },
    {
      judul: "Pertumbuhan pendapatan",
      nilai: tumbuhPendapatan === null ? "—" : persen(tumbuhPendapatan),
      status: tumbuhPendapatan === null || tumbuhPendapatan >= 0.05 ? "baik" : tumbuhPendapatan >= 0 ? "perhatian" : "waspada",
      teks: lap.berjalan ? "Dibandingkan secara disetahunkan dengan tahun lalu." : "Dibandingkan dengan tahun sebelumnya.",
    },
    {
      judul: "Perputaran persediaan",
      nilai: `${rasio.perputaranPersediaan.toFixed(1).replace(".", ",")}x / thn`,
      status: rasio.perputaranPersediaan >= 6 ? "baik" : rasio.perputaranPersediaan >= 3 ? "perhatian" : "waspada",
      teks: `Stok rata-rata habis dalam ${Math.round(365 / (rasio.perputaranPersediaan || 1))} hari.`,
    },
    {
      judul: "Beban usaha terbesar",
      nilai: bebanTerbesar ? bebanTerbesar.name : "—",
      status: "perhatian",
      teks: bebanTerbesar
        ? `${persen(bebanTerbesar.value / (R.totalPendapatan || 1))} dari pendapatan. Prioritaskan efisiensi di pos ini.`
        : "",
    },
  ];

  const warnaStatus = {
    baik: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    perhatian: "bg-amber-50 text-amber-700 ring-amber-200",
    waspada: "bg-red-50 text-red-700 ring-red-200",
  };
  const labelStatus = { baik: "Baik", perhatian: "Perlu perhatian", waspada: "Waspada" };

  const kpi = [
    { label: "Total Pendapatan", nilai: R.totalPendapatan, lalu: RL.totalPendapatan, icon: TrendingUp },
    { label: "Laba Bersih", nilai: R.labaBersih, lalu: RL.labaBersih, icon: PiggyBank },
    { label: "Kenaikan Kas Bersih", nilai: lap.arusKas.kenaikanKas, lalu: lap.arusKasLalu.kenaikanKas, icon: Activity },
    { label: "Total Aset", nilai: R.totalAset, lalu: RL.totalAset, icon: Wallet },
  ];

  return (
    <div className="space-y-6">
      {/* Kepala halaman */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">Laporan Keuangan</h2>
          <p className="text-sm text-gray-500">
            Format SAK EMKM · {lap.entitas} · {labelPeriode(lap)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {role === "induk" && (
            <label className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm shadow-sm">
              <Building2 className="w-4 h-4 text-gray-500" />
              <select value={entitas} onChange={(e) => setEntitas(e.target.value)} className="bg-transparent outline-none">
                {ENTITAS.map((x) => (
                  <option key={x} value={x}>
                    {x === KONSOLIDASI ? "Konsolidasi (semua cabang)" : x}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm shadow-sm" title="Pilih periode tahun">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-gray-500">Periode</span>
            <select value={tahun} onChange={(e) => setTahun(Number(e.target.value))} className="bg-transparent font-semibold text-primary outline-none">
              {[...TAHUN_TERSEDIA].reverse().map((t) => (
                <option key={t} value={t}>
                  {t}
                  {t === TAHUN_BERJALAN ? " (berjalan)" : ""}
                </option>
              ))}
            </select>
          </label>
          <Link
            to="/jurnal"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
          >
            <FileEdit className="w-4 h-4" /> Entri Jurnal
          </Link>
        </div>
      </div>

      {/* KPI */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpi.map(({ label, nilai, lalu, icon: Icon }, i) => {
          const g = tumbuh(nilai, lalu);
          return (
            <div key={label} className={`card-gradient ${["grad-navy", "grad-ocean", "grad-indigo", "grad-steel"][i]} p-5`}>
              <div className="relative flex items-center justify-between">
                <p className="text-sm text-white/75">{label}</p>
                <div className="w-9 h-9 rounded-xl bg-white/15 ring-1 ring-white/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="relative mt-2 text-2xl font-extrabold" title={formatRp(nilai)}>
                {formatRpSingkat(nilai)}
              </p>
              <p className="relative text-xs text-white/70 mt-1">
                Tahun lalu {formatRpSingkat(lalu)}
                {g !== null && !lap.berjalan && (
                  <span className={g >= 0 ? "text-emerald-200" : "text-rose-200"}> · {g >= 0 ? "+" : ""}{persen(g)}</span>
                )}
              </p>
            </div>
          );
        })}
      </section>

      {/* Grafik pos-pos utama (pengganti Asset Mix) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-elegant p-5">
          <h3 className="font-semibold text-gray-900">Pendapatan, Beban, dan Laba Bulanan</h3>
          <p className="text-xs text-gray-500 mb-3">Batang = pendapatan & beban, garis = laba.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={lap.bulanan}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f6" />
                <XAxis dataKey="bulan" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis width={56} tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v) => formatRpSingkat(Number(v)).replace("Rp ", "")} />
                <Tooltip formatter={(v: number, n: string) => [formatRp(v), n]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="pendapatan" name="Pendapatan" fill="#2f6b8f" radius={[4, 4, 0, 0]} />
                <Bar dataKey="beban" name="Beban" fill="#9cb2c1" radius={[4, 4, 0, 0]} />
                <Line dataKey="laba" name="Laba" stroke="#0f766e" strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-elegant p-5">
          <h3 className="font-semibold text-gray-900">Komposisi Beban Usaha</h3>
          <p className="text-xs text-gray-500 mb-3">Total {formatRp(R.totalBebanUsaha)}</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={komposisiBeban} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef2f6" />
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v) => formatRpSingkat(Number(v)).replace("Rp ", "")} />
                <YAxis type="category" dataKey="name" width={150} tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip formatter={(v: number) => formatRp(v)} />
                <Bar dataKey="value" name="Beban" radius={[0, 4, 4, 0]}>
                  {komposisiBeban.map((_, i) => (
                    <Cell key={i} fill={WARNA[i % WARNA.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-elegant p-5">
          <h3 className="font-semibold text-gray-900">Arus Kas Masuk vs Keluar</h3>
          <p className="text-xs text-gray-500 mb-3">
            Kas operasi bersih {formatRp(lap.arusKas.totalOperasi)}
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lap.bulanan}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f6" />
                <XAxis dataKey="bulan" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis width={56} tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v) => formatRpSingkat(Number(v)).replace("Rp ", "")} />
                <Tooltip formatter={(v: number, n: string) => [formatRp(v), n]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="kasMasuk" name="Kas masuk" fill="#0f766e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="kasKeluar" name="Kas keluar" fill="#e11d48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-elegant p-5">
          {entitas === KONSOLIDASI ? (
            <>
              <h3 className="font-semibold text-gray-900">Kontribusi Pendapatan per Cabang</h3>
              <p className="text-xs text-gray-500 mb-3">Porsi tiap cabang terhadap pendapatan konsolidasi.</p>
              <div className="h-64 flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={kontribusiCabang} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                      {kontribusiCabang.map((_, i) => (
                        <Cell key={i} fill={WARNA[i % WARNA.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatRp(v)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <>
              <h3 className="font-semibold text-gray-900">Perbandingan dengan Tahun Lalu</h3>
              <p className="text-xs text-gray-500 mb-3">
                {tahun} vs {tahun - 1}
                {lap.berjalan ? " (tahun berjalan belum penuh)" : ""}
              </p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={perbandingan}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f6" />
                    <XAxis dataKey="pos" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis width={56} tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v) => formatRpSingkat(Number(v)).replace("Rp ", "")} />
                    <Tooltip formatter={(v: number, n: string) => [formatRp(v), n]} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="ini" name={String(tahun)} fill="#012a3d" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="lalu" name={String(tahun - 1)} fill="#9cb2c1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Scan struk + ekspor */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ScanStruk className="lg:col-span-2" />
        <div className="card-elegant p-5 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900">Ekspor Laporan</h3>
              <p className="text-xs text-gray-500">Semua laporan + CaLK periode {tahun}.</p>
            </div>
            <QuotaBadge kuota="eksporLaporan" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={() => ekspor("excel")}
              disabled={mengekspor !== null || sisaEkspor === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-600 px-3 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {mengekspor === "excel" ? "Menyiapkan..." : "Excel"}
            </button>
            <button
              onClick={() => ekspor("pdf")}
              disabled={mengekspor !== null || sisaEkspor === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-red-600 px-3 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              {mengekspor === "pdf" ? "Menyiapkan..." : "PDF"}
            </button>
          </div>
          {sisaEkspor === 0 && (
            <Link to="/profil?tab=paket" className="mt-3 text-xs font-medium text-primary underline">
              Kuota habis. Upgrade paket untuk ekspor tanpa batas.
            </Link>
          )}
        </div>
      </section>

      {/* Tabel laporan keuangan */}
      <section id="tab-laporan" className="card-elegant overflow-hidden">
        <div className="flex gap-1 overflow-x-auto overflow-y-hidden border-b px-3 pt-3">
          {[...tabel.map((t) => t.judul), "Catatan atas Laporan Keuangan"].map((j, i) => (
            <button
              key={j}
              onClick={() => setTab(i)}
              className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${
                tab === i ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {j.replace("Laporan ", "")}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-6">
          <div className="text-center mb-5">
            <p className="font-bold text-gray-900">{profile.namaUsaha}</p>
            <p className="font-semibold text-primary">{tab < tabel.length ? tabel[tab].judul : "Catatan atas Laporan Keuangan"}</p>
            <p className="text-xs text-gray-500">
              {lap.entitas} · {tab === 0 ? `Per ${lap.berjalan ? "hari ini" : `31 Desember ${tahun}`}` : `Untuk periode ${labelPeriode(lap)}`} · (dalam Rupiah)
            </p>
          </div>

          {tab < tabel.length ? (
            <TabelLaporan baris={tabel[tab].baris} kolom={tabel[tab].kolom} satuKolom={tabel[tab].key === "ekuitas"} />
          ) : (
            <div className="space-y-5 text-sm text-gray-700 max-w-3xl mx-auto">
              {calk.map((c) => (
                <div key={c.judul}>
                  <p className="font-semibold text-gray-900 mb-1">{c.judul}</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {c.isi.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Visual & insight */}
      <section className="card-elegant p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Visual & Insight</h3>
              <p className="text-sm text-gray-500">Rasio keuangan utama dan apa artinya bagi usaha Anda.</p>
            </div>
          </div>
          {canSee("audit") &&
            (canUse("audit") ? (
              <button
                onClick={() => navigate("/data-driven")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95"
              >
                <Gauge className="w-4 h-4" /> Cek Performa <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <Link
                to="/profil?tab=paket"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-500"
                title={lockedMessage("bisnis")}
              >
                <Lock className="w-4 h-4" /> Cek Performa · {lockedMessage("bisnis")}
              </Link>
            ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {insight.map((x) => (
            <div key={x.judul} className="rounded-xl border p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-gray-500">{x.judul}</p>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${warnaStatus[x.status]}`}>
                  {labelStatus[x.status]}
                </span>
              </div>
              <p className="mt-1 text-xl font-bold text-primary">{x.nilai}</p>
              <p className="mt-1 text-xs text-gray-600">{x.teks}</p>
            </div>
          ))}
        </div>
      </section>

      {/* entri jurnal pengguna hanya memengaruhi laporan entitas sendiri */}
      {entitas !== sendiri && entries.length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          Jurnal yang Anda input hanya tercatat di laporan {sendiri}.
        </p>
      )}
    </div>
  );
}

function TabelLaporan({ baris, kolom, satuKolom }: { baris: Baris[]; kolom: [string, string]; satuKolom: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="bg-primary text-white">
            <th className="text-left font-semibold px-3 py-2 rounded-l-lg">Keterangan</th>
            <th className={`text-right font-semibold px-3 py-2 w-44 ${satuKolom ? "rounded-r-lg" : ""}`}>{kolom[0]}</th>
            {!satuKolom && <th className="text-right font-semibold px-3 py-2 w-44 rounded-r-lg">{kolom[1]}</th>}
          </tr>
        </thead>
        <tbody>
          {baris.map((b, i) => {
            const cls =
              b.tipe === "judul"
                ? "font-bold text-primary pt-5"
                : b.tipe === "subjudul"
                  ? "font-semibold text-gray-800 pt-3"
                  : b.tipe === "total"
                    ? "font-bold text-gray-900 bg-[#e1ecf3]"
                    : b.tipe === "subtotal"
                      ? "font-semibold text-gray-900 border-t"
                      : "text-gray-700";
            const pad = b.tipe === "baris" ? "pl-8" : "pl-3";
            return (
              <tr key={i} className={b.tipe === "baris" ? "hover:bg-gray-50" : ""}>
                <td className={`${pad} pr-3 py-1.5 ${cls}`}>{b.label}</td>
                <td className={`px-3 py-1.5 text-right tabular-nums ${cls}`}>{angka(b.nilai)}</td>
                {!satuKolom && <td className={`px-3 py-1.5 text-right tabular-nums ${cls} ${b.tipe === "baris" ? "text-gray-500" : ""}`}>{angka(b.lalu)}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
