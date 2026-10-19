// Data contoh Manajemen Internal (inventaris, penggajian, pemasaran) per sektor.
import { BRANCHES } from "../config/access";
import type { BusinessSector } from "../context/BusinessSectorContext";

export type Supplier = { name: string; materials: string[] };

type SektorMock = {
  wip: { name: string; qty: number; unit: string; unitCost: number }[];
  finishedGoods: { name: string; qty: number; unit: string; unitCost: number }[];
  hppBulanIni: number;
  suppliers: Supplier[];
  peran: [string, string, string, string];
  alurBahan: Record<string, string[]>;
  alurProduk: Record<string, string[]>;
};

export const SEKTOR: Record<BusinessSector, SektorMock> = {
  kuliner: {
    wip: [
      { name: "Rendang Marinasi", qty: 25, unit: "kg", unitCost: 160_000 },
      { name: "Kaldu Dasar", qty: 40, unit: "kg", unitCost: 40_000 },
    ],
    finishedGoods: [
      { name: "Rendang Daging", qty: 180, unit: "porsi", unitCost: 35_000 },
      { name: "Soto Ayam", qty: 220, unit: "porsi", unitCost: 18_000 },
    ],
    hppBulanIni: 48_500_000,
    suppliers: [
      { name: "Supplier Daging A", materials: ["Daging Sapi"] },
      { name: "Pasar Induk", materials: ["Bumbu Rempah", "Sayur Mix"] },
      { name: "Peternak Ayam Sejahtera", materials: ["Ayam"] },
    ],
    peran: ["Juru Masak", "Kasir", "Pramusaji", "Kurir"],
    alurBahan: { "Daging Sapi": ["Rendang Marinasi"], "Bumbu Rempah": ["Rendang Marinasi", "Kaldu Dasar"], Ayam: ["Kaldu Dasar"] },
    alurProduk: { "Rendang Marinasi": ["Rendang Daging"], "Kaldu Dasar": ["Soto Ayam"] },
  },
  agribisnis: {
    wip: [{ name: "Pupuk Organik Fermentasi", qty: 120, unit: "karung", unitCost: 75_000 }],
    finishedGoods: [{ name: "Sayur Segar", qty: 1200, unit: "kg", unitCost: 6_000 }],
    hppBulanIni: 12_500_000,
    suppliers: [
      { name: "Kebun Mitra", materials: ["Benih", "Kompos"] },
      { name: "Toko Tani Makmur", materials: ["Pupuk NPK", "Pestisida"] },
    ],
    peran: ["Petani", "Staf Gudang", "Admin Penjualan", "Sopir"],
    alurBahan: { Kompos: ["Pupuk Organik Fermentasi"], Benih: ["Pupuk Organik Fermentasi"] },
    alurProduk: { "Pupuk Organik Fermentasi": ["Sayur Segar"] },
  },
  fashion: {
    wip: [{ name: "Kain Batik Potong", qty: 60, unit: "meter", unitCost: 45_000 }],
    finishedGoods: [{ name: "Kemeja Batik", qty: 300, unit: "pcs", unitCost: 85_000 }],
    hppBulanIni: 22_000_000,
    suppliers: [
      { name: "Konveksi Jaya", materials: ["Kain", "Resleting"] },
      { name: "Toko Kemasan Rapi", materials: ["Kemasan"] },
    ],
    peran: ["Penjahit", "Staf Toko", "Admin Daring", "Desainer"],
    alurBahan: { Kain: ["Kain Batik Potong"], Resleting: ["Kain Batik Potong"] },
    alurProduk: { "Kain Batik Potong": ["Kemeja Batik"] },
  },
  industri: {
    wip: [{ name: "Campuran Pakan", qty: 400, unit: "kg", unitCost: 12_000 }],
    finishedGoods: [{ name: "Pakan Ternak Kemasan", qty: 1200, unit: "karung", unitCost: 45_000 }],
    hppBulanIni: 142_000_000,
    suppliers: [
      { name: "Pabrik Jagung Nusantara", materials: ["Jagung Giling"] },
      { name: "Distributor Vitamin Ternak", materials: ["Premix Vitamin"] },
    ],
    peran: ["Operator Produksi", "Staf QC", "Staf Gudang", "Sopir"],
    alurBahan: { "Jagung Giling": ["Campuran Pakan"], "Premix Vitamin": ["Campuran Pakan"] },
    alurProduk: { "Campuran Pakan": ["Pakan Ternak Kemasan"] },
  },
  perdagangan: {
    wip: [],
    finishedGoods: [{ name: "Paket Sembako", qty: 900, unit: "paket", unitCost: 25_000 }],
    hppBulanIni: 32_000_000,
    suppliers: [
      { name: "Distributor Sentral", materials: ["Barang Konsumsi"] },
      { name: "Agen Beras Cianjur", materials: ["Beras"] },
    ],
    peran: ["Kasir", "Pramuniaga", "Staf Gudang", "Kurir"],
    alurBahan: {},
    alurProduk: {},
  },
};

