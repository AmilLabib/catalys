import { useEffect, useState } from "react";

export default function AccountEditModal({
  visible,
  initial,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  initial?: {
    code?: string;
    name?: string;
    type?: string;
    targetKind?: string;
    targetField?: string;
    description?: string;
  };
  onClose: () => void;
  onSubmit: (data: {
    code: string;
    name: string;
    type: string;
    target: { kind: string; field: string };
    description?: string;
  }) => void;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("asset");
  const [targetKind, setTargetKind] = useState("bs");
  const [targetField, setTargetField] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    setCode(initial?.code || "");
    setName(initial?.name || "");
    setType(initial?.type || "asset");
    setTargetKind(initial?.targetKind || "bs");
    setTargetField(initial?.targetField || "");
    setDescription(initial?.description || "");
  }, [initial, visible]);

  if (!visible) return null;

  const handleSave = () => {
    if (!code || !name) return;
    onSubmit({
      code: code.trim(),
      name: name.trim(),
      type: type as any,
      target: { kind: targetKind as any, field: targetField.trim() },
      description: description.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-[min(92%,640px)] shadow-lg">
        <h3 className="text-lg font-semibold mb-3">
          {initial ? "Edit Account" : "Add Account"}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm">Code</label>
            <input
              className="w-full mt-1 border rounded px-3 py-2"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm">Name</label>
            <input
              className="w-full mt-1 border rounded px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm">Type</label>
            <select
              className="w-full mt-1 border rounded px-3 py-2"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="asset">asset</option>
              <option value="liability">liability</option>
              <option value="equity">equity</option>
              <option value="revenue">revenue</option>
              <option value="expense">expense</option>
              <option value="distribution">distribution</option>
            </select>
          </div>
          <div>
            <label className="text-sm">Target (kind)</label>
            <select
              className="w-full mt-1 border rounded px-3 py-2"
              value={targetKind}
              onChange={(e) => setTargetKind(e.target.value)}
            >
              <option value="bs">bs</option>
              <option value="is">is</option>
              <option value="equity">equity</option>
            </select>
          </div>
          <div>
            <label className="text-sm">Target field</label>
            <input
              className="w-full mt-1 border rounded px-3 py-2"
              value={targetField}
              onChange={(e) => setTargetField(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm">Description</label>
            <textarea
              className="w-full mt-1 border rounded px-3 py-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded bg-primary text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
