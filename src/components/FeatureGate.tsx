import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { useAccount } from "../context/AccountContext";
import { usePageTitle } from "../hooks/usePageTitle";
import { FEATURES, type FeatureKey } from "../config/access";

// Penjaga rute: fitur di luar peran atau paket menampilkan layar terkunci.
// Untuk paket ada tombol upgrade; untuk peran diarahkan kembali ke Beranda.
export default function FeatureGate({
  feature,
  children,
}: {
  feature: FeatureKey;
  children: React.ReactNode;
}) {
  const { alasanTerkunci } = useAccount();
  const kunci = alasanTerkunci(feature);
  if (!kunci) return <>{children}</>;
  return <Terkunci feature={feature} pesan={kunci.pesan} peran={kunci.jenis === "peran"} />;
}

function Terkunci({ feature, pesan, peran }: { feature: FeatureKey; pesan: string; peran: boolean }) {
  const def = FEATURES[feature];
  usePageTitle(def.label);
  return (
    <div className="card-elegant max-w-lg mx-auto mt-16 text-center p-8">
      <div className="mx-auto w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
        <Lock className="w-6 h-6 text-gray-500" />
      </div>
      <h2 className="mt-4 text-xl font-bold text-primary">{def.label} terkunci</h2>
      <p className="mt-2 text-sm text-gray-600">{pesan}.</p>
      <Link
        to={peran ? "/dashboard" : "/profil?tab=paket"}
        className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95"
      >
        {peran ? "Kembali ke Beranda" : "Upgrade Paket"}
      </Link>
    </div>
  );
}