// ---------- Penggajian & KPI ----------

export type KpiKaryawan = {
  id: string;
  nama: string;
  target: number;
  capaian: number;
  satuan: string;
  bobot: number; // persen, total semua KPI idealnya 100
};

export type Karyawan = {
  id: string;
  nama: string;
  jabatan: string;
  unit: string; // "Kantor Pusat" atau nama cabang
  foto: string;
  gajiPokok: number;
  tunjangan: number;
  lembur: number;
  kinerja: number; // 0-100
  kehadiran: number; // 0-100 (% hari hadir tepat waktu)
  target: number; // 0-120 (% capaian KPI tertimbang), dihitung dari kpi
  telepon: string;
  masuk: string; // jam masuk hari ini, "" = belum hadir
  pulang: string;
  kpi: KpiKaryawan[];
};

export const KANTOR_PUSAT = "Kantor Pusat";
export const UNIT_KERJA = [KANTOR_PUSAT, ...BRANCHES];

// [nama, jenis kelamin, unit (indeks UNIT_KERJA), peran (indeks; -1..-3 = jabatan kantor pusat)]
const ORANG: [string, "L" | "P", number, number][] = [
  ["Hendra Gunawan", "L", 0, -1],
  ["Ratna Dewi", "P", 0, -2],
  ["Yusuf Hidayat", "L", 0, -3],
  ["Budi Santoso", "L", 1, 0],
  ["Siti Aminah", "P", 1, 1],
  ["Andi Wijaya", "L", 1, 2],
  ["Rina Lestari", "P", 2, 0],
  ["Dimas Prakoso", "L", 2, 3],
  ["Maya Sari", "P", 3, 0],
  ["Fajar Nugraha", "L", 3, 2],
  ["Lia Kurniawati", "P", 4, 1],
  ["Rahmat Hasan", "L", 4, 3],
  ["Nur Aisyah", "P", 5, 0],
  ["Agus Setiawan", "L", 5, 2],
];
const JABATAN_PUSAT = ["Manajer Operasional", "Staf Keuangan", "Staf SDM"];
const FOTO_L = [32, 45, 12, 75, 22, 36, 51, 68];
const FOTO_P = [44, 65, 21, 33, 57, 79, 12, 90];

// Angka semu yang stabil per indeks agar data contoh selalu sama
const semu = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// Kehadiran dihitung dari jam masuk/pulang, sisanya dari KPI
export function progresKpi(kpi: KpiKaryawan[]) {
  const totalBobot = kpi.reduce((s, x) => s + x.bobot, 0) || 1;
  const nilai = kpi.reduce((s, x) => s + Math.min(1.2, x.capaian / (x.target || 1)) * x.bobot, 0);
  return Math.round((nilai / totalBobot) * 100);
}

function kpiAwal(i: number, pusat: boolean, hadir: number): KpiKaryawan[] {
  const capai = (t: number, min: number, rentang: number) => Math.round(t * (min + semu(i, t) * rentang) * 10) / 10;
  const daftar: Omit<KpiKaryawan, "id">[] = pusat
    ? [
        { nama: "Laporan selesai tepat waktu", target: 12, capaian: capai(12, 0.75, 0.3), satuan: "laporan", bobot: 40 },
        { nama: "Kehadiran tepat waktu", target: 100, capaian: hadir, satuan: "%", bobot: 30 },
        { nama: "Inisiatif efisiensi biaya", target: 4, capaian: Math.round(capai(4, 0.5, 0.8)), satuan: "program", bobot: 30 },
      ]
    : [
        { nama: "Target penjualan bulanan", target: 60, capaian: capai(60, 0.75, 0.4), satuan: "juta Rp", bobot: 50 },
        { nama: "Kehadiran tepat waktu", target: 100, capaian: hadir, satuan: "%", bobot: 30 },
        { nama: "Rating pelayanan pelanggan", target: 5, capaian: Math.round((4 + semu(i, 9) * 0.9) * 10) / 10, satuan: "/5", bobot: 20 },
      ];
  return daftar.map((x, j) => ({ ...x, id: `kpi-${i + 1}-${j + 1}` }));
}

