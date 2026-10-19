import { useId } from "react";
import { motion } from "motion/react";
import { Lock, type LucideIcon } from "lucide-react";

// Navigasi tab berbentuk pil (gaya yang sama dengan halaman UMKM Berkembang).
// Latar tab aktif bergeser halus ke tab yang dipilih. Tab dengan `terkunci`
// tampil abu-abu dan tidak bisa dipilih; isinya menjadi keterangan.
export default function PillTabs<K extends string>({
  tabs,
  active,
  onChange,
  className = "",
}: {
  tabs: readonly { key: K; label: string; icon?: LucideIcon; terkunci?: string }[];
  active: K;
  onChange: (k: K) => void;
  className?: string;
}) {
  const idIndikator = useId();
  return (
    <div className={`flex flex-wrap gap-2 ${className}`} role="tablist">
      {tabs.map((t) => {
        const Icon = t.icon;
        const on = active === t.key;
        if (t.terkunci)
          return (
            <button
              key={t.key}
              role="tab"
              aria-disabled
              title={t.terkunci}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm font-medium text-gray-400 cursor-not-allowed"
            >
              {Icon && <Icon className="w-4 h-4" />}
              {t.label}
              <Lock className="w-3.5 h-3.5" />
            </button>
          );
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.key)}
            className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
              on ? "text-white border-transparent" : "bg-white/80 backdrop-blur text-gray-700 border-gray-300 hover:bg-white"
            }`}
          >
            {on && (
              <motion.span
                layoutId={idIndikator}
                className="indikator-aktif rounded-full"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            {Icon && <Icon className="relative w-4 h-4" />}
            <span className="relative">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
