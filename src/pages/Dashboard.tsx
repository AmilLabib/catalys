import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Factory,
  AlertTriangle,
  Trophy,
  TrendingUp,
  Wallet,
  PiggyBank,
  Activity,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Tag,
  BarChart2,
  MessagesSquare,
  Lock,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { usePageTitle } from "../hooks/usePageTitle";
import AngkaBerjalan from "../components/AngkaBerjalan";
import { useLaporan, useEntitasSendiri } from "../hooks/useLaporan";
import { useAccount } from "../context/AccountContext";
import { useInventory } from "../context/InventoryContext";
import { formatRp, formatRpSingkat, TAHUN_BERJALAN } from "../data/laporan";
import { FEATURES, lockedMessage, type FeatureKey } from "../config/access";

const revenueMix = [
  { name: "Daring", value: 48 },
  { name: "Luring", value: 32 },
  { name: "Reseller", value: 20 },
];

const mixColors = ["#012a3d", "#2f6b8f", "#9cb2c1"];

function pertumbuhan(now: number, before: number) {
  if (!before) return 0;
  return ((now - before) / Math.abs(before)) * 100;
}

function Tren({ nilai }: { nilai: number }) {
  const naik = nilai >= 0;
  const Icon = naik ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        naik ? "bg-emerald-400/20 text-emerald-100" : "bg-rose-400/25 text-rose-100"
      }`}
    >
      <Icon className="w-3 h-3" />
      {Math.abs(nilai).toFixed(1).replace(".", ",")}%
    </span>
  );
}

export default function Dashboard() {
  usePageTitle("Beranda");
  const lap = useLaporan(TAHUN_BERJALAN);
  const entitas = useEntitasSendiri();
  const { canSee, canUse, quotaRemaining, sesi } = useAccount();
  const { products } = useInventory();

  const R = lap.ringkasan;
  const L = lap.ringkasanLalu;
  // Tahun berjalan dibandingkan secara proporsional (disetahunkan) dengan tahun lalu
  const faktor = 12 / lap.bulanBerjalan;

  const kpi = [
    {
      label: `Pendapatan ${lap.tahun}`,
      nilai: R.totalPendapatan,
      tren: pertumbuhan(R.totalPendapatan * faktor, L.totalPendapatan),
      catatan: "vs tahun lalu (disetahunkan)",
      icon: TrendingUp,
      grad: "grad-navy",
    },
    {
      label: "Laba Bersih",
      nilai: R.labaBersih,
      tren: pertumbuhan(R.labaBersih * faktor, L.labaBersih),
      catatan: `Margin ${((R.labaBersih / (R.totalPendapatan || 1)) * 100).toFixed(1).replace(".", ",")}%`,
      icon: PiggyBank,
      grad: "grad-ocean",
    },
    {
      label: "Total Aset",
      nilai: R.totalAset,
      tren: pertumbuhan(R.totalAset, L.totalAset),
      catatan: "posisi per hari ini",
      icon: Wallet,
      grad: "grad-indigo",
    },
    {
      label: "Kas Akhir",
      nilai: lap.arusKas.kasAkhir,
      tren: pertumbuhan(lap.arusKas.kasAkhir, lap.arusKas.kasAwal),
      catatan: "vs kas awal tahun",
      icon: Activity,
      grad: "grad-steel",
    },
  ];

  const stokMenipis = products.filter((p) => p.qty < 20).length;
  const sesiTerjadwal = sesi.filter((s) => s.status === "Terjadwal").length;

  const modul: {
    key: FeatureKey;
    icon: typeof Factory;
    stats: [string, string][];
    cta: string;
  }[] = [
    {
      key: "kasir",
      icon: ShoppingCart,
      stats: [
        ["Produk aktif", String(products.length)],
        ["Stok menipis", String(stokMenipis)],
      ],
      cta: "Buka kasir",
    },
    {
      key: "hargaCerdas",
      icon: Tag,
      stats: [
        ["Pembanding pasar", "5 kompetitor"],
        ["Margin rata-rata", "28%"],
      ],
      cta: "Hitung harga",
    },
    {
      key: "laporanKeuangan",
      icon: BarChart2,
      stats: [
        ["Laba usaha", formatRpSingkat(R.labaUsaha)],
        ["Rasio lancar", `${(R.totalAsetLancar / (R.totalLiabilitasPendek || 1)).toFixed(2).replace(".", ",")}x`],
      ],
      cta: "Lihat laporan",
    },
    {
      key: "manajemenInternal",
      icon: Factory,
      stats: [
        ["Karyawan aktif", "12"],
        ["Stok menipis", String(stokMenipis)],
      ],
      cta: "Kelola operasional",
    },
    {
      key: "audit",
      icon: AlertTriangle,
      stats: [
        ["Temuan risiko", "5"],
        ["Rekomendasi", "8"],
      ],
      cta: "Lihat audit",
    },
    {
      key: "konsultasi",
      icon: MessagesSquare,
      stats: [
        ["Sisa sesi", String(quotaRemaining("konsultasi") ?? 0)],
        ["Sesi terjadwal", String(sesiTerjadwal)],
      ],
      cta: "Jadwalkan sesi",
    },
    {
      key: "umkmBerkembang",
      icon: Trophy,
      stats: [
        ["Skor pertumbuhan", "78 / 100"],
        ["Program aktif", "4"],
      ],
      cta: "Lihat program",
    },
    {
      key: "permodalan",
      icon: ShieldCheck,
      stats: [
        ["Akses pendanaan", "6 mitra"],
        ["Pinjaman berjalan", "2"],
      ],
      cta: "Lihat opsi",
    },
  ];

  const modulTerlihat = modul.filter((m) => canSee(m.key));

  return (
    <div className="min-h-screen">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            {entitas}
          </p>
          <h2 className="text-2xl font-bold text-primary">Ringkasan Kinerja {lap.tahun}</h2>
        </div>
        <span className="text-xs text-gray-500">
          Data s.d. bulan ke-{lap.bulanBerjalan} tahun berjalan
        </span>
      </div>

      {/* Baris KPI */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {kpi.map(({ label, nilai, tren, catatan, icon: Icon, grad }) => (
          <div key={label} className={`card-gradient ${grad} p-5`}>
            <div className="relative flex items-center justify-between">
              <p className="text-sm text-white/75">{label}</p>
              <div className="w-10 h-10 rounded-xl bg-white/15 ring-1 ring-white/20 flex items-center justify-center backdrop-blur-sm">
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="relative mt-3 text-xl font-extrabold tracking-tight">
              <AngkaBerjalan nilai={nilai} format={formatRp} />
            </p>
            <div className="relative mt-2 flex items-center gap-2 text-xs text-white/70">
              <Tren nilai={tren} /> {catatan}
            </div>
          </div>
        ))}
      </section>

      {/* Baris grafik */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <div className="lg:col-span-8 card-elegant p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Tren Pendapatan vs Beban</h2>
              <p className="text-sm text-gray-500">
                Pantau tren bulanan untuk mendeteksi anomali lebih cepat.
              </p>
            </div>
            <span className="rounded-full bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              {lap.tahun}
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={lap.bulanan} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradPendapatan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2f6b8f" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2f6b8f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5edf3" />
                <XAxis dataKey="bulan" tickLine={false} axisLine={false} />
                <YAxis
                  width={72}
                  tickFormatter={(v) => formatRpSingkat(Number(v)).replace("Rp ", "")}
                  tickLine={false}
                  axisLine={false}
                />
                <ReTooltip formatter={(value, name) => [formatRp(Number(value)), name === "pendapatan" ? "Pendapatan" : "Beban"]} />
                <Area type="monotone" dataKey="pendapatan" stroke="#2f6b8f" strokeWidth={2} fill="url(#gradPendapatan)" />
                <Line type="monotone" dataKey="beban" stroke="#e11d48" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 card-elegant p-5">
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Komposisi Pendapatan</h2>
            <p className="text-sm text-gray-500">Kanal penjualan (estimasi).</p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={revenueMix} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {revenueMix.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={mixColors[i % mixColors.length]} />
                  ))}
                </Pie>
                <ReTooltip formatter={(v) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-2">
            {revenueMix.map((m, i) => (
              <div key={m.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: mixColors[i % mixColors.length] }} />
                  <span className="text-gray-700">{m.name}</span>
                </div>
                <span className="font-semibold text-gray-900">{m.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ringkasan modul sesuai peran & paket */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {modulTerlihat.map(({ key, icon: Icon, stats, cta }) => {
          const def = FEATURES[key];
          const terkunci = !canUse(key);
          return (
            <div key={key} className={`card-elegant hover-lift p-5 flex flex-col ${terkunci ? "opacity-70" : ""}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${terkunci ? "bg-gray-200 text-gray-500" : "chip-gradient"}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">{def.label}</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                {stats.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2">
                    <span className="text-gray-500">{k}</span>
                    <span className="font-bold text-primary">{terkunci ? "—" : v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-auto pt-5">
                {terkunci ? (
                  <Link
                    to="/profil?tab=paket"
                    title={lockedMessage(def.minPlan)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-xs font-semibold text-gray-500 hover:bg-gray-200"
                  >
                    <Lock className="w-3.5 h-3.5" /> {lockedMessage(def.minPlan)}
                  </Link>
                ) : (
                  <Link
                    to={def.path}
                    className="btn-gradient inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
                  >
                    {cta} <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
