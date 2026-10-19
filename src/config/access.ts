// Aturan akses fitur: peran akun (induk/cabang) dan paket langganan.
// Fitur yang tidak sesuai peran disembunyikan, fitur yang belum termasuk
// paket ditampilkan abu-abu dengan keterangan paket minimal.

export type Role = "induk" | "cabang";
export type Plan = "gratis" | "pro" | "bisnis";

export type FeatureKey =
  | "beranda"
  | "kasir"
  | "hargaCerdas"
  | "baganAkun"
  | "laporanKeuangan"
  | "jurnal"
  | "manajemenInternal"
  | "audit"
  | "konsultasi"
  | "umkmBerkembang"
  | "permodalan"
  | "cariDistributor"
  | "profil";

export type FeatureDef = {
  label: string;
  path: string;
  minPlan: Plan;
  roles: Role[];
};

export const PLAN_ORDER: Plan[] = ["gratis", "pro", "bisnis"];

export const PLAN_LABEL: Record<Plan, string> = {
  gratis: "Gratis",
  pro: "Pro",
  bisnis: "Bisnis",
};

export const ROLE_LABEL: Record<Role, string> = {
  induk: "Induk",
  cabang: "Cabang",
};

const BOTH: Role[] = ["induk", "cabang"];

export const FEATURES: Record<FeatureKey, FeatureDef> = {
  beranda: { label: "Beranda", path: "/dashboard", minPlan: "gratis", roles: BOTH },
  kasir: { label: "Kasir POS", path: "/kasir", minPlan: "gratis", roles: ["cabang"] },
  hargaCerdas: { label: "Smart Pricing", path: "/smart-pricing", minPlan: "pro", roles: ["cabang"] },
  baganAkun: { label: "Bagan Akun", path: "/chart-of-accounts", minPlan: "gratis", roles: ["cabang"] },
  laporanKeuangan: { label: "Laporan Keuangan", path: "/financial", minPlan: "gratis", roles: BOTH },
  jurnal: { label: "Entri Jurnal", path: "/jurnal", minPlan: "gratis", roles: BOTH },
  manajemenInternal: { label: "Manajemen Internal", path: "/internal-management", minPlan: "bisnis", roles: BOTH },
  audit: { label: "Audit Berbasis Data", path: "/data-driven", minPlan: "bisnis", roles: ["induk"] },
  konsultasi: { label: "Konsultasi", path: "/konsultasi", minPlan: "pro", roles: ["induk"] },
  umkmBerkembang: { label: "UMKM Berkembang", path: "/umkm-berkembang", minPlan: "gratis", roles: ["induk"] },
  permodalan: { label: "Permodalan", path: "/permodalan", minPlan: "pro", roles: ["induk"] },
  cariDistributor: { label: "Cari Distributor", path: "/cari-distributor", minPlan: "gratis", roles: ["induk"] },
  profil: { label: "Profil", path: "/profil", minPlan: "gratis", roles: BOTH },
};

export function planAtLeast(plan: Plan, min: Plan) {
  return PLAN_ORDER.indexOf(plan) >= PLAN_ORDER.indexOf(min);
}

export function lockedMessage(min: Plan) {
  return min === "pro"
    ? "Hanya tersedia di paket Pro dan Bisnis"
    : `Hanya tersedia di paket ${PLAN_LABEL[min]}`;
}

// Kuota pemakaian per paket. null = tanpa batas.
export type QuotaKey = "scanStruk" | "konsultasi" | "eksporLaporan" | "hargaCerdas";

export const QUOTA_LIMITS: Record<QuotaKey, Record<Plan, number | null>> = {
  scanStruk: { gratis: 0, pro: 400, bisnis: 1000 },
  konsultasi: { gratis: 0, pro: 1, bisnis: 3 },
  eksporLaporan: { gratis: 3, pro: null, bisnis: null },
  hargaCerdas: { gratis: 0, pro: 30, bisnis: 100 },
};

export const QUOTA_INFO: Record<QuotaKey, { label: string; periode: string }> = {
  scanStruk: { label: "Scan Struk", periode: "minggu ini" },
  konsultasi: { label: "Sesi Konsultasi", periode: "bulan ini" },
  eksporLaporan: { label: "Ekspor Laporan", periode: "total" },
  hargaCerdas: { label: "Pencarian Smart Pricing", periode: "bulan ini" },
};

export type PlanDef = {
  key: Plan;
  harga: string;
  deskripsi: string;
  fitur: string[];
};

export const PLANS: PlanDef[] = [
  {
    key: "gratis",
    harga: "Rp 0",
    deskripsi: "Fitur dasar untuk mulai mencatat usaha.",
    fitur: [
      "Beranda, Kasir POS, dan Bagan Akun",
      "Laporan Keuangan (ekspor maks. 3x)",
      "UMKM Berkembang",
      "Cari Distributor",
    ],
  },
  {
    key: "pro",
    harga: "Rp 43.000 / bulan",
    deskripsi: "Untuk usaha yang butuh otomatisasi dan pendampingan bulanan.",
    fitur: [
      "Semua fitur Gratis",
      "Ekspor laporan tanpa batas",
      "Scan struk 400x per minggu",
      "Smart Pricing 30 pencarian per bulan",
      "Permodalan",
      "Konsultasi 1x per bulan",
    ],
  },
  {
    key: "bisnis",
    harga: "Rp 85.000 / bulan",
    deskripsi: "Paket lengkap dengan audit dan manajemen internal.",
    fitur: [
      "Semua fitur Pro",
      "Scan struk 1000x per minggu",
      "Smart Pricing 100 pencarian per bulan",
      "Audit Berbasis Data",
      "Manajemen Internal",
      "Konsultasi 3x per bulan",
    ],
  },
];

export const BRANCHES = ["Cabang Bogor", "Cabang Surakarta", "Cabang Bandung"];