export function karyawanSektor(sector: BusinessSector): Karyawan[] {
  const peran = SEKTOR[sector].peran;
  const telepon = (i: number) => `08${12 + (i % 8)}-${String(1000 + Math.floor(semu(i, 1) * 8999))}-${String(1000 + Math.floor(semu(i, 2) * 8999))}`;
  const jam = (i: number): [string, string] => {
    if (i % 7 === 6) return ["", ""]; // belum hadir
    const m = Math.round(-12 + semu(i, 3) * 30); // menit relatif terhadap 08:00
    const masuk = `0${7 + (m >= 0 ? 1 : 0)}:${String((60 + m) % 60).padStart(2, "0")}`;
    return [masuk, i % 3 === 1 ? "" : `17:${String(Math.floor(semu(i, 4) * 25)).padStart(2, "0")}`];
  };
  let l = 0;
  let p = 0;
  return ORANG.map(([nama, jk, unit, peranIdx], i) => {
    const pusat = peranIdx < 0;
    const hadir = Math.round(82 + semu(i, 5) * 18);
    const kpi = kpiAwal(i, pusat, hadir);
    const gajiPokok = pusat ? [6_500_000, 4_800_000, 4_600_000][-peranIdx - 1] : [4_200_000, 3_600_000, 3_400_000, 3_300_000][peranIdx];
    const [masuk, pulang] = jam(i);
    return {
      id: `kry-${i + 1}`,
      nama,
      jabatan: pusat ? JABATAN_PUSAT[-peranIdx - 1] : peran[peranIdx],
      unit: UNIT_KERJA[unit],
      foto: `https://randomuser.me/api/portraits/${jk === "L" ? "men" : "women"}/${jk === "L" ? FOTO_L[l++ % FOTO_L.length] : FOTO_P[p++ % FOTO_P.length]}.jpg`,
      gajiPokok,
      tunjangan: Math.round(gajiPokok * 0.13 / 50_000) * 50_000,
      lembur: Math.round((semu(i, 6) * 500_000) / 50_000) * 50_000,
      kinerja: Math.round(70 + semu(i, 7) * 26),
      kehadiran: hadir,
      target: progresKpi(kpi),
      telepon: telepon(i),
      masuk,
      pulang,
      kpi,
    };
  });
}

// Potongan iuran BPJS bagian pekerja: Kesehatan 1%, JHT 2%, JP 1% dari gaji pokok + tunjangan tetap
export const POTONGAN_BPJS = 0.04;

export function hitungGaji(k: Karyawan) {
  const bruto = k.gajiPokok + k.tunjangan + k.lembur;
  const potongan = Math.round((k.gajiPokok + k.tunjangan) * POTONGAN_BPJS);
  return { bruto, potongan, neto: bruto - potongan };
}

// Skor leaderboard: kinerja 50%, kehadiran 30%, capaian target 20% (target dibatasi 100)
export function skorKaryawan(k: Karyawan) {
  return Math.round(k.kinerja * 0.5 + k.kehadiran * 0.3 + Math.min(100, k.target) * 0.2);
}

export type Absensi = {
  name: string;
  role: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: "Tepat waktu" | "Sedikit terlambat" | "Lebih awal";
};

export function absensiAwal(sector: BusinessSector): Absensi[] {
  const peran = SEKTOR[sector].peran;
  const hari = new Date().toISOString().slice(0, 10);
  return [
    { name: "Budi Santoso", role: peran[0], date: hari, checkIn: "08:03", checkOut: "17:15", status: "Tepat waktu" },
    { name: "Siti Aminah", role: peran[1], date: hari, checkIn: "08:10", checkOut: "17:20", status: "Sedikit terlambat" },
    { name: "Andi Wijaya", role: peran[2], date: hari, checkIn: "07:55", checkOut: "16:50", status: "Lebih awal" },
    { name: "Rina Lestari", role: peran[0], date: hari, checkIn: "08:05", checkOut: "17:05", status: "Tepat waktu" },
  ];
}

// ---------- Pemasaran: ulasan media sosial & e-commerce ----------

export type Platform = "Instagram" | "TikTok" | "Shopee" | "Tokopedia";
export type Sentimen = "positif" | "netral" | "negatif";
export type Topik = "Rasa / Kualitas" | "Harga" | "Pengiriman" | "Pelayanan" | "Kemasan";

export type Ulasan = {
  id: string;
  platform: Platform;
  pengguna: string;
  rating: number; // 1-5 (Instagram/TikTok: rating hasil konversi sentimen)
  teks: string;
  tanggal: string;
  sentimen: Sentimen;
  topik: Topik[];
};

