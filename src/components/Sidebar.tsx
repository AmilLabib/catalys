import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "motion/react";
import {
  Home,
  BarChart2,
  Menu,
  X,
  Factory,
  AlertTriangle,
  Trophy,
  ShieldCheck,
  LogOut,
  User2,
  Map,
  ShoppingCart,
  BookOpen,
  MessagesSquare,
  Lock,
  Tag,
} from "lucide-react";
import { useAccount } from "../context/AccountContext";
import { useToast } from "../context/ToastContext";
import { FEATURES, lockedMessage, type FeatureKey } from "../config/access";

type Props = {
  mobileOpen?: boolean;
  onClose?: () => void;
};

const GROUPS: { title: string; items: { key: FeatureKey; icon: typeof Home }[] }[] = [
  {
    title: "Ringkasan",
    items: [{ key: "beranda", icon: Home }],
  },
  {
    title: "Operasional",
    items: [
      { key: "kasir", icon: ShoppingCart },
      { key: "hargaCerdas", icon: Tag },
      { key: "manajemenInternal", icon: Factory },
    ],
  },
  {
    title: "Keuangan",
    items: [
      { key: "baganAkun", icon: BookOpen },
      { key: "laporanKeuangan", icon: BarChart2 },
      { key: "audit", icon: AlertTriangle },
    ],
  },
  {
    title: "Pertumbuhan",
    items: [
      { key: "konsultasi", icon: MessagesSquare },
      { key: "umkmBerkembang", icon: Trophy },
      { key: "permodalan", icon: ShieldCheck },
      { key: "cariDistributor", icon: Map },
    ],
  },
];

export default function Sidebar({ mobileOpen = false, onClose }: Props) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  // Tooltip memakai posisi fixed supaya tidak terpotong oleh area scroll nav
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null);
  const { canSee, canUse } = useAccount();
  const { toast } = useToast();

  function item(key: FeatureKey, Icon: typeof Home, compact: boolean, indikator: string) {
    const def = FEATURES[key];
    const active = pathname === def.path;
    const locked = !canUse(key);
    const base = `group relative flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
      compact ? "justify-center" : "justify-start"
    }`;
    const label = (
      <span
        className={`relative transition-all duration-300 ease-in-out origin-left truncate ${
          compact
            ? "opacity-0 translate-x-[-6px] w-0 overflow-hidden"
            : "opacity-100 translate-x-0"
        }`}
      >
        {def.label}
      </span>
    );

    if (locked) {
      return (
        <div
          key={key}
          className={`${base} text-gray-400 cursor-not-allowed select-none`}
          aria-disabled="true"
          onMouseEnter={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setTip({ text: lockedMessage(def.minPlan), x: r.right + 8, y: r.top + r.height / 2 });
          }}
          onMouseLeave={() => setTip(null)}
          onClick={(e) => {
            // di layar sentuh tidak ada hover, jadi tampilkan sebagai notifikasi
            e.stopPropagation();
            toast(lockedMessage(def.minPlan), "info");
          }}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          {label}
          {!compact && <Lock className="w-3.5 h-3.5 ml-auto" />}
        </div>
      );
    }

    return (
      <Link
        key={key}
        to={def.path}
        className={`${base} ${active ? "text-white" : "text-text hover:bg-gray-100"}`}
      >
        {/* latar menu aktif bergeser halus antar menu (shared layout animation) */}
        {active && (
          <motion.span
            layoutId={indikator}
            className="indikator-aktif rounded-lg"
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          />
        )}
        <Icon className="relative w-5 h-5 flex-shrink-0" />
        {label}
      </Link>
    );
  }

  function nav(compact: boolean, indikator: string) {
    return GROUPS.map((g) => {
      const visible = g.items.filter((i) => canSee(i.key));
      if (visible.length === 0) return null;
      return (
        <div key={g.title}>
          <p
            className={`text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400 mb-2 px-1 ${
              compact ? "opacity-0 h-0 mb-0 overflow-hidden" : "opacity-100"
            }`}
          >
            {g.title}
          </p>
          <div className="space-y-1">
            {visible.map((i) => item(i.key, i.icon, compact, indikator))}
          </div>
        </div>
      );
    });
  }

  function bottom(compact: boolean) {
    const profilActive = pathname === "/profil";
    return (
      <div className="mt-4 pt-4 border-t space-y-1">
        <Link
          to="/profil"
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
            profilActive ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"
          } ${compact ? "justify-center" : ""}`}
        >
          <User2 className="w-4 h-4" />
          {!compact && <span>Profil</span>}
        </Link>
        <button
          onClick={() => navigate("/")}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 text-sm text-red-600 ${
            compact ? "justify-center" : ""
          }`}
        >
          <LogOut className="w-4 h-4" />
          {!compact && <span>Keluar</span>}
        </button>
      </div>
    );
  }

  return (
    <>
      {tip && (
        <div
          className="hidden md:block fixed z-[1100] -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg pointer-events-none"
          style={{ left: tip.x, top: tip.y }}
        >
          {tip.text}
        </div>
      )}
      {/* Sidebar desktop */}
      <aside
        className={`sidebar-root hidden md:flex flex-col h-screen sticky top-0 bg-white/75 backdrop-blur-xl border-r border-white/60 px-4 py-4 transition-all duration-300 ease-in-out ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="mb-8 flex items-center justify-between">
          <button
            className="flex items-center gap-2"
            onClick={() => setCollapsed((s) => !s)}
          >
            <img
              src="/logo.png"
              alt="logo"
              className={`transition-all ${collapsed ? "w-8" : "w-9"}`}
            />
            <span
              className={`text-sm font-semibold text-gray-800 tracking-wide transition-all origin-left ${
                collapsed ? "opacity-0 scale-95 w-0" : "opacity-100 scale-100"
              }`}
            >
              Catalys
            </span>
          </button>

          <button
            onClick={() => setCollapsed((s) => !s)}
            aria-label={collapsed ? "Buka sidebar" : "Ciutkan sidebar"}
            className="p-1.5 rounded-md hover:bg-gray-100"
          >
            {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </button>
        </div>


        <nav className="flex-1 space-y-5 overflow-y-auto pr-1">
          {nav(collapsed, "aktif-desktop")}
        </nav>

        {bottom(collapsed)}
      </aside>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white p-4 shadow-lg flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <img src="/logo.png" alt="logo" className="w-10" />
              <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-5 overflow-y-auto" onClick={onClose}>
              {nav(false, "aktif-mobile")}
            </nav>
            <div onClick={onClose}>{bottom(false)}</div>
          </div>
        </div>
      )}
    </>
  );
}
