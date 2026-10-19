import { useMemo } from "react";
import { Trophy, Medal, Wallet, Brain, CheckCircle2, Users, Clock, Phone } from "lucide-react";
import { useBusinessSector } from "../../context/BusinessSectorContext";
import { useJournal } from "../../context/JournalContext";
import { useChartOfAccounts } from "../../context/ChartOfAccountsContext";
import { useToast } from "../../context/ToastContext";
import BrandIcon from "../../components/BrandIcon";
import { hitungGaji, karyawanSektor, skorKaryawan, POTONGAN_BPJS, type Karyawan } from "../../data/internal";
import { formatRp, formatRpSingkat, NAMA_BULAN } from "../../data/laporan";

function Gauge({ value }: { value: number }) {
  const size = 110;
  const stroke = 11;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, value)) / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#e5e7eb" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="#2f6b8f"
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="fill-gray-800" style={{ fontSize: 18, fontWeight: 700 }}>
        {value}
      </text>
    </svg>
  );
}

// Status kehadiran hari ini dari jam masuk/pulang (jam kerja mulai 08:00, toleransi 5 menit)
function statusHadir(k: Karyawan): { label: string; cls: string } {
  if (!k.masuk) return { label: "Belum hadir", cls: "bg-gray-100 text-gray-600" };
  if (k.masuk > "08:05") return { label: "Terlambat", cls: "bg-amber-100 text-amber-800" };
  if (!k.pulang) return { label: "Sedang bekerja", cls: "bg-blue-50 text-blue-700" };
  return { label: "Tepat waktu", cls: "bg-emerald-50 text-emerald-700" };
}

const inisial = (n: string) =>
  n
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2);

