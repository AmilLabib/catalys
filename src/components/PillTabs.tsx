import { useId } from "react";
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";

// Navigasi tab berbentuk pil (gaya yang sama dengan halaman UMKM Berkembang).
// Latar tab aktif bergeser halus ke tab yang dipilih.
export default function PillTabs<K extends string>({
  tabs,
  active,
  onChange,
  className = "",
}: {
  tabs: readonly { key: K; label: string; icon?: LucideIcon }[];
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
