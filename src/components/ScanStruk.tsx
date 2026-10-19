import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ScanLine, Lock, Camera, ShoppingBag, PackagePlus, ListChecks, FileCheck2 } from "lucide-react";
import { useAccount } from "../context/AccountContext";
import { useToast } from "../context/ToastContext";
import { useJournal, type JournalEntry } from "../context/JournalContext";
import { useChartOfAccounts } from "../context/ChartOfAccountsContext";
import { useInventory } from "../context/InventoryContext";
import { useBahanBaku } from "../context/BahanBakuContext";
import QuotaBadge from "./QuotaBadge";
import { formatRp } from "../data/laporan";
import { lockedMessage } from "../config/access";
import Lapisan from "../components/Lapisan";

// Satu baris struk. Untuk struk pembelian, baris yang cocok dengan bahan baku
// (bahanId) menambah stok persediaan sebanyak `qty`.
type ItemStruk = { name: string; price: number; qty: number; bahanId: string };

// Handle agar komponen lain bisa langsung membuka kamera scan (mis. setelah belanja di supplier)
export type ScanStrukHandle = { buka: (jenis: "penjualan" | "pembelian") => void };

const ScanStruk = forwardRef<ScanStrukHandle, { hanyaPembelian?: boolean; className?: string }>(function ScanStruk(
  { hanyaPembelian = false, className = "" },
  ref,
) {
  const { canUse, quotaLimit, quotaRemaining, pakaiKuota } = useAccount();
  const { toast } = useToast();
  const { entries, setEntries } = useJournal();
  const { accounts } = useChartOfAccounts();
  const { products } = useInventory();
  const { bahan, tambahStok, cocokkanBahan, getBahan } = useBahanBaku();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [kameraAktif, setKameraAktif] = useState(false);
  const [foto, setFoto] = useState<string | null>(null);
  const [errorKamera, setErrorKamera] = useState<string | null>(null);
  const [modalKamera, setModalKamera] = useState(false);
  const [jenis, setJenis] = useState<"penjualan" | "pembelian" | null>(null);
  const [menganalisis, setMenganalisis] = useState(false);
  const [data, setData] = useState<ItemStruk[] | null>(null);

  const tersedia = (quotaLimit("scanStruk") ?? 1) > 0 && canUse("laporanKeuangan");
  const sisa = quotaRemaining("scanStruk");

  const matikanKamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setKameraAktif(false);
  };

  useEffect(() => () => matikanKamera(), []);

  const nyalakanKamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setKameraAktif(true);
      setErrorKamera(null);
    } catch (err: any) {
      setErrorKamera(
        err?.name === "NotAllowedError"
          ? "Izin kamera ditolak. Izinkan akses kamera di browser, atau lanjutkan dengan struk contoh."
          : "Kamera tidak dapat diakses. Anda tetap bisa memakai struk contoh.",
      );
    }
  };

  const buka = (j: "penjualan" | "pembelian") => {
    if (sisa === 0) return toast("Token scan struk habis untuk minggu ini.", "peringatan");
    setJenis(j);
    setFoto(null);
    setModalKamera(true);
    nyalakanKamera();
  };

  useImperativeHandle(ref, () => ({
    buka: (j) => {
      if (!tersedia) return toast(`Scan struk ${lockedMessage("pro").toLowerCase()}.`, "info");
      buka(j);
    },
  }));

  const tutup = () => {
    setModalKamera(false);
    matikanKamera();
    setFoto(null);
  };

  const ambilFoto = () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c || !v.videoWidth) return;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    setFoto(c.toDataURL("image/jpeg", 0.8));
  };

  const analisis = () => {
    if (!pakaiKuota("scanStruk")) return toast("Token scan struk habis untuk minggu ini.", "peringatan");
    setMenganalisis(true);
    // OCR masih simulasi: isi struk diganti data contoh
    setTimeout(() => {
      if (jenis === "penjualan") {
        setData(
          products.slice(0, 3).map((p, i) => ({ name: p.name, price: p.sellingPrice * (i + 1), qty: i + 1, bahanId: "" })),
        );
      } else {
        // struk belanja: bahan yang paling menipis + satu barang non-persediaan
        const butuh = [...bahan].sort((a, b) => a.stok / (a.stokMin || 1) - b.stok / (b.stokMin || 1)).slice(0, 3);
        setData([
          ...butuh.map((b) => {
            const qty = Math.max(1, Math.round(b.stokMin));
            return { name: b.nama, qty, price: Math.round((qty * b.harga * 1.02) / 100) * 100, bahanId: b.id };
          }),
          { name: "Kertas struk thermal", qty: 2, price: 34_000, bahanId: "" },
        ]);
      }
      setMenganalisis(false);
      tutup();
    }, 900);
  };

  const simpan = () => {
    if (!data || !jenis) return;
    const total = data.reduce((s, i) => s + (Number(i.price) || 0), 0);
    if (total <= 0) return toast("Total struk harus lebih dari 0.", "peringatan");
    const byCode = (code: string) => accounts.find((a) => a.code === code)?.id;
    const kas = byCode("1.1.1.01");
    const hari = new Date().toISOString().slice(0, 10);
    const now = Date.now();
    const baru: JournalEntry[] = [];
    if (jenis === "penjualan") {
      const pend = byCode("4.2.1.01");
      const hpp = byCode("5.1.1.01");
      const persediaan = byCode("1.1.4.01");
      if (!kas || !pend) return toast("Akun kas/pendapatan tidak ditemukan di Bagan Akun.", "peringatan");
      baru.push({
        id: `${now}-jual`,
        date: hari,
        description: "Scan struk penjualan",
        lines: [
          { id: `${now}-1`, side: "debit", accountId: kas, amount: total },
          { id: `${now}-2`, side: "credit", accountId: pend, amount: total },
        ],
      });
      // HPP dari data inventaris; bila produk tidak ditemukan pakai estimasi 60%
      const pokok = data.reduce((s, i) => {
        const p = products.find((x) => x.name.toLowerCase() === i.name.toLowerCase());
        return s + (p ? p.unitCost * (i.qty || 1) : Math.round(i.price * 0.6));
      }, 0);
      if (hpp && persediaan && pokok > 0) {
        baru.push({
          id: `${now}-hpp`,
          date: hari,
          description: "HPP dari scan struk penjualan",
          lines: [
            { id: `${now}-3`, side: "debit", accountId: hpp, amount: pokok },
            { id: `${now}-4`, side: "credit", accountId: persediaan, amount: pokok },
          ],
        });
      }
    } else {
      const persediaan = byCode("1.1.4.01");
      const perlengkapan = byCode("1.1.4.03");
      if (!kas || !persediaan || !perlengkapan) return toast("Akun kas/persediaan tidak ditemukan di Bagan Akun.", "peringatan");
      const keBahan = data.filter((i) => i.bahanId && i.qty > 0);
      const nilaiBahan = keBahan.reduce((s, i) => s + i.price, 0);
      const nilaiLain = total - nilaiBahan;
      const lines: JournalEntry["lines"] = [];
      if (nilaiBahan > 0) lines.push({ id: `${now}-5`, side: "debit", accountId: persediaan, amount: nilaiBahan });
      if (nilaiLain > 0) lines.push({ id: `${now}-6`, side: "debit", accountId: perlengkapan, amount: nilaiLain });
      lines.push({ id: `${now}-7`, side: "credit", accountId: kas, amount: total });
      baru.push({ id: `${now}-beli`, date: hari, description: "Scan struk pembelian", lines });
      keBahan.forEach((i) => tambahStok(i.bahanId, i.qty, i.price));
      if (keBahan.length) toast(`Stok ${keBahan.length} bahan baku bertambah`, "info");
    }
    setEntries([...baru, ...entries]);
    setData(null);
    toast("Struk tercatat sebagai jurnal");
  };

  const ubahItem = (i: number, p: Partial<ItemStruk>) => setData((d) => d && d.map((x, j) => (j === i ? { ...x, ...p } : x)));

  return (
    <div className={`card-elegant p-5 flex flex-col ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl chip-gradient flex items-center justify-center">
            <ScanLine className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{hanyaPembelian ? "Scan Struk Pembelian" : "Scan Struk"}</h3>
            <p className="text-xs text-gray-500">
              {hanyaPembelian
                ? "Foto struk belanja, stok bahan baku bertambah otomatis."
                : "Foto struk belanja atau penjualan, jurnal tercatat otomatis."}
            </p>
          </div>
        </div>
        {tersedia && <QuotaBadge kuota="scanStruk" />}
      </div>

      {tersedia && !hanyaPembelian ? (
        <>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
            <button
              onClick={() => buka("penjualan")}
              disabled={sisa === 0}
              className="btn-gradient group rounded-2xl p-4 text-left flex flex-col justify-between gap-4 disabled:opacity-50"
            >
              <span className="w-10 h-10 rounded-xl bg-white/15 ring-1 ring-white/25 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </span>
              <span>
                <span className="block text-base font-bold">Struk Penjualan</span>
                <span className="block text-xs text-white/75 mt-0.5">Pendapatan dan HPP tercatat, stok produk berkurang.</span>
              </span>
            </button>
            <button
              onClick={() => buka("pembelian")}
              disabled={sisa === 0}
              className="rounded-2xl border-2 border-primary/80 bg-white p-4 text-left flex flex-col justify-between gap-4 text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
            >
              <span className="w-10 h-10 rounded-xl chip-gradient flex items-center justify-center">
                <PackagePlus className="w-5 h-5" />
              </span>
              <span>
                <span className="block text-base font-bold">Struk Pembelian</span>
                <span className="block text-xs text-gray-500 mt-0.5">Stok bahan baku bertambah, pembelian tercatat.</span>
              </span>
            </button>
          </div>
          {/* alur singkat cara kerja scan struk */}
          <ol className="mt-4 grid grid-cols-3 gap-2 text-[11px] text-gray-500">
            {[
              { Icon: Camera, t: "Foto struk" },
              { Icon: ListChecks, t: "Periksa isinya" },
              { Icon: FileCheck2, t: "Jurnal otomatis" },
            ].map(({ Icon, t }, i) => (
              <li key={t} className="flex items-center gap-2 rounded-lg bg-gray-50 px-2.5 py-2">
                <span className="w-6 h-6 shrink-0 rounded-full bg-white ring-1 ring-gray-200 flex items-center justify-center text-primary">
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span>
                  <span className="font-semibold text-gray-700">{i + 1}.</span> {t}
                </span>
              </li>
            ))}
          </ol>
        </>
      ) : tersedia ? (
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          {!hanyaPembelian && (
            <button onClick={() => buka("penjualan")} disabled={sisa === 0} className="flex-1 rounded-xl btn-gradient px-4 py-2.5 text-sm font-semibold disabled:opacity-50">
              Struk Penjualan
            </button>
          )}
          <button
            onClick={() => buka("pembelian")}
            disabled={sisa === 0}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50 ${
              hanyaPembelian ? "btn-gradient" : "border-2 border-primary text-primary"
            }`}
          >
            Struk Pembelian
          </button>
        </div>
      ) : (
        <Link to="/profil?tab=paket" className="mt-4 flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-500">
          <Lock className="w-4 h-4" /> {lockedMessage("pro")}
        </Link>
      )}
      <canvas ref={canvasRef} className="hidden" />

      {modalKamera && (
        <Lapisan className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">Scan Struk {jenis === "penjualan" ? "Penjualan" : "Pembelian"}</h3>
              <button onClick={tutup} className="text-sm text-gray-500 hover:text-gray-800">
                Tutup
              </button>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="w-full bg-black rounded-lg overflow-hidden aspect-[3/4] sm:aspect-video relative flex items-center justify-center">
                {foto ? (
                  <img src={foto} alt="Hasil foto struk" className="w-full h-full object-contain" />
                ) : (
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                )}
                {errorKamera && !foto && (
                  <div className="absolute inset-x-4 top-4 rounded bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{errorKamera}</div>
                )}
              </div>
              <div className="mt-4 flex justify-center gap-3">
                {!foto && (
                  <button
                    onClick={ambilFoto}
                    disabled={!kameraAktif}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4" /> Ambil Foto
                  </button>
                )}
                {foto && (
                  <button onClick={() => setFoto(null)} className="rounded-full border bg-white px-4 py-2 text-sm">
                    Ulangi
                  </button>
                )}
                <button onClick={analisis} disabled={menganalisis} className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60">
                  {menganalisis ? "Menganalisis..." : foto ? "Analisis Struk" : "Pakai Struk Contoh"}
                </button>
              </div>
              <p className="mt-2 text-center text-[11px] text-gray-500">Setiap analisis memakai 1 token scan struk.</p>
            </div>
          </div>
        </Lapisan>
      )}

      {data && (
        <Lapisan className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">Konfirmasi Isi Struk {jenis === "pembelian" ? "Pembelian" : "Penjualan"}</h3>
              <button onClick={() => setData(null)} className="text-sm text-gray-500 hover:text-gray-800">
                Batal
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
              {jenis === "pembelian" && (
                <p className="text-xs text-gray-500">Baris yang dicocokkan ke bahan baku akan menambah stok persediaan sesuai jumlahnya.</p>
              )}
              {data.map((item, i) => {
                const b = item.bahanId ? getBahan(item.bahanId) : undefined;
                return (
                  <div key={i} className="flex flex-wrap gap-2 items-center rounded-xl border p-2">
                    <input
                      value={item.name}
                      onChange={(e) => {
                        const cocok = jenis === "pembelian" ? cocokkanBahan(e.target.value) : undefined;
                        ubahItem(i, { name: e.target.value, ...(cocok && !item.bahanId ? { bahanId: cocok.id } : {}) });
                      }}
                      className="border rounded-lg px-3 py-2 flex-1 min-w-[140px] text-sm"
                      placeholder="Nama barang"
                    />
                    {jenis === "pembelian" && (
                      <select value={item.bahanId} onChange={(e) => ubahItem(i, { bahanId: e.target.value })} className="border rounded-lg px-2 py-2 text-sm w-44">
                        <option value="">Bukan bahan baku</option>
                        {bahan.map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.nama}
                          </option>
                        ))}
                      </select>
                    )}
                    <span className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        value={item.qty}
                        onChange={(e) => ubahItem(i, { qty: Number(e.target.value) })}
                        className="border rounded-lg px-2 py-2 w-20 text-sm text-right"
                        aria-label="Jumlah"
                      />
                      <span className="text-xs text-gray-500 w-10">{b?.satuan ?? "pcs"}</span>
                    </span>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => ubahItem(i, { price: Number(e.target.value) })}
                      className="border rounded-lg px-3 py-2 w-32 text-sm text-right"
                      placeholder="Total harga"
                      aria-label="Total harga"
                    />
                    <button onClick={() => setData(data.filter((_, j) => j !== i))} className="text-red-500 px-2" aria-label="Hapus">
                      ✕
                    </button>
                  </div>
                );
              })}
              <button onClick={() => setData([...data, { name: "", price: 0, qty: 1, bahanId: "" }])} className="text-sm font-medium text-primary">
                + Tambah barang
              </button>
              <div className="pt-3 border-t flex justify-between font-bold">
                <span>Total</span>
                <span>{formatRp(data.reduce((s, i) => s + (Number(i.price) || 0), 0))}</span>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button onClick={simpan} className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white">
                Catat sebagai Jurnal
              </button>
            </div>
          </div>
        </Lapisan>
      )}
    </div>
  );
});

export default ScanStruk;
