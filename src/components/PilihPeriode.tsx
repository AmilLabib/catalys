import { CalendarRange } from "lucide-react";
import { HARI_INI, TANGGAL_MIN } from "../data/laporan";
import { PRESET_PERIODE } from "../utils/periode";

// Pemilih periode laporan: pilihan cepat + dua tanggal (dari, sampai).

export default function PilihPeriode({
  dari,
  sampai,
  onUbah,
}: {
  dari: string;
  sampai: string;
  onUbah: (dari: string, sampai: string) => void;
}) {
  const preset = PRESET_PERIODE.find((p) => p.dari === dari && p.sampai === sampai)?.key ?? "kustom";
  const input = "rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm font-medium text-primary outline-none focus:ring-2 focus:ring-primary/15";

  return (
    <div className="inline-flex flex-wrap items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm shadow-sm">
      <CalendarRange className="w-4 h-4 text-primary" />
      <select
        value={preset}
        onChange={(e) => {
          const p = PRESET_PERIODE.find((x) => x.key === e.target.value);
          if (p) onUbah(p.dari, p.sampai);
        }}
        className="bg-transparent font-semibold text-primary outline-none"
        aria-label="Pilihan cepat periode"
      >
        {PRESET_PERIODE.map((p) => (
          <option key={p.key} value={p.key}>
            {p.label}
          </option>
        ))}
        <option value="kustom" disabled>
          Rentang kustom
        </option>
      </select>
      <span className="hidden sm:inline h-5 w-px bg-gray-200" />
      <label className="inline-flex items-center gap-1.5">
        <span className="text-gray-500">Dari</span>
        <input
          type="date"
          value={dari}
          min={TANGGAL_MIN}
          max={sampai}
          onChange={(e) => e.target.value && onUbah(e.target.value, sampai)}
          className={input}
        />
      </label>
      <label className="inline-flex items-center gap-1.5">
        <span className="text-gray-500">Sampai</span>
        <input
          type="date"
          value={sampai}
          min={dari}
          max={HARI_INI}
          onChange={(e) => e.target.value && onUbah(dari, e.target.value)}
          className={input}
        />
      </label>
    </div>
  );
}
