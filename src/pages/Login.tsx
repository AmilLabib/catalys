import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Store, Lock, Check } from "lucide-react";
import { useAccount } from "../context/AccountContext";
import { SECTOR_OPTIONS, useBusinessSector, type BusinessSector } from "../context/BusinessSectorContext";
import { BRANCHES, PLANS, PLAN_LABEL, type Plan, type Role } from "../config/access";

// Akun demo: email dan kata sandi terisi otomatis sesuai peran, tidak bisa diubah.
// Pengguna cukup memilih peran, sektor bisnis, dan paket langganan.
const KATA_SANDI_DEMO = "catalysdemo";

function emailDemo(role: Role, cabang: string) {
  if (role === "induk") return "induk@catalys.id";
  return `${cabang.toLowerCase().replace(/\s+/g, ".")}@catalys.id`;
}

const ROLE_OPSI: { value: Role; label: string; desc: string; Icon: typeof Store }[] = [
  { value: "induk", label: "Induk", desc: "Kantor pusat", Icon: Building2 },
  { value: "cabang", label: "Cabang", desc: "Outlet / toko", Icon: Store },
];

export default function Login() {
  const navigate = useNavigate();
  const { sector, setSector } = useBusinessSector();
  const { login, setPlan, plan: planTersimpan } = useAccount();
  const [role, setRole] = useState<Role>("induk");
  const [cabang, setCabang] = useState(BRANCHES[0]);
  const [plan, setPlanPilihan] = useState<Plan>(planTersimpan);

  const email = emailDemo(role, cabang);

  const masuk = (e: React.FormEvent) => {
    e.preventDefault();
    login(role, cabang, email);
    setPlan(plan);
    navigate("/dashboard");
  };

  const label = "text-sm font-medium text-text";
  const terkunci = "h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-4 pr-10 text-sm text-gray-600 cursor-not-allowed focus:outline-none";

  return (
    <div className="login-bg min-h-screen flex items-center justify-center relative overflow-hidden p-6">
      <div className="login-blob login-blob-a" />
      <div className="login-blob login-blob-b" />
      <div className="relative w-full max-w-lg flex flex-col items-center gap-5">
        <div className="relative flex flex-col items-center">
          <span className="logo-halo" aria-hidden />
          <img src="/logo-full.png" alt="Catalys - Smarter data. Stronger growth." className="logo-entrance w-56 sm:w-64 relative" />
        </div>

        <form onSubmit={masuk} className="login-item card-elegant w-full p-6 flex flex-col gap-5" style={{ animationDelay: "0.9s" }}>
          <div className="flex flex-col gap-2">
            <span className={label}>Masuk sebagai</span>
            <div className="grid grid-cols-2 gap-3">
              {ROLE_OPSI.map(({ value, label: l, desc, Icon }) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setRole(value)}
                  aria-pressed={role === value}
                  className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all ${
                    role === value ? "border-primary bg-white shadow-md" : "border-gray-200 bg-white/70 hover:border-gray-300"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${role === value ? "text-primary" : "text-gray-400"}`} />
                  <span>
                    <span className="block text-sm font-semibold text-primary">{l}</span>
                    <span className="block text-xs text-gray-500">{desc}</span>
                  </span>
                </button>
              ))}
            </div>
            {role === "cabang" && (
              <select
                value={cabang}
                onChange={(e) => setCabang(e.target.value)}
                className="h-11 rounded-xl border border-gray-200 px-3 bg-white text-sm focus:outline-none focus:ring-4 focus:ring-primary/10"
              >
                {BRANCHES.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            )}
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
