import React, { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

type ToastKind = "sukses" | "peringatan" | "info";
type Toast = { id: number; kind: ToastKind; text: string };

type ToastCtx = { toast: (text: string, kind?: ToastKind) => void };

const ctx = createContext<ToastCtx | undefined>(undefined);

const STYLE: Record<ToastKind, { icon: typeof Info; cls: string }> = {
  sukses: { icon: CheckCircle2, cls: "border-emerald-200 text-emerald-800" },
  peringatan: { icon: AlertTriangle, cls: "border-amber-200 text-amber-800" },
  info: { icon: Info, cls: "border-blue-200 text-blue-800" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = (id: number) =>
    setToasts((t) => t.filter((x) => x.id !== id));

  const toast = useCallback((text: string, kind: ToastKind = "sukses") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  return (
    <ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[2000] flex flex-col gap-2 w-[min(92vw,360px)]">
        {toasts.map((t) => {
          const { icon: Icon, cls } = STYLE[t.kind];
          return (
            <div
              key={t.id}
              className={`toast-in flex items-start gap-3 rounded-xl border bg-white px-4 py-3 text-sm shadow-lg ${cls}`}
            >
              <Icon className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="flex-1 text-gray-800">{t.text}</p>
              <button
                onClick={() => remove(t.id)}
                aria-label="Tutup"
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ctx.Provider>
  );
}

export function useToast() {
  const c = useContext(ctx);
  if (!c) throw new Error("useToast harus dipakai di dalam ToastProvider");
  return c;
}
