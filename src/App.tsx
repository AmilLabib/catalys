import { useState } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import MainLayout from "./layouts/MainLayout";
import Financial from "./pages/Financial";
import ChartOfAccounts from "./pages/ChartOfAccounts";
import { ChartOfAccountsProvider } from "./context/ChartOfAccountsContext";
import { InventoryProvider } from "./context/InventoryContext";
import { JournalProvider } from "./context/JournalContext";
import InstructionsModal from "./components/InstructionsModal";
import InternalManagement from "./pages/InternalManagement";
import DataDriven from "./pages/DataDriven";
import UmkmBerkembang from "./pages/UmkmBerkembang";
import Permodalan from "./pages/Permodalan";
import Subscription from "./pages/Subscription";
import SmartPricing from "./components/SmartPricing";
import CariDistributor from "./pages/CariDistributor";
import Kasir from "./pages/Kasir";
import {
  BusinessSectorProvider,
  SECTOR_OPTIONS,
  useBusinessSector,
} from "./context/BusinessSectorContext";

function LoginScreenInner() {
  const [passwordShown, setPasswordShown] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const navigate = useNavigate();
  const { sector, setSector } = useBusinessSector();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      nextErrors.email = "Masukkan email yang valid";
    if (!password) nextErrors.password = "Masukkan password";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    // proceed
    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-6 bg-bg">
      <InstructionsModal
        visible={showInstructions}
        onClose={() => setShowInstructions(false)}
      />
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <img src="/logo.png" alt="VerdeLedger logo" className="w-36" />
        </div>

        <form
          className="w-full flex flex-col gap-4"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text">Email</label>
            <div className="relative">
              <input
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`h-12 rounded-full border-2 px-4 w-full bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 ${errors.email ? "border-red-400" : "border-gray-200"}`}
                required
              />
              {errors.email && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                  <AlertCircle className="w-5 h-5" />
                </div>
              )}
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text">Password</label>
            <div className="relative">
              <input
                name="password"
                type={passwordShown ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`h-12 rounded-full border-2 px-4 w-full bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 ${errors.password ? "border-red-400" : "border-gray-200"}`}
                required
              />
              <button
                type="button"
                aria-label={
                  passwordShown
                    ? "Sembunyikan password"
                    : "Perlihatkan password"
                }
                onClick={() => setPasswordShown((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"
              >
                {passwordShown ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
              {errors.password && (
                <div className="absolute right-10 top-1/2 -translate-y-1/2 text-red-500">
                  <AlertCircle className="w-5 h-5" />
                </div>
              )}
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text">
              Pilih Sektor Bisnis
            </label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value as any)}
              className="h-12 rounded-full border-2 border-gray-200 px-4 bg-white focus:outline-none focus:ring-4 focus:ring-primary/10"
            >
              {SECTOR_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <button className="mt-2 h-14 rounded-full bg-primary text-white text-lg font-bold">
            Masuk
          </button>

          <div className="flex flex-col items-center gap-1 mt-3">
            <a href="#" className="text-sm underline">
              Lupa Password?
            </a>
            <a href="#" className="text-sm underline font-semibold">
              Daftar Akun
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ChartOfAccountsProvider>
      <BusinessSectorProvider>
        <InventoryProvider>
          <JournalProvider>
            <Routes>
              <Route path="/" element={<LoginScreenInner />} />
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/financial" element={<Financial />} />
                <Route
                  path="/chart-of-accounts"
                  element={<ChartOfAccounts />}
                />
                <Route
                  path="/internal-management"
                  element={<InternalManagement />}
                />
                <Route path="/data-driven" element={<DataDriven />} />
                <Route path="/umkm-berkembang" element={<UmkmBerkembang />} />
                <Route path="/permodalan" element={<Permodalan />} />
                <Route path="/subscription" element={<Subscription />} />
                <Route path="/smart-pricing" element={<SmartPricing />} />
                <Route path="/cari-distributor" element={<CariDistributor />} />
                <Route path="/kasir" element={<Kasir />} />
              </Route>
            </Routes>
          </JournalProvider>
        </InventoryProvider>
      </BusinessSectorProvider>
    </ChartOfAccountsProvider>
  );
}
