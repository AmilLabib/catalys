import { useEffect, useMemo, useState } from "react";
import { fetchMarketPricing } from "../utils/pricing";
import { usePageTitle } from "../hooks/usePageTitle";
import { useDemoMode } from "../context/DemoModeContext";
import {
  BarChart3,
  Image as ImageIcon,
  Sparkles,
  Minus,
  Plus,
  RefreshCw,
} from "lucide-react";

type FormState = {
  productName: string;
  cogs: number | "";
  monthlyFixed: number | "";
  estMonthlySales: number | "";
};

type ScenarioKey = "baseline" | "optimistic" | "conservative";

const initialState: FormState = {
  productName: "",
  cogs: "",
  monthlyFixed: "",
  estMonthlySales: "",
};

function formatCurrency(n: number) {
  // Format numbers as Indonesian Rupiah, no fractional digits
  return n.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });
}

function roundTo(n: number, step: number) {
  if (step <= 0) return n;
  return Math.round(n / step) * step;
}

function safeNumber(n: number | "") {
  return n === "" ? null : Number(n);
}

function Stepper({
  onDec,
  onInc,
  disabled,
}: {
  onDec: () => void;
  onInc: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onDec}
        disabled={disabled}
        className="p-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
        aria-label="Decrease"
      >
        <Minus className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onInc}
        disabled={disabled}
        className="p-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
        aria-label="Increase"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function SmartPricing() {
  usePageTitle("Smart Pricing");
  const { demoRunId } = useDemoMode();
  const [form, setForm] = useState<FormState>(initialState);
  const [scenario, setScenario] = useState<ScenarioKey>("baseline");
  const [market, setMarket] = useState<{
    average: number;
    lowest: number;
    highest: number;
  } | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const priceStep = 500;
  const fixedStep = 50_000;
  const salesStep = 10;

  const presets = useMemo(
    () =>
      ({
        baseline: { label: "Baseline", avgFactor: 1.0, marginTarget: 0.2 },
        optimistic: {
          label: "Optimistic",
          avgFactor: 1.08,
          marginTarget: 0.25,
        },
        conservative: {
          label: "Conservative",
          avgFactor: 0.94,
          marginTarget: 0.15,
        },
      }) satisfies Record<
        ScenarioKey,
        {
          label: string;
          avgFactor: number;
          marginTarget: number;
        }
      >,
    [],
  );

  const handleChange = (k: keyof FormState, v: string) => {
    if (k === "productName") setForm((s) => ({ ...s, [k]: v }));
    else {
      const num = v === "" ? "" : Number(v);
      setForm((s) => ({ ...s, [k]: Number.isNaN(num) ? "" : num }));
    }
  };

  const breakEvenPerUnit = (): number | null => {
    const { cogs, monthlyFixed, estMonthlySales } = form;
    if (
      cogs === "" ||
      monthlyFixed === "" ||
      estMonthlySales === "" ||
      estMonthlySales === 0
    )
      return null;
    const totalVariable = Number(cogs);
    const allocFixedPerUnit = Number(monthlyFixed) / Number(estMonthlySales);
    return Math.max(0, totalVariable + allocFixedPerUnit);
  };

  const computeRecommendation = (marketAvg: number, breakEven: number) => {
    // Simple strategy:
    // - If market average is well above break-even, recommend between avg and highest (conservative)
    // - If market average near break-even, recommend small premium (10-20%) over break-even
    // - If market average below break-even, recommend price at break-even and suggest cost reduction
    const marginTarget = presets[scenario].marginTarget;
    if (marketAvg >= breakEven * 1.25) {
      // market can bear premium
      const recommended = Math.min(
        marketAvg * 1.02,
        breakEven * (1 + marginTarget) + (marketAvg - breakEven) * 0.5,
      );
      return Math.round(recommended);
    }
    if (marketAvg >= breakEven * 0.95) {
      // near market avg: small premium over break-even
      const recommended = Math.max(breakEven * 1.12, marketAvg);
      return Math.round(recommended);
    }
    // market lower than break-even
    return Math.round(breakEven);
  };

  const handleFetchMarket = async () => {
    if (!form.productName) return;
    setLoading(true);
    setImageUrl(null);

    console.groupCollapsed(`[SmartPricing] Fetch start: "${form.productName}"`);
    console.log("[SmartPricing] Step 1/6 - Init fetch flow");

    const SERPER_API_KEY = import.meta.env.VITE_SERPER_API_KEY || "";

    let dataPencarian = "";
    let linkGambar: string | null = null;

    try {
      console.log("[SmartPricing] Step 2/6 - Validate Serper API key");
      if (!SERPER_API_KEY) {
        throw new Error("VITE_SERPER_API_KEY belum di-set");
      }

      console.log("[Serper] Text search request -> /search");
      const resTeks = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": SERPER_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: `harga ${form.productName}`,
          gl: "id",
          hl: "id",
        }),
      });

      if (!resTeks.ok) {
        const errorText = await resTeks.text();
        console.error("[Serper] Text search failed", {
          status: resTeks.status,
          body: errorText,
        });
        throw new Error(
          `Serper text search failed: ${resTeks.status} ${errorText}`,
        );
      }

      const dataTeks = await resTeks.json();
      const organicCount = Array.isArray(dataTeks?.organic)
        ? dataTeks.organic.length
        : 0;
      console.log("[Serper] Text search success", { organicCount });

      if (Array.isArray(dataTeks?.organic) && dataTeks.organic.length > 0) {
        dataPencarian = dataTeks.organic
          .map((item: any) => item?.snippet || item?.title || "")
          .filter(Boolean)
          .join("\n");
      }

      // Fallback kandidat image dari /search jika ada
      if (Array.isArray(dataTeks?.images) && dataTeks.images.length > 0) {
        const img = dataTeks.images[0];
        linkGambar = img?.imageUrl || img?.thumbnailUrl || img?.link || null;
        console.log("[Image] Candidate from /search", { linkGambar });
      }

      console.log("[Serper] Image search request -> /images");
      const resImage = await fetch("https://google.serper.dev/images", {
        method: "POST",
        headers: {
          "X-API-KEY": SERPER_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: form.productName,
          gl: "id",
          hl: "id",
        }),
      });

      if (!resImage.ok) {
        const errorText = await resImage.text();
        console.warn("[Serper] Image search failed", {
          status: resImage.status,
          body: errorText,
        });
      } else {
        const dataImage = await resImage.json();
        const imageList = Array.isArray(dataImage?.images)
          ? dataImage.images
          : [];
        console.log("[Serper] Image search success", {
          imageCount: imageList.length,
        });

        if (imageList.length > 0) {
          const picked = imageList
            .map(
              (img: any) =>
                img?.imageUrl ||
                img?.thumbnailUrl ||
                img?.link ||
                img?.sourceUrl,
            )
            .find(Boolean);

          if (picked) {
            linkGambar = picked;
            console.log("[Image] Candidate selected from /images", {
              linkGambar,
            });
          }
        }
      }
    } catch (err) {
      console.warn("[Serper] Gagal mengambil data dari Serper API:", err);
    }

    let finalParsed: any = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts && !finalParsed) {
      attempts++;
      try {
        console.log(
          `[Claude] Step 3/6 - Attempt ${attempts}/${maxAttempts} request`,
        );

        const prompt = `Gua butuh lu nganalisis harga wajar produk: "${String(
          form.productName,
        ).replace(/\"/g, '\\"')}".

Ini ada data mentah hasil pencarian dari Google:
${dataPencarian}

Tolong baca teks tersebut, buang harga yang nggak masuk akal, dan simpulkan berapa rata-rata harga wajarnya di pasaran.

ATURAN MUTLAK:
1. WAJIB menggunakan struktur key JSON persis seperti ini:
{
  "average": <angka harga rata-rata>,
  "lowest": <angka harga terendah>,
  "highest": <angka harga tertinggi>
}
2. DILARANG MERUBAH NAMA KEY (jangan gunakan "min", "max", dll).
3. Harga dalam nominal angka penuh Rupiah (contoh: 55000, bukan 55).`;

        const res = await fetch("/anthropic/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": import.meta.env.VITE_CLAUDE_API_KEY || "",
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1024,
            messages: [
              { role: "user", content: prompt },
              { role: "assistant", content: "{" },
            ],
          }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error("[Claude] API failed", {
            status: res.status,
            body: errorText,
            attempt: attempts,
          });
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }

        const response = await res.json();

        const assistantReply =
          "{" +
          (response?.content?.[0]?.type === "text"
            ? response.content[0].text
            : "");

        console.log(
          `[Claude] Raw response attempt ${attempts}:`,
          assistantReply,
        );

        let parsed: any = null;
        try {
          const endIndex = assistantReply.lastIndexOf("}");
          const cleanJson = assistantReply.substring(0, endIndex + 1);
          parsed = JSON.parse(cleanJson);
          console.log(`[Claude] Parsed JSON attempt ${attempts}:`, parsed);
        } catch (e) {
          console.warn(
            `[Claude] JSON.parse gagal attempt ${attempts}, coba regex fallback`,
          );

          const avgMatch = assistantReply.match(/"average"\s*:\s*(\d+)/i);
          const lowMatch = assistantReply.match(/"lowest"\s*:\s*(\d+)/i);
          const highMatch = assistantReply.match(/"highest"\s*:\s*(\d+)/i);

          if (avgMatch || lowMatch || highMatch) {
            parsed = {
              average: avgMatch ? Number(avgMatch[1]) : 0,
              lowest: lowMatch ? Number(lowMatch[1]) : 0,
              highest: highMatch ? Number(highMatch[1]) : 0,
            };
            console.log(
              `[Claude] Parsed via regex attempt ${attempts}:`,
              parsed,
            );
          } else {
            console.error("[Claude] Regex extraction gagal", {
              attempt: attempts,
              assistantReply,
            });
          }
        }

        if (parsed && (parsed.average || parsed.lowest || parsed.highest)) {
          if (parsed.average > 0 && parsed.average < 1000)
            parsed.average *= 1000;
          if (parsed.lowest > 0 && parsed.lowest < 1000) parsed.lowest *= 1000;
          if (parsed.highest > 0 && parsed.highest < 1000)
            parsed.highest *= 1000;
        }

        if (parsed && (parsed.average || parsed.lowest || parsed.highest)) {
          finalParsed = parsed;
          console.log("[Claude] Step 4/6 - Final parsed pricing acquired", {
            finalParsed,
          });
        }
      } catch (err) {
        console.warn(`[Claude] Fetch attempt ${attempts} failed:`, err);
      }
    }

    if (
      finalParsed &&
      (finalParsed.average || finalParsed.lowest || finalParsed.highest)
    ) {
      const m = {
        average: Number(finalParsed.average) || 0,
        lowest: Number(finalParsed.lowest) || 0,
        highest: Number(finalParsed.highest) || 0,
      };
      setMarket(m);

      if (linkGambar) {
        setImageUrl(linkGambar);
        console.log("[Image] Step 5/6 - Image set from Serper", { linkGambar });
      } else {
        const fallbackUrl = `https://placehold.co/400x400?text=${encodeURIComponent(
          form.productName || "No Image",
        )}`;
        setImageUrl(fallbackUrl);
        console.warn("[Image] Step 5/6 - No image from Serper, use fallback", {
          fallbackUrl,
        });
      }

      setLoading(false);
      console.log("[SmartPricing] Step 6/6 - Completed with Claude pricing");
      console.groupEnd();
      return;
    }

    console.warn("[Fallback] Claude parsing gagal, pakai mock pricing");
    const m = await fetchMarketPricing(form.productName);
    setMarket(m);

    const fallbackUrl = `https://placehold.co/400x400?text=${encodeURIComponent(
      form.productName || "No Image",
    )}`;
    setImageUrl(linkGambar || fallbackUrl);

    setLoading(false);
    console.log("[SmartPricing] Completed with fallback market pricing", {
      market: m,
      image: linkGambar || fallbackUrl,
    });
    console.groupEnd();
  };

  const handleDemoIcedTea = async () => {
    // Fill with reasonable demo values for 'Ice Tea'
    setForm({
      productName: "Ice Tea",
      cogs: 2500,
      monthlyFixed: 1200000,
      estMonthlySales: 800,
    });

    setLoading(true);
    // Use deterministic demo market numbers (in IDR)
    const demoMarket = { average: 8000, lowest: 6500, highest: 12000 };
    // image lives in public/ice-tea.png
    setMarket(demoMarket);
    setImageUrl("/ice-tea.png");
    setLoading(false);
  };

  // Navbar Demo Mode integration: trigger the Ice Tea demo on demand.
  useEffect(() => {
    if (!demoRunId) return;
    void handleDemoIcedTea();
  }, [demoRunId]);

  const breakEven = breakEvenPerUnit();

  const cogsNum = safeNumber(form.cogs);
  const fixedNum = safeNumber(form.monthlyFixed);
  const salesNum = safeNumber(form.estMonthlySales);

  const isValid = {
    productName: form.productName.trim().length > 0,
    cogs: cogsNum !== null && cogsNum >= 0,
    monthlyFixed: fixedNum !== null && fixedNum >= 0,
    estMonthlySales: salesNum !== null && salesNum > 0,
  };

  const effectiveMarket = useMemo(() => {
    if (!market) return null;
    const f = presets[scenario].avgFactor;
    return {
      average: Math.max(0, Math.round(market.average * f)),
      lowest: market.lowest,
      highest: market.highest,
    };
  }, [market, presets, scenario]);

  let recommendedPrice: number | null = null;
  let profitMarginPct: number | null = null;
  let rationale =
    "Provide product details and fetch market data to get a recommendation.";

  const recAndMargin = useMemo(() => {
    if (!effectiveMarket || breakEven === null) return null;
    const rec = computeRecommendation(effectiveMarket.average, breakEven);
    const c = cogsNum ?? 0;
    const marginPct = rec !== 0 ? ((rec - c) / rec) * 100 : null;
    const profitPerUnit = rec - c;
    const profitPerMonth = salesNum ? profitPerUnit * salesNum : null;
    return {
      recommended: rec,
      marginPct: marginPct === null ? null : Math.round(marginPct * 100) / 100,
      profitPerUnit,
      profitPerMonth,
    };
  }, [effectiveMarket, breakEven, cogsNum, salesNum]);

  if (effectiveMarket && breakEven !== null) {
    recommendedPrice =
      recAndMargin?.recommended ??
      computeRecommendation(effectiveMarket.average, breakEven);

    // Ensure no division by zero and compute margin as %
    if (recommendedPrice && Number(form.cogs) >= 0 && recommendedPrice !== 0) {
      profitMarginPct =
        Math.round(
          ((recommendedPrice - Number(form.cogs)) / recommendedPrice) * 10000,
        ) / 100;
    } else {
      profitMarginPct = null;
    }

    if (effectiveMarket.average >= breakEven * 1.25) {
      rationale = `Market average (${formatCurrency(Math.round(effectiveMarket.average))}) is well above your break-even (${formatCurrency(Math.round(breakEven))}). We recommend a competitive premium while testing elasticity.`;
    } else if (effectiveMarket.average >= breakEven * 0.95) {
      rationale = `Market average (${formatCurrency(Math.round(effectiveMarket.average))}) is near your break-even. Recommend a modest margin and monitor conversions.`;
    } else {
      rationale = `Market prices (${formatCurrency(Math.round(effectiveMarket.lowest))} - ${formatCurrency(Math.round(effectiveMarket.highest))}) are below your break-even (${formatCurrency(Math.round(breakEven))}). Consider reducing COGS or lowering fixed costs before pricing above break-even.`;
    }
  }

  const comparison = useMemo(() => {
    if (!effectiveMarket || breakEven === null || recommendedPrice === null)
      return null;
    const max = Math.max(
      effectiveMarket.highest,
      effectiveMarket.average,
      recommendedPrice,
    );
    const min = Math.min(
      effectiveMarket.lowest,
      effectiveMarket.average,
      recommendedPrice,
      breakEven,
    );
    const span = Math.max(1, max - min);
    const pct = (v: number) => ((v - min) / span) * 100;
    return {
      min,
      max,
      breakEvenPct: pct(breakEven),
      avgPct: pct(effectiveMarket.average),
      recPct: pct(recommendedPrice),
    };
  }, [effectiveMarket, breakEven, recommendedPrice]);

  const sensitivity = useMemo(() => {
    if (!effectiveMarket || breakEven === null) return null;
    const avg = effectiveMarket.average;
    const variants = [
      { key: "-10%", avg: avg * 0.9 },
      { key: "Base", avg },
      { key: "+10%", avg: avg * 1.1 },
    ] as const;
    return variants.map((v) => {
      const rec = computeRecommendation(v.avg, breakEven);
      const c = cogsNum ?? 0;
      const marginPct = rec !== 0 ? ((rec - c) / rec) * 100 : null;
      return {
        label: v.key,
        recommended: rec,
        marginPct: marginPct === null ? null : Math.round(marginPct * 10) / 10,
      };
    });
  }, [breakEven, cogsNum, computeRecommendation, effectiveMarket]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="rounded-3xl border bg-white p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-2xl md:text-3xl font-extrabold">
                Smart Pricing Engine
              </h2>
            </div>
            <p className="text-gray-600 mt-1">
              Dapatkan rekomendasi harga berdasarkan biaya dan snapshot harga
              pasar.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setForm(initialState);
                setMarket(null);
                setImageUrl(null);
              }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm"
            >
              <RefreshCw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>

        {/* Product Search Bar */}
        <div className="mt-8 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                value={form.productName}
                onChange={(e) => handleChange("productName", e.target.value)}
                placeholder="Masukkan nama produk... (e.g. Es Teh Manis)"
                className="w-full rounded-2xl border-2 border-gray-200 bg-white pl-4 pr-4 py-3 md:py-4 text-lg outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all shadow-sm"
              />
            </div>
            <button
              type="button"
              onClick={handleFetchMarket}
              disabled={!isValid.productName || loading}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 md:py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:opacity-90 disabled:opacity-60 font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
            >
              <Sparkles className="w-5 h-5" />
              {loading ? "Mengambil data..." : "Ambil Data Pasar"}
            </button>
          </div>
        </div>

        {/* Clean Market Snapshot */}
        {market && (
          <div className="mb-8 flex flex-col md:flex-row items-center gap-8 p-6 md:p-8 rounded-[2rem] bg-gradient-to-br from-indigo-50/50 via-white to-cyan-50/50 border border-gray-100 shadow-sm">
            <div className="w-full md:w-1/3 aspect-square relative rounded-[2rem] overflow-hidden shadow-md border-4 border-white bg-white">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={form.productName || "Product"}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  onError={(e) => {
                    // Fallback jika URL gambar dari AI error/404, gunakan placehold.co yang lebih reliable
                    const fallbackUrl = `https://placehold.co/400x400?text=${encodeURIComponent(
                      form.productName || "Image Error",
                    )}`;
                    if (e.currentTarget.src !== fallbackUrl) {
                      e.currentTarget.src = fallbackUrl;
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                  <ImageIcon className="w-16 h-16 mb-2 opacity-50" />
                  <span className="text-sm font-bold uppercase tracking-widest opacity-60">
                    No Image
                  </span>
                </div>
              )}
            </div>
            <div className="w-full md:w-2/3 flex flex-col gap-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold text-gray-900">
                    Market Snapshot
                  </h3>
                  <p className="text-gray-500 capitalize tracking-wider text-sm font-medium">
                    {form.productName || "Produk"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 w-full">
                <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100 flex flex-col justify-center">
                  <span className="text-xs font-bold text-gray-400 uppercase mb-1">
                    Terendah
                  </span>
                  <span className="text-lg md:text-xl font-bold text-gray-800">
                    {formatCurrency(market.lowest)}
                  </span>
                </div>
                <div className="bg-primary text-white rounded-2xl p-5 md:p-6 shadow-md transform sm:-translate-y-2 flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                  <span className="text-xs font-bold text-primary-100 uppercase mb-1">
                    Rata-rata
                  </span>
                  <span className="text-2xl md:text-3xl font-black">
                    {formatCurrency(market.average)}
                  </span>
                </div>
                <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100 flex flex-col justify-center">
                  <span className="text-xs font-bold text-gray-400 uppercase mb-1">
                    Tertinggi
                  </span>
                  <span className="text-lg md:text-xl font-bold text-gray-800">
                    {formatCurrency(market.highest)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl border bg-gray-50/50 p-5 card-hover">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="text-sm font-medium text-gray-700">
                  Scenario
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(Object.keys(presets) as ScenarioKey[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setScenario(k)}
                      className={`px-3 py-1.5 rounded-xl border text-sm transition-colors ${
                        scenario === k
                          ? "bg-primary text-white border-primary"
                          : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      {presets[k].label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Mengubah asumsi market average & target margin untuk
                  eksplorasi cepat.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  COGS / unit (Rp)
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="number"
                    value={form.cogs}
                    onChange={(e) => handleChange("cogs", e.target.value)}
                    min={0}
                    step={priceStep}
                    className="w-full rounded-xl border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <Stepper
                    disabled={form.cogs === ""}
                    onDec={() =>
                      setForm((s) => ({
                        ...s,
                        cogs:
                          s.cogs === ""
                            ? ""
                            : Math.max(
                                0,
                                roundTo(Number(s.cogs) - priceStep, priceStep),
                              ),
                      }))
                    }
                    onInc={() =>
                      setForm((s) => ({
                        ...s,
                        cogs:
                          s.cogs === ""
                            ? ""
                            : roundTo(Number(s.cogs) + priceStep, priceStep),
                      }))
                    }
                  />
                </div>
                {form.cogs !== "" && (
                  <div className="mt-2">
                    <input
                      type="range"
                      min={0}
                      max={50_000}
                      step={priceStep}
                      value={Number(form.cogs)}
                      onChange={(e) => handleChange("cogs", e.target.value)}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[11px] text-gray-500">
                      <span>0</span>
                      <span>50k</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Fixed costs / month (Rp)
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="number"
                    value={form.monthlyFixed}
                    onChange={(e) =>
                      handleChange("monthlyFixed", e.target.value)
                    }
                    min={0}
                    step={fixedStep}
                    className="w-full rounded-xl border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <Stepper
                    disabled={form.monthlyFixed === ""}
                    onDec={() =>
                      setForm((s) => ({
                        ...s,
                        monthlyFixed:
                          s.monthlyFixed === ""
                            ? ""
                            : Math.max(
                                0,
                                roundTo(
                                  Number(s.monthlyFixed) - fixedStep,
                                  fixedStep,
                                ),
                              ),
                      }))
                    }
                    onInc={() =>
                      setForm((s) => ({
                        ...s,
                        monthlyFixed:
                          s.monthlyFixed === ""
                            ? ""
                            : roundTo(
                                Number(s.monthlyFixed) + fixedStep,
                                fixedStep,
                              ),
                      }))
                    }
                  />
                </div>
                {form.monthlyFixed !== "" && (
                  <div className="mt-2">
                    <input
                      type="range"
                      min={0}
                      max={50_000_000}
                      step={fixedStep}
                      value={Number(form.monthlyFixed)}
                      onChange={(e) =>
                        handleChange("monthlyFixed", e.target.value)
                      }
                      className="w-full"
                    />
                    <div className="flex justify-between text-[11px] text-gray-500">
                      <span>0</span>
                      <span>50jt</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Estimated sales / month (units)
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="number"
                    value={form.estMonthlySales}
                    onChange={(e) =>
                      handleChange("estMonthlySales", e.target.value)
                    }
                    min={0}
                    step={salesStep}
                    className="w-full rounded-xl border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <Stepper
                    disabled={form.estMonthlySales === ""}
                    onDec={() =>
                      setForm((s) => ({
                        ...s,
                        estMonthlySales:
                          s.estMonthlySales === ""
                            ? ""
                            : Math.max(
                                0,
                                roundTo(
                                  Number(s.estMonthlySales) - salesStep,
                                  salesStep,
                                ),
                              ),
                      }))
                    }
                    onInc={() =>
                      setForm((s) => ({
                        ...s,
                        estMonthlySales:
                          s.estMonthlySales === ""
                            ? ""
                            : roundTo(
                                Number(s.estMonthlySales) + salesStep,
                                salesStep,
                              ),
                      }))
                    }
                  />
                </div>
                {form.estMonthlySales !== "" && (
                  <div className="mt-2">
                    <input
                      type="range"
                      min={0}
                      max={5_000}
                      step={salesStep}
                      value={Number(form.estMonthlySales)}
                      onChange={(e) =>
                        handleChange("estMonthlySales", e.target.value)
                      }
                      className="w-full"
                    />
                    <div className="flex justify-between text-[11px] text-gray-500">
                      <span>0</span>
                      <span>5k</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 card-hover">
            <h4 className="font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> Quick KPIs
            </h4>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Break-even / unit</span>
                <span className="font-semibold">
                  {breakEven === null ? "—" : formatCurrency(breakEven)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Recommended price</span>
                <span className="font-semibold text-primary">
                  {recommendedPrice === null
                    ? "—"
                    : formatCurrency(recommendedPrice)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Margin</span>
                <span className="font-semibold">
                  {profitMarginPct === null ? "—" : `${profitMarginPct}%`}
                </span>
              </div>
              {recAndMargin?.profitPerMonth !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Profit / month</span>
                  <span className="font-semibold">
                    {formatCurrency(
                      Math.round(recAndMargin?.profitPerMonth ?? 0),
                    )}
                  </span>
                </div>
              )}

              {sensitivity && (
                <div className="pt-3 mt-3 border-t">
                  <p className="text-xs font-semibold text-gray-600 mb-2">
                    Sensitivity (market avg)
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {sensitivity.map((s) => (
                      <div
                        key={s.label}
                        className="rounded-xl border bg-gray-50 p-2"
                      >
                        <p className="text-[11px] text-gray-500">{s.label}</p>
                        <p className="text-xs font-semibold text-gray-900">
                          {formatCurrency(s.recommended)}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {s.marginPct === null
                            ? "—"
                            : `${s.marginPct}% margin`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5 rounded-2xl border bg-gradient-to-b from-gray-50 to-white p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h4 className="font-semibold">Break-even per unit</h4>
              </div>
              <span className="text-xs text-gray-500">minimum price</span>
            </div>
            <p className="text-3xl mt-3 font-extrabold text-primary">
              {breakEven === null ? "—" : formatCurrency(breakEven)}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Titik aman agar tiap penjualan tidak merugi setelah alokasi biaya
              tetap.
            </p>
          </div>

          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="rounded-2xl border bg-white p-5 card-hover flex-1">
              <h5 className="font-semibold">Recommendation</h5>
              {recommendedPrice === null ? (
                <p className="text-sm text-gray-500 mt-3">
                  Lengkapi input dan ambil data pasar untuk melihat rekomendasi.
                </p>
              ) : (
                <div className="mt-3">
                  <p className="text-3xl font-extrabold text-primary">
                    {formatCurrency(recommendedPrice)}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                    <span>Projected profit margin:</span>
                    <span className="font-semibold text-gray-900">
                      {profitMarginPct}%
                    </span>
                  </div>
                  <div className="mt-3 rounded-xl border bg-gray-50 p-3 text-sm text-gray-700">
                    {rationale}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {comparison && (
          <div className="mt-6 rounded-2xl border bg-white p-5 card-hover">
            <h4 className="font-semibold">Price Positioning</h4>
            <p className="text-sm text-gray-500 mt-1">
              Bandingkan break-even, market average, dan rekomendasi pada satu
              skala.
            </p>
            <div className="mt-4 relative h-3 rounded-full bg-gray-100 border overflow-hidden">
              <div
                className="absolute top-0 bottom-0 w-1 bg-gray-700"
                style={{ left: `${comparison.breakEvenPct}%` }}
                title="Break-even"
              />
              <div
                className="absolute top-0 bottom-0 w-1 bg-primary"
                style={{ left: `${comparison.avgPct}%` }}
                title="Market average"
              />
              <div
                className="absolute top-0 bottom-0 w-1 bg-emerald-600"
                style={{ left: `${comparison.recPct}%` }}
                title="Recommendation"
              />
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
              <div className="rounded-xl border bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Break-even</p>
                <p className="font-semibold">
                  {formatCurrency(Math.round(breakEven ?? 0))}
                </p>
              </div>
              <div className="rounded-xl border bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Market avg</p>
                <p className="font-semibold">
                  {formatCurrency(Math.round(market?.average ?? 0))}
                </p>
              </div>
              <div className="rounded-xl border bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Recommended</p>
                <p className="font-semibold text-emerald-700">
                  {formatCurrency(Math.round(recommendedPrice ?? 0))}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
