// Endpoint scan struk: foto struk -> daftar barang (nama, qty, total harga) via Gemini.
// Dipakai dua tempat: Vercel Function (file ini otomatis jadi /api/scan-struk)
// dan server Express lokal (src/server/index.js).

// Flash-Lite: model Gemini termurah yang tetap bisa membaca gambar & keluaran JSON
const MODEL_DEFAULT = "gemini-2.5-flash-lite";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const MAKS_KATALOG = 60;
const MAKS_FOTO = 4_000_000; // panjang data URL, batas body Vercel 4,5 MB

const skema = {
  type: "OBJECT",
  properties: {
    items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          qty: { type: "NUMBER" },
          // teks apa adanya: model sering membaca "112.500" sebagai 112,5
          price: { type: "STRING" },
        },
        required: ["name", "qty", "price"],
      },
    },
  },
  required: ["items"],
};

// "112.500" / "Rp 112.500,00" -> 112500 (titik & koma Rupiah = pemisah ribuan, sen dibuang)
const keRupiah = (teks) => Number(String(teks ?? "").replace(/[.,]\d{1,2}$/, "").replace(/\D/g, "")) || 0;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: "GEMINI_API_KEY belum diset di server." });

  const { foto, jenis, katalog } = req.body ?? {};
  const cocok = typeof foto === "string" && foto.length <= MAKS_FOTO && /^data:(image\/[a-z+]+);base64,(.+)$/.exec(foto);
  if (!cocok) return res.status(400).json({ error: "Foto struk tidak valid atau terlalu besar." });

  const daftar = Array.isArray(katalog) ? katalog.filter((x) => typeof x === "string").slice(0, MAKS_KATALOG) : [];
  // Prompt dibuat singkat agar token input hemat
  const prompt =
    `Baca foto struk ${jenis === "penjualan" ? "penjualan" : "pembelian"} ini. ` +
    "Kembalikan setiap baris barang: name, qty (jumlah), price (total harga baris, salin persis seperti tertulis; titik adalah pemisah ribuan). " +
    "Abaikan subtotal, total, pajak, kembalian, dan baris yang bukan barang. " +
    (daftar.length ? `Bila barang sama dengan nama di katalog, pakai nama katalog persis. Katalog: ${daftar.join("; ")}. ` : "") +
    "Bila gambar bukan struk, kembalikan items kosong.";

  try {
    const r = await fetch(`${BASE_URL}/models/${process.env.GEMINI_MODEL || MODEL_DEFAULT}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ parts: [{ inline_data: { mime_type: cocok[1], data: cocok[2] } }, { text: prompt }] }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
          responseSchema: skema,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      console.error("Gemini error:", data);
      const pesan = r.status === 429 ? "Kuota Gemini sedang penuh, coba lagi sebentar." : data?.error?.message || "Gemini error";
      return res.status(r.status).json({ error: pesan });
    }

    const teks = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{"items":[]}';
    const items = (JSON.parse(teks).items ?? [])
      .map((i) => ({ name: String(i.name ?? "").trim(), qty: Number(i.qty) || 1, price: keRupiah(i.price) }))
      .filter((i) => i.name);
    res.status(200).json({ items, token: data.usageMetadata?.totalTokenCount });
  } catch (err) {
    console.error("Scan struk error:", err);
    res.status(500).json({ error: "Gagal membaca struk." });
  }
}
