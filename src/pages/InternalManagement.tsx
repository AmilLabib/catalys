import { useSearchParams } from "react-router-dom";
import { Boxes, Users, Megaphone } from "lucide-react";
import { usePageTitle } from "../hooks/usePageTitle";
import { useAccount } from "../context/AccountContext";
import { useBusinessSector } from "../context/BusinessSectorContext";
import PillTabs from "../components/PillTabs";
import TabInventaris from "./internal/TabInventaris";
import TabPenggajian from "./internal/TabPenggajian";
import TabPemasaran from "./internal/TabPemasaran";

const SEMUA_TAB = [
  { key: "inventaris", label: "Persediaan", icon: Boxes },
  { key: "penggajian", label: "Sumber Daya", icon: Users },
  { key: "pemasaran", label: "Pemasaran", icon: Megaphone },
] as const;

type TabKey = (typeof SEMUA_TAB)[number]["key"];

export default function InternalManagement() {
  usePageTitle("Manajemen Internal");
  const { role } = useAccount();
  const { sector } = useBusinessSector();
  const [params, setParams] = useSearchParams();
  // Akun cabang hanya mengelola inventarisnya sendiri
  const tabs = role === "cabang" ? SEMUA_TAB.filter((t) => t.key === "inventaris") : SEMUA_TAB;
  const minta = params.get("tab") as TabKey | null;
  const aktif: TabKey = tabs.some((t) => t.key === minta) ? minta! : "inventaris";

  return (
    <div className="max-w-[80rem] mx-auto">
      <p className="text-sm text-gray-600 mb-4">
        Operasional harian bisnis: persediaan bahan baku dan supplier, sumber daya manusia dan penggajian, serta pemantauan ulasan pelanggan di media sosial dan e-commerce.
      </p>
      {tabs.length > 1 && <PillTabs tabs={tabs} active={aktif} onChange={(k) => setParams({ tab: k })} className="mb-6" />}
      {aktif === "inventaris" && <TabInventaris key={sector} />}
      {aktif === "penggajian" && <TabPenggajian key={sector} />}
      {aktif === "pemasaran" && <TabPemasaran />}
    </div>
  );
}
