// Data contoh Manajemen Internal (inventaris, penggajian, pemasaran) per sektor.
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

// ---------- Penggajian ----------

export type Karyawan = {
  id: string;
  nama: string;
  jabatan: string;
  gajiPokok: number;
  tunjangan: number;
  lembur: number;
  kinerja: number; // 0-100
  kehadiran: number; // 0-100 (% hari hadir tepat waktu)
  target: number; // 0-120 (% capaian target)
  telepon: string;
  masuk: string; // jam masuk hari ini, "" = belum hadir
  pulang: string;
};

const NAMA = ["Budi Santoso", "Siti Aminah", "Andi Wijaya", "Rina Lestari", "Dimas Prakoso", "Maya Sari", "Fajar Nugraha", "Lia Kurniawati"];

export function karyawanSektor(sector: BusinessSector): Karyawan[] {
  const peran = SEKTOR[sector].peran;
  const data: [number, number, number, number, number, number][] = [
    // peranIdx, gajiPokok, tunjangan, lembur, kinerja, kehadiran
    [0, 4_200_000, 600_000, 450_000, 92, 97],
    [1, 3_600_000, 400_000, 150_000, 86, 88],
    [2, 3_400_000, 400_000, 300_000, 81, 99],
    [0, 4_000_000, 600_000, 200_000, 89, 94],
    [3, 3_300_000, 350_000, 520_000, 77, 91],
    [1, 3_600_000, 400_000, 0, 94, 96],
    [2, 3_400_000, 400_000, 100_000, 70, 83],
    [3, 3_300_000, 350_000, 380_000, 84, 90],
  ];
  const target = [112, 98, 95, 104, 88, 109, 79, 97];
  const telepon = ["0812-8834-1201", "0813-1922-4475", "0857-7012-3390", "0821-4456-9018", "0896-3310-7742", "0811-2087-6653", "0878-5521-0934", "0852-6649-1187"];
  const jam: [string, string][] = [
    ["07:52", "17:05"],
    ["08:11", "17:20"],
    ["07:58", "16:55"],
    ["08:03", "17:10"],
    ["08:24", ""],
    ["07:49", "17:02"],
    ["", ""],
    ["08:06", ""],
  ];
  return data.map(([p, gaji, tunj, lembur, kinerja, hadir], i) => ({
    id: `kry-${i + 1}`,
    nama: NAMA[i],
    jabatan: peran[p],
    gajiPokok: gaji,
    tunjangan: tunj,
    lembur,
    kinerja,
    kehadiran: hadir,
    target: target[i],
    telepon: telepon[i],
    masuk: jam[i][0],
    pulang: jam[i][1],
  }));
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
