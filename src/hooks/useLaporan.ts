import { useMemo } from "react";
import { useAccount } from "../context/AccountContext";
import { useChartOfAccounts } from "../context/ChartOfAccountsContext";
import { useJournal } from "../context/JournalContext";
import { hitungLaporan, KONSOLIDASI } from "../data/laporan";
import type { JournalEntry } from "../context/JournalContext";

const TANPA_JURNAL: JournalEntry[] = [];

// Entitas laporan milik akun yang sedang masuk: induk melihat konsolidasi,
// cabang melihat cabangnya sendiri.
export function useEntitasSendiri() {
  const { role, cabang } = useAccount();
  return role === "induk" ? KONSOLIDASI : cabang;
}

export function useLaporan(tahun: number, entitas?: string) {
  const sendiri = useEntitasSendiri();
  const target = entitas ?? sendiri;
  const { entries } = useJournal();
  const { accounts } = useChartOfAccounts();
  // Jurnal yang diinput pengguna hanya masuk ke laporan entitasnya sendiri
  const jurnal = target === sendiri ? entries : TANPA_JURNAL;
  return useMemo(
    () => hitungLaporan(target, tahun, jurnal, accounts),
    [target, tahun, jurnal, accounts],
  );
}
