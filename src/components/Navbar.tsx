import { Link } from "react-router-dom";
import { usePageTitleContext } from "../context/PageTitleContext";
import { useDemoMode } from "../context/DemoModeContext";
import { useAccount } from "../context/AccountContext";
import { Menu, Bell, Search, PlayCircle } from "lucide-react";
import { PLAN_LABEL } from "../config/access";

type Props = {
  onMobileMenu?: () => void;
};

export default function Navbar({ onMobileMenu }: Props) {
  const { title: pageTitle } = usePageTitleContext();
  const { triggerDemo } = useDemoMode();
  const { profile, role, cabang, plan } = useAccount();

  const inisial = profile.nama
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-white/60 shadow-[0_1px_0_rgba(1,42,61,0.06)]">
      <div className="max-w-[90rem] mx-auto px-4 md:px-8 py-3 flex items-center gap-4 relative">
        {/* Tombol menu mobile */}
        <div className="md:hidden">
          <button
            onClick={onMobileMenu}
            aria-label="Buka menu"
            className="p-2 rounded hover:bg-gray-100"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Judul halaman + pencarian */}
        <div className="flex-1 flex items-center justify-start gap-4 min-w-0">
          <div className="min-w-0 shrink-0 max-w-[35vw] sm:max-w-[45vw]">
            <h1 className="px-2 sm:px-8 text-[11px] sm:text-base md:text-lg font-extrabold text-primary leading-tight sm:truncate">
              {pageTitle}
            </h1>
          </div>
          <div className="w-full max-w-xl relative min-w-0">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Cari laporan, pelanggan, atau wawasan..."
              className="w-full pl-9 pr-3 py-2 rounded-full bg-gray-100 border border-transparent focus:border-primary/40 focus:bg-white focus:outline-none text-sm"
            />
          </div>
        </div>

        {/* Kontrol kanan */}
        <div className="flex items-center gap-3">
          <button
            aria-label="Notifikasi"
            className="relative p-2 rounded-full hover:bg-gray-100"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1.5 right-1.5 block w-2 h-2 rounded-full bg-red-500" />
          </button>

          <button
            type="button"
            onClick={triggerDemo}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-primary text-white hover:bg-primary/90 text-sm"
            aria-label="Mode demo"
            title="Mode demo (isi data contoh)"
          >
            <PlayCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Mode Demo</span>
          </button>

          <Link
            to="/profil"
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
              {inisial}
            </div>
            <div className="leading-tight">
              <p className="text-xs font-medium text-gray-800">{profile.nama}</p>
              <p className="text-[11px] text-gray-500">
                {role === "induk" ? "Induk" : cabang} · {PLAN_LABEL[plan]}
              </p>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
