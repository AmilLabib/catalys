import React, { createContext, useContext, useEffect, useState } from "react";
import type { Account } from "./ChartOfAccountsContext";
import { useChartOfAccounts } from "./ChartOfAccountsContext";

export type JournalLine = {
  id: string;
  side: "debit" | "credit";
  accountId: string;
  amount: number;
};

export type JournalEntry = {
  id: string;
  date: string;
  description?: string;
  lines: JournalLine[];
};

const STORAGE_KEY = "journals_v1";

type JournalCtx = {
  entries: JournalEntry[];
  addEntry: (e: JournalEntry) => void;
  // expose the React state setter so consumers can update entries with a functional update
  setEntries: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
  addSaleFromCart: (
    cart: {
      id: string;
      name: string;
      price: number;
      quantity: number;
      unitCost?: number;
    }[],
    opts?: { description?: string },
  ) => void;
};

const ctx = createContext<JournalCtx | undefined>(undefined);

export function JournalProvider({ children }: { children: React.ReactNode }) {
  const { accounts } = useChartOfAccounts();
  const [entries, setEntriesState] = useState<JournalEntry[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as JournalEntry[];
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {}
  }, [entries]);

  const addEntry = (e: JournalEntry) => setEntriesState((s) => [e, ...s]);

  const findCashAccount = (): Account | undefined => {
    const byName = accounts.find((a) => a.name.toLowerCase().includes("kas"));
    if (byName) return byName;
    return accounts.find(
      (a) => a.target && a.target.field && a.target.field.includes("kas"),
    );
  };

  const findRevenueAccount = (): Account | undefined => {
    const byType = accounts.find((a) => a.type === "revenue");
    if (byType) return byType;
    const byName = accounts.find(
      (a) =>
        a.name.toLowerCase().includes("penjualan") ||
        a.name.toLowerCase().includes("pendapatan"),
    );
    if (byName) return byName;
    return undefined;
  };

  const addSaleFromCart = (
    cart: {
      id: string;
      name: string;
      price: number;
      quantity: number;
      unitCost?: number;
    }[],
    opts: { description?: string } = {},
  ) => {
    const total = cart.reduce((s: number, it) => s + it.price * it.quantity, 0);
    const totalCogs = cart.reduce(
      (s: number, it) => s + (it.unitCost || 0) * it.quantity,
      0,
    );

    if (total <= 0) return;
    const cashAcc = findCashAccount();
    const revAcc = findRevenueAccount();
    const cogsAcc =
      accounts.find((a) => a.code === "5.1.1.01") ||
      accounts.find((a) => a.name.toLowerCase().includes("harga pokok"));
    const invAcc =
      accounts.find((a) => a.code === "1.1.4.01") ||
      accounts.find((a) => a.name.toLowerCase().includes("persediaan"));

    if (!cashAcc || !revAcc) {
      // cannot record without mapped accounts
      console.warn("No cash or revenue account found to record sale.");
      return;
    }

    const lines: JournalLine[] = [
      {
        id: `l-${Date.now()}-d`,
        side: "debit",
        accountId: cashAcc.id,
        amount: total,
      },
      {
        id: `l-${Date.now()}-c`,
        side: "credit",
        accountId: revAcc.id,
        amount: total,
      },
    ];

    if (totalCogs > 0 && cogsAcc && invAcc) {
      lines.push({
        id: `l-${Date.now()}-cogs-d`,
        side: "debit",
        accountId: cogsAcc.id,
        amount: totalCogs,
      });
      lines.push({
        id: `l-${Date.now()}-inv-c`,
        side: "credit",
        accountId: invAcc.id,
        amount: totalCogs,
      });
    }

    const entry: JournalEntry = {
      id: `sale-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      description: opts.description || "Penjualan di Kasir",
      lines,
    };

    addEntry(entry);
  };

  return (
    <ctx.Provider
      value={{
        entries,
        addEntry,
        setEntries: setEntriesState,
        addSaleFromCart,
      }}
    >
      {children}
    </ctx.Provider>
  );
}

export function useJournal() {
  const c = useContext(ctx);
  if (!c) throw new Error("useJournal must be used within JournalProvider");
  return c;
}
