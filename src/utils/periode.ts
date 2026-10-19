import { HARI_INI, TAHUN_BERJALAN, TAHUN_TERSEDIA, TANGGAL_MIN } from "../data/laporan";

// Pilihan cepat periode laporan

const pad = (n: number) => String(n).padStart(2, "0");
const [Y, M] = [Number(HARI_INI.slice(0, 4)), Number(HARI_INI.slice(5, 7))];

function mundurHari(n: number) {
  const d = new Date(`${HARI_INI}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  const s = d.toISOString().slice(0, 10);
  return s < TANGGAL_MIN ? TANGGAL_MIN : s;
}

export const PRESET_PERIODE: { key: string; label: string; dari: string; sampai: string }[] = [
  { key: "ytd", label: `Tahun berjalan ${TAHUN_BERJALAN}`, dari: `${TAHUN_BERJALAN}-01-01`, sampai: HARI_INI },
  { key: "bulan", label: "Bulan ini", dari: `${Y}-${pad(M)}-01`, sampai: HARI_INI },
  { key: "kuartal", label: "Kuartal ini", dari: `${Y}-${pad(Math.floor((M - 1) / 3) * 3 + 1)}-01`, sampai: HARI_INI },
  { key: "30hari", label: "30 hari terakhir", dari: mundurHari(29), sampai: HARI_INI },
  ...[...TAHUN_TERSEDIA]
    .filter((t) => t !== TAHUN_BERJALAN)
    .reverse()
    .map((t) => ({ key: String(t), label: `Tahun ${t}`, dari: `${t}-01-01`, sampai: `${t}-12-31` })),
];
