export default function AccountInfoModal({
  visible,
  onClose,
  account,
}: {
  visible: boolean;
  onClose: () => void;
  account?: { code: string; name: string; description?: string };
}) {
  if (!visible || !account) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-[min(90%,600px)] shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {account.code} — {account.name}
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              {account.description || "No description provided."}
            </p>
          </div>
          <button onClick={onClose} className="text-sm text-gray-500">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