const ULASAN_DASAR: Omit<Ulasan, "id" | "tanggal">[] = [
  { platform: "Shopee", pengguna: "dian***", rating: 5, teks: "Barang sesuai foto, kualitasnya bagus banget. Pasti order lagi!", sentimen: "positif", topik: ["Rasa / Kualitas"] },
  { platform: "Shopee", pengguna: "arif_k", rating: 2, teks: "Pengiriman lama sekali, hampir seminggu baru sampai.", sentimen: "negatif", topik: ["Pengiriman"] },
  { platform: "Shopee", pengguna: "nina.s", rating: 4, teks: "Harga bersahabat, kemasan rapi. Kurirnya agak telat.", sentimen: "positif", topik: ["Harga", "Kemasan", "Pengiriman"] },
  { platform: "Shopee", pengguna: "bagas99", rating: 3, teks: "Lumayan, tapi kemasannya sedikit penyok waktu datang.", sentimen: "netral", topik: ["Kemasan"] },
  { platform: "Tokopedia", pengguna: "Rudi H.", rating: 5, teks: "Respon penjual cepat dan ramah, produk original.", sentimen: "positif", topik: ["Pelayanan", "Rasa / Kualitas"] },
  { platform: "Tokopedia", pengguna: "Melati", rating: 4, teks: "Harga lebih murah dari toko lain, worth it.", sentimen: "positif", topik: ["Harga"] },
  { platform: "Tokopedia", pengguna: "Yoga P.", rating: 2, teks: "Barang datang tidak lengkap, harus komplain dulu.", sentimen: "negatif", topik: ["Pelayanan", "Pengiriman"] },
  { platform: "Instagram", pengguna: "@kulinerhunter.id", rating: 5, teks: "Wajib coba! Rasanya juara, porsinya juga pas.", sentimen: "positif", topik: ["Rasa / Kualitas"] },
  { platform: "Instagram", pengguna: "@sarahkitchen", rating: 4, teks: "Kemasannya cantik, cocok buat hampers.", sentimen: "positif", topik: ["Kemasan"] },
  { platform: "Instagram", pengguna: "@budget.mama", rating: 3, teks: "Enak sih, cuma harganya naik dibanding bulan lalu.", sentimen: "netral", topik: ["Harga"] },
  { platform: "TikTok", pengguna: "@reviewjujur", rating: 5, teks: "Viral bukan kaleng-kaleng, sesuai ekspektasi!", sentimen: "positif", topik: ["Rasa / Kualitas"] },
  { platform: "TikTok", pengguna: "@anakkos.hemat", rating: 4, teks: "Murah meriah buat anak kos, recommended.", sentimen: "positif", topik: ["Harga"] },
  { platform: "TikTok", pengguna: "@keluhan.ku", rating: 1, teks: "Admin tidak balas chat, pesanan dibatalkan sepihak.", sentimen: "negatif", topik: ["Pelayanan"] },
  { platform: "Shopee", pengguna: "fitri_a", rating: 5, teks: "Packing aman pakai bubble wrap, mantap.", sentimen: "positif", topik: ["Kemasan"] },
  { platform: "Tokopedia", pengguna: "Hendra", rating: 3, teks: "Produk oke, pengiriman standar.", sentimen: "netral", topik: ["Rasa / Kualitas", "Pengiriman"] },
];

export function ulasanAwal(): Ulasan[] {
  const now = Date.now();
  return ULASAN_DASAR.map((u, i) => ({
    ...u,
    id: `ul-${i}`,
    tanggal: new Date(now - (i * 1.7 + 0.4) * 86_400_000).toISOString().slice(0, 10),
  }));
}

// Ulasan "baru" yang muncul saat tombol Ambil Ulasan Terbaru ditekan (simulasi scraping)
export const ULASAN_BARU: Omit<Ulasan, "id" | "tanggal">[] = [
  { platform: "Shopee", pengguna: "wulan.d", rating: 2, teks: "Kurir kedua kalinya telat, tolong ganti ekspedisi.", sentimen: "negatif", topik: ["Pengiriman"] },
  { platform: "TikTok", pengguna: "@foodie.bdg", rating: 5, teks: "Live kemarin seru, promonya worth banget!", sentimen: "positif", topik: ["Harga", "Pelayanan"] },
  { platform: "Instagram", pengguna: "@ibu.rumahan", rating: 4, teks: "Anak-anak suka, kualitas konsisten.", sentimen: "positif", topik: ["Rasa / Kualitas"] },
  { platform: "Tokopedia", pengguna: "Agus S.", rating: 3, teks: "Harga naik sedikit, tapi masih oke.", sentimen: "netral", topik: ["Harga"] },
];
