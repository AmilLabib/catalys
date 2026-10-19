import React, { createContext, useContext, useEffect, useState } from "react";
import {
  FEATURES,
  QUOTA_LIMITS,
  planAtLeast,
  type FeatureKey,
  type Plan,
  type QuotaKey,
  type Role,
} from "../config/access";

const STORAGE_KEY = "catalys_account_v1";

export type Profile = {
  nama: string;
  email: string;
  telepon: string;
  namaUsaha: string;
  alamat: string;
  jabatan: string;
};

export type SesiKonsultasi = {
  id: string;
  pakar: string;
  topik: string;
  tanggal: string; // YYYY-MM-DD
  jam: string;
  mode: "Online" | "Tatap Muka";
  catatan: string;
  status: "Terjadwal" | "Dibatalkan";
};

type AccountState = {
  role: Role;
  cabang: string;
  plan: Plan;
  profile: Profile;
  usage: Record<QuotaKey, number>;
  sesiTambahan: number;
  sesi: SesiKonsultasi[];
};

const DEFAULT_STATE: AccountState = {
  role: "induk",
  cabang: "Cabang Bogor",
  plan: "gratis",
  profile: {
    nama: "Amil Labib",
    email: "amil@catalys.id",
    telepon: "0812-3456-7890",
    namaUsaha: "Catalys Demo UMKM",
    alamat: "Jl. Pajajaran No. 12, Bogor",
    jabatan: "Pemilik Usaha",
  },
  usage: { scanStruk: 88, konsultasi: 0, eksporLaporan: 0, hargaCerdas: 4 },
  sesiTambahan: 0,
  sesi: [],
};

type AccountCtx = AccountState & {
  login: (role: Role, cabang: string, email: string) => void;
  setPlan: (plan: Plan) => void;
  updateProfile: (p: Partial<Profile>) => void;
  canSee: (f: FeatureKey) => boolean;
  canUse: (f: FeatureKey) => boolean;
  quotaLimit: (q: QuotaKey) => number | null;
  quotaRemaining: (q: QuotaKey) => number | null;
  pakaiKuota: (q: QuotaKey, amount?: number) => boolean;
  beliSesiTambahan: (jumlah: number) => void;
  jadwalkanSesi: (s: Omit<SesiKonsultasi, "id" | "status">) => boolean;
  batalkanSesi: (id: string) => void;
};

const ctx = createContext<AccountCtx | undefined>(undefined);

function loadState(): AccountState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const tersimpan = JSON.parse(raw);
      // migrasi nama lama: profil yang tersimpan sebelum ganti nama masih berisi "Arthami"
      const profil = { ...DEFAULT_STATE.profile, ...tersimpan.profile };
      for (const k of Object.keys(profil) as (keyof Profile)[]) {
        profil[k] = String(profil[k]).replace(/arthami/gi, (m: string) => (m === m.toLowerCase() ? "catalys" : "Catalys"));
      }
      // kuota baru yang belum ada di data lama diisi nilai awal
      return { ...DEFAULT_STATE, ...tersimpan, profile: profil, usage: { ...DEFAULT_STATE.usage, ...tersimpan.usage } };
    }
  } catch {
    // abaikan, pakai default
  }
  return DEFAULT_STATE;
}

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AccountState>(loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // abaikan
    }
  }, [state]);

  const canSee = (f: FeatureKey) => FEATURES[f].roles.includes(state.role);
  const canUse = (f: FeatureKey) =>
    canSee(f) && planAtLeast(state.plan, FEATURES[f].minPlan);

  const quotaLimit = (q: QuotaKey) => {
    const base = QUOTA_LIMITS[q][state.plan];
    if (q === "konsultasi" && base !== null) return base + state.sesiTambahan;
    return base;
  };

  const quotaRemaining = (q: QuotaKey) => {
    const limit = quotaLimit(q);
    if (limit === null) return null;
    return Math.max(0, limit - state.usage[q]);
  };

  const pakaiKuota = (q: QuotaKey, amount = 1) => {
    const remaining = quotaRemaining(q);
    if (remaining !== null && remaining < amount) return false;
    setState((s) => ({
      ...s,
      usage: { ...s.usage, [q]: s.usage[q] + amount },
    }));
    return true;
  };

  const value: AccountCtx = {
    ...state,
    login: (role, cabang, email) =>
      setState((s) => ({
        ...s,
        role,
        cabang,
        profile: email ? { ...s.profile, email } : s.profile,
      })),
    setPlan: (plan) => setState((s) => ({ ...s, plan })),
    updateProfile: (p) =>
      setState((s) => ({ ...s, profile: { ...s.profile, ...p } })),
    canSee,
    canUse,
    quotaLimit,
    quotaRemaining,
    pakaiKuota,
    beliSesiTambahan: (jumlah) =>
      setState((s) => ({ ...s, sesiTambahan: s.sesiTambahan + jumlah })),
    jadwalkanSesi: (sesi) => {
      if (!pakaiKuota("konsultasi")) return false;
      setState((s) => ({
        ...s,
        sesi: [
          { ...sesi, id: `sesi-${Date.now()}`, status: "Terjadwal" },
          ...s.sesi,
        ],
      }));
      return true;
    },
    batalkanSesi: (id) =>
      setState((s) => {
        const target = s.sesi.find((x) => x.id === id);
        if (!target || target.status !== "Terjadwal") return s;
        return {
          ...s,
          // sesi yang dibatalkan mengembalikan kuota
          usage: {
            ...s.usage,
            konsultasi: Math.max(0, s.usage.konsultasi - 1),
          },
          sesi: s.sesi.map((x) =>
            x.id === id ? { ...x, status: "Dibatalkan" } : x,
          ),
        };
      }),
  };

  return <ctx.Provider value={value}>{children}</ctx.Provider>;
}

export function useAccount() {
  const c = useContext(ctx);
  if (!c) throw new Error("useAccount harus dipakai di dalam AccountProvider");
  return c;
}
