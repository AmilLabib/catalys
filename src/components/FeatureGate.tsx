import { Link, Navigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { useAccount } from "../context/AccountContext";
import { usePageTitle } from "../hooks/usePageTitle";
import { FEATURES, lockedMessage, type FeatureKey } from "../config/access";

// Penjaga rute: fitur di luar peran diarahkan ke Beranda, fitur di luar
// paket menampilkan layar terkunci dengan tombol upgrade.
export default function FeatureGate({
  feature,
  children,
}: {
  feature: FeatureKey;
  children: React.ReactNode;
}) {
  const { canSee, canUse } = useAccount();
  if (!canSee(feature)) return <Navigate to="/dashboard" replace />;
  if (canUse(feature)) return <>{children}</>;
  return <Terkunci feature={feature} />;
}

function Terkunci({ feature }: { feature: FeatureKey }) {
  const def = FEATURES[feature];
  usePageTitle(def.label);
  return (
    <div className="card-elegant max-w-lg mx-auto mt-16 text-center p-8">
      <div className="mx-auto w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
        <Lock className="w-6 h-6 text-gray-500" />
      </div>
      <h2 className="mt-4 text-xl font-bold text-primary">{def.label} terkunci</h2>
      <p className="mt-2 text-sm text-gray-600">{lockedMessage(def.minPlan)}.</p>
      <Link
        to="/profil?tab=paket"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95"
      >
        Upgrade Paket
      </Link>
    </div>
  );
}
