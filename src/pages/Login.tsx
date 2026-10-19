import { lazy, Suspense, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Check } from "lucide-react";
import { useAccount } from "../context/AccountContext";
import { SECTOR_OPTIONS, useBusinessSector, type BusinessSector } from "../context/BusinessSectorContext";
import { PLANS, PLAN_LABEL, type Plan } from "../config/access";
import { useEfekKursor } from "../hooks/useEfekKursor";
import { bisa3D, BatasGalat3D } from "../components/three/dukungan";

// three.js dimuat terpisah agar tidak memperberat bundel utama
const LogoCatalys3D = lazy(() => import("../components/three/LogoCatalys3D"));

// Akun demo pemilik usaha: email dan kata sandi terisi otomatis, tidak bisa diubah.
// Pengguna selalu masuk ke akun induk; akun cabang dibuka lewat menu pindah akun.
const KATA_SANDI_DEMO = "catalysdemo";
const EMAIL_DEMO = "pemilik@catalys.id";

export default function Login() {
  const navigate = useNavigate();
  useEfekKursor();
  const { sector, setSector } = useBusinessSector();
  const { login, plan: planTersimpan } = useAccount();
  const [plan, setPlanPilihan] = useState<Plan>(planTersimpan);
  const email = EMAIL_DEMO;

  const masuk = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, plan);
    navigate("/dashboard");
  };

  const [pakai3D] = useState(bisa3D);
  const logoStatis = (
    <div className="relative flex flex-col items-center">
      <span className="logo-halo" aria-hidden />
      <img src="/logo-full.png" alt="Catalys - Smarter data. Stronger growth." className="logo-entrance w-56 sm:w-64 relative" />
    </div>
  );

  const label = "text-sm font-medium text-text";
  const terkunci = "h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-4 pr-10 text-sm text-gray-600 cursor-not-allowed focus:outline-none";

  return (
    <div className="login-bg min-h-screen flex items-center justify-center relative overflow-hidden p-6">
      <div className="login-blob login-blob-a" />
      <div className="login-blob login-blob-b" />
      <div className="relative w-full max-w-lg flex flex-col items-center gap-5">
        {pakai3D ? (
          <BatasGalat3D cadangan={logoStatis}>
            <Suspense fallback={<div className="h-52 w-72" />}>
              <div className="relative flex flex-col items-center">
                <div className="h-52 w-72 sm:h-56 sm:w-80" role="img" aria-label="Lambang Catalys">
                  <LogoCatalys3D />
                </div>
                <div className="login-item -mt-2 text-center" style={{ animationDelay: "0.6s" }}>
                  <p className="text-4xl font-light tracking-[0.45em] pl-[0.45em] text-primary">CATALYS</p>
                  <p className="mt-1 text-[10px] font-semibold tracking-[0.28em] text-[#012a3d]">SMARTER DATA. STRONGER GROWTH.</p>
                </div>
              </div>
            </Suspense>
          </BatasGalat3D>
        ) : (
          logoStatis
        )}

        <form onSubmit={masuk} className="login-item card-elegant w-full p-6 flex flex-col gap-5" style={{ animationDelay: "0.9s" }}>
          <div className="rounded-2xl bg-primary/5 px-4 py-3 text-sm text-gray-600">
            <p className="font-semibold text-primary">Masuk sebagai pemilik usaha</p>
            <p className="text-xs mt-0.5">Akun induk. Setelah membuka cabang, pindah ke akun cabang lewat menu di pojok kanan atas.</p>
          </div>

          <label className="flex flex-col gap-2">
            <span className={label}>Sektor bisnis</span>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value as BusinessSector)}
              className="h-11 rounded-xl border border-gray-200 px-3 bg-white text-sm focus:outline-none focus:ring-4 focus:ring-primary/10"
            >
              {SECTOR_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-2">
            <span className={label}>Paket langganan</span>
            <div className="grid grid-cols-3 gap-2">
              {PLANS.map((p) => (
                <button
                  type="button"
                  key={p.key}
                  onClick={() => setPlanPilihan(p.key)}
                  aria-pressed={plan === p.key}
                  className={`relative rounded-xl border-2 px-3 py-2.5 text-left transition-all ${
                    plan === p.key ? "border-primary bg-white shadow-md" : "border-gray-200 bg-white/70 hover:border-gray-300"
                  }`}
                >
                  {plan === p.key && <Check className="absolute top-2 right-2 w-4 h-4 text-primary" />}
                  <span className="block text-sm font-semibold text-primary">{PLAN_LABEL[p.key]}</span>
                  <span className="block text-[11px] text-gray-500 leading-tight">{p.harga.replace(" / bulan", "/bln")}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-2">
              <span className={label}>Email</span>
              <span className="relative">
                <input name="email" type="email" value={email} readOnly aria-readonly className={terkunci} />
                <Lock className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </span>
            </label>
            <label className="flex flex-col gap-2">
              <span className={label}>Kata sandi</span>
              <span className="relative">
                <input name="password" type="password" value={KATA_SANDI_DEMO} readOnly aria-readonly className={terkunci} />
                <Lock className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </span>
            </label>
          </div>
          <p className="-mt-2 text-xs text-gray-500">Akun demo, email dan kata sandi sudah terisi otomatis.</p>

          <button className="btn-gradient h-12 rounded-xl text-base font-bold">Masuk</button>
        </form>
      </div>
    </div>
  );
}
