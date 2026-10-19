import type { LucideIcon } from "lucide-react";

// Navigasi tab berbentuk pil (gaya yang sama dengan halaman UMKM Berkembang)
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
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
              on ? "bg-primary text-white border-primary shadow-sm" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {Icon && <Icon className="w-4 h-4" />} {t.label}
          </button>
        );
      })}
    </div>
  );
}