export default function TabPenggajian() {
  const { sector } = useBusinessSector();
  const { entries, setEntries } = useJournal();
  const { accounts } = useChartOfAccounts();
  const { toast } = useToast();

  const karyawan = useMemo(() => karyawanSektor(sector), [sector]);

  const bulan = new Date().getMonth();
  const tahun = new Date().getFullYear();
  const kodePeriode = `${tahun}-${String(bulan + 1).padStart(2, "0")}`;
  const sudahDibayar = entries.some((e) => e.description === `Penggajian ${NAMA_BULAN[bulan]} ${tahun}`);

  const rincian = karyawan.map((k) => ({ ...k, ...hitungGaji(k), skor: skorKaryawan(k) }));
  const total = rincian.reduce(
    (s, k) => ({ bruto: s.bruto + k.bruto, potongan: s.potongan + k.potongan, neto: s.neto + k.neto }),
    { bruto: 0, potongan: 0, neto: 0 },
  );
  const peringkat = [...rincian].sort((a, b) => b.skor - a.skor);
  const juara = peringkat[0];
  const hadir = karyawan.filter((k) => k.masuk).length;

  const prosesGaji = () => {
    const id = (code: string) => accounts.find((a) => a.code === code)?.id;
    const beban = id("6.1.1.01");
    const kas = id("1.1.1.02") ?? id("1.1.1.01");
    const utang = id("2.1.5.01");
    if (!beban || !kas || !utang) return toast("Akun beban gaji / kas / utang gaji tidak ditemukan di Bagan Akun", "peringatan");
    const now = Date.now();
    setEntries([
      {
        id: `gaji-${now}`,
        date: `${kodePeriode}-${String(Math.min(25, new Date().getDate())).padStart(2, "0")}`,
        description: `Penggajian ${NAMA_BULAN[bulan]} ${tahun}`,
        lines: [
          { id: `${now}-1`, side: "debit", accountId: beban, amount: total.bruto },
          { id: `${now}-2`, side: "credit", accountId: kas, amount: total.neto },
          // potongan BPJS ditahan dulu sebagai utang sampai disetor
          { id: `${now}-3`, side: "credit", accountId: utang, amount: total.potongan },
        ],
      },
      ...entries,
    ]);
    toast(`Gaji ${rincian.length} karyawan dibayar, jurnal penggajian dibuat`);
  };

  const medali = ["text-amber-300", "text-gray-200", "text-orange-300"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Ringkasan */}
      <section className="lg:col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(
          [
            ["Karyawan hadir hari ini", `${hadir} / ${karyawan.length}`, Users, "grad-navy"],
            ["Total gaji bruto", formatRpSingkat(total.bruto), Wallet, "grad-ocean"],
            ["Potongan BPJS (4%)", formatRpSingkat(total.potongan), Wallet, "grad-indigo"],
            ["Gaji bersih dibayar", formatRpSingkat(total.neto), Wallet, "grad-steel"],
          ] as const
        ).map(([k, v, Icon, grad]) => (
          <div key={k} className={`card-gradient ${grad} p-4`}>
            <div className="relative flex items-center justify-between">
              <p className="text-xs text-white/75">{k}</p>
              <Icon className="w-4 h-4 text-white/80" />
            </div>
            <p className="relative mt-1 text-xl font-bold">{v}</p>
          </div>
        ))}
      </section>

      {/* Kiri atas: leaderboard */}
      <section className="lg:col-span-5 card-gradient grad-navy p-6">
        <div className="relative flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-300" />
          <h2 className="text-lg font-semibold">Leaderboard Karyawan</h2>
        </div>
        <p className="relative text-xs text-white/70 mt-1">
          Skor = kinerja 50% + kehadiran 30% + capaian target 20%. Periode {NAMA_BULAN[bulan]} {tahun}.
        </p>
        <ol className="relative mt-4 space-y-2">
          {peringkat.map((k, i) => (
            <li key={k.id} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${i < 3 ? "bg-white/15" : "bg-white/5"}`}>
              <span className="w-6 text-center font-bold">{i < 3 ? <Medal className={`w-5 h-5 inline ${medali[i]}`} /> : i + 1}</span>
              <span className="w-8 h-8 rounded-full bg-white/20 text-xs font-bold flex items-center justify-center">{inisial(k.nama)}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold truncate">{k.nama}</span>
                <span className="block text-[11px] text-white/60">{k.jabatan}</span>
              </span>
              <span className="text-right">
                <span className="block text-lg font-extrabold">{k.skor}</span>
                <span className="block text-[10px] text-white/60">poin</span>
              </span>
            </li>
          ))}
        </ol>
        {juara && (
          <p className="relative mt-4 text-xs text-white/80">
            Saran: berikan insentif untuk <b>{juara.nama}</b> dan jadikan pendamping bagi karyawan dengan skor terendah.
          </p>
        )}
      </section>

      {/* Kanan atas: daftar karyawan */}
      <section className="lg:col-span-7 card-elegant p-6 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Daftar Karyawan Hari Ini</h2>
          </div>
          <span className="text-xs text-gray-500">{new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 pr-3 font-medium">Nama</th>
                <th className="py-2 pr-3 font-medium">Telepon</th>
                <th className="py-2 pr-3 font-medium">Masuk</th>
                <th className="py-2 pr-3 font-medium">Pulang</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 font-medium text-right">Skor</th>
              </tr>
            </thead>
            <tbody>
              {[...rincian]
                .sort((a, b) => b.skor - a.skor)
                .map((k) => {
                  const st = statusHadir(k);
                  const wa = "62" + k.telepon.replace(/\D/g, "").slice(1);
                  return (
                    <tr key={k.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-2.5 pr-3">
                        <p className="font-medium text-gray-800 whitespace-nowrap">{k.nama}</p>
                        <p className="text-[11px] text-gray-500">{k.jabatan}</p>
                      </td>
                      <td className="py-2.5 pr-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-gray-700">
                          <Phone className="w-3.5 h-3.5 text-gray-400" /> {k.telepon}
                          <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${k.nama}`} title="Chat WhatsApp">
                            <BrandIcon brand="whatsapp" size={14} />
                          </a>
                        </span>
                      </td>
                      <td className={`py-2.5 pr-3 tabular-nums ${k.masuk > "08:05" ? "text-amber-700 font-medium" : ""}`}>{k.masuk || "—"}</td>
                      <td className="py-2.5 pr-3 tabular-nums">{k.pulang || "—"}</td>
                      <td className="py-2.5 pr-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`inline-flex min-w-[2.5rem] justify-center rounded-lg px-2 py-0.5 text-sm font-bold ${
                            k.skor >= 90 ? "bg-emerald-50 text-emerald-700" : k.skor >= 80 ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {k.skor}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tabel gaji */}
      <section className="lg:col-span-8 card-elegant p-6 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold">
              Daftar Gaji {NAMA_BULAN[bulan]} {tahun}
            </h2>
            <p className="text-xs text-gray-500">Potongan iuran BPJS pekerja {POTONGAN_BPJS * 100}% dari gaji pokok + tunjangan.</p>
          </div>
          {sudahDibayar ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="w-4 h-4" /> Sudah dibayar
            </span>
          ) : (
            <button
              onClick={() => {
                if (confirm(`Bayar gaji ${formatRp(total.neto)} untuk ${rincian.length} karyawan?`)) prosesGaji();
              }}
              className="rounded-full btn-gradient px-4 py-2 text-sm font-semibold"
            >
              Proses Penggajian
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 pr-3 font-medium">Nama</th>
                <th className="py-2 pr-3 font-medium text-right">Gaji pokok</th>
                <th className="py-2 pr-3 font-medium text-right">Tunjangan</th>
                <th className="py-2 pr-3 font-medium text-right">Lembur</th>
                <th className="py-2 pr-3 font-medium text-right">Potongan</th>
                <th className="py-2 font-medium text-right">Diterima</th>
              </tr>
            </thead>
            <tbody>
              {rincian.map((k) => (
                <tr key={k.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-2 pr-3">
                    <p className="font-medium text-gray-800">{k.nama}</p>
                    <p className="text-[11px] text-gray-500">{k.jabatan}</p>
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">{formatRp(k.gajiPokok)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{formatRp(k.tunjangan)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{formatRp(k.lembur)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums text-red-600">{formatRp(-k.potongan)}</td>
                  <td className="py-2 text-right tabular-nums font-semibold text-primary">{formatRp(k.neto)}</td>
                </tr>
              ))}
              <tr className="bg-[#e1ecf3] font-bold">
                <td className="py-2 pr-3 pl-1">Total</td>
                <td colSpan={3} className="py-2 pr-3 text-right tabular-nums">
                  {formatRp(total.bruto)}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums text-red-600">{formatRp(-total.potongan)}</td>
                <td className="py-2 pr-1 text-right tabular-nums">{formatRp(total.neto)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Kecocokan peran */}
      <section className="lg:col-span-4 card-elegant p-6">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Kecocokan Peran</h2>
        </div>
        {juara && (
          <div className="flex flex-col items-center text-center gap-2">
            <Gauge value={juara.kinerja} />
            <p className="font-bold text-gray-900 text-lg">{juara.nama}</p>
            <p className="text-sm font-medium text-primary">{juara.jabatan}</p>
            <p className="text-sm text-gray-600">
              Kecocokan tinggi: kinerja {juara.kinerja}, kehadiran {juara.kehadiran}%, capaian target {juara.target}%. Direkomendasikan memimpin shift utama.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
