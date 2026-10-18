import { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import { usePageTitle } from "../hooks/usePageTitle";
import {
  Search,
  MapPin,
  Navigation,
  Sparkles,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
} from "lucide-react";

// --- EXISTING MAP DATA ---
interface TooltipData {
  x: number;
  y: number;
  provinceName: string;
  distributors: string[];
  keterangan: {
    jenisBarang: string;
    skala: string;
  };
}

const distributorsByProvince: Record<string, string[]> = {
  Aceh: ["PT. Distribusi Sabang", "CV. Aceh Maju"],
  "Sumatera Utara": ["PT. Lintas Medan", "CV. Logistik Danau Toba"],
  "Sumatera Barat": ["UD. Minang Jaya", "CV. Padang Logistik"],
  Riau: ["PT. Riau Mandiri", "CV. Dumai Express"],
  "Kepulauan Riau": ["CV. Batam Center", "UD. Bintan Logistik"],
  Jambi: ["PT. Jambi Sejahtera", "CV. Muaro Jambi"],
  "Sumatera Selatan": ["CV. Sriwijaya Distribusi", "UD. Palembang Jaya"],
  Bengkulu: ["CV. Bengkulu Indah", "UD. Rejang Lebong"],
  Lampung: ["PT. Lampung Express", "CV. Krakatau Logistik"],
  "Bangka Belitung": ["UD. Timah Logistik", "CV. Bangka Belitung"],
  "Kepulauan Bangka Belitung": ["UD. Belitung Indah", "CV. Pangkal Pinang"],
  "DKI Jakarta": ["PT. Mega Distribusi Jakarta", "CV. Batavia Logistik"],
  "Jawa Barat": ["CV. Bandung Express", "UD. Priangan Jaya"],
  "Jawa Tengah": ["PT. Semar Logistik", "CV. Borobudur Distribusi"],
  "DI Yogyakarta": ["UD. Mataram Logistik", "CV. Jogja Istimewa"],
  "Jawa Timur": ["PT. Bromo Logistik", "CV. Surabaya Distribusi"],
  Banten: ["UD. Banten Jaya", "CV. Krakatau Express"],
  Bali: ["PT. Dewata Logistik", "CV. Bali Makmur"],
  "Nusa Tenggara Barat": ["UD. Rinjani Distribusi", "CV. Lombok Logistik"],
  "Nusa Tenggara Timur": ["PT. Komodo Express", "CV. Kupang Sejahtera"],
  "Kalimantan Barat": ["CV. Khatulistiwa Logistik", "UD. Pontianak Jaya"],
  "Kalimantan Tengah": ["PT. Palangkaraya Indah", "CV. Borneo Distribusi"],
  "Kalimantan Selatan": ["UD. Banjar Logistik", "CV. Martapura Jaya"],
  "Kalimantan Timur": ["PT. Mahakam Logistik", "CV. Balikpapan Express"],
  "Kalimantan Utara": ["UD. Tarakan Distribusi", "CV. Kaltara Logistik"],
  "Sulawesi Utara": ["PT. Minahasa Logistik", "CV. Manado Express"],
  "Sulawesi Tengah": ["UD. Palu Distribusi", "CV. Poso Jaya"],
  "Sulawesi Selatan": ["PT. Celebes Logistik", "CV. Makassar Express"],
  "Sulawesi Tenggara": ["UD. Kendari Distribusi", "CV. Buton Raya"],
  Gorontalo: ["PT. Gorontalo Logistik", "CV. Limboto Express"],
  "Sulawesi Barat": ["UD. Mamuju Distribusi", "CV. Majene Raya"],
  Maluku: ["PT. Ambon Logistik", "CV. Pattimura Express"],
  "Maluku Utara": ["UD. Ternate Distribusi", "CV. Halmahera Raya"],
  Papua: ["PT. Cendrawasih Logistik", "CV. Jayapura Express"],
  "Papua Barat": ["UD. Sorong Distribusi", "CV. Manokwari Raya"],
};

const getKeteranganTambahan = (provinsi: string) => {
  const infoSpesifik: Record<string, { jenisBarang: string; skala: string }> = {
    "DKI Jakarta": {
      jenisBarang: "FMCG, Elektronik, Tekstil",
      skala: "Nasional & Internasional",
    },
    "Jawa Timur": {
      jenisBarang: "Bahan Pokok, Manufaktur",
      skala: "Regional Jawa & Indonesia Timur",
    },
    "Jawa Barat": {
      jenisBarang: "Tekstil, Manufaktur, Makanan Ringan",
      skala: "Regional Jawa Barat & Nasional",
    },
    "Sumatera Utara": {
      jenisBarang: "Agrikultur, FMCG",
      skala: "Regional Sumatera",
    },
    "Sulawesi Selatan": {
      jenisBarang: "Hasil Laut, Bahan Pokok",
      skala: "Hub Indonesia Timur",
    },
  };
  return (
    infoSpesifik[provinsi] || {
      jenisBarang: "Barang Campuran Umum",
      skala: "Distribusi Lokal & Antar Kota",
    }
  );
};

const geoUrl =
  "https://raw.githubusercontent.com/superpikar/indonesia-geojson/master/indonesia-province-simple.json";

// --- NEW MOCK AI SEARCH DATA ---
type DistributorType = "Resto" | "KDMP" | "Toko Mebel" | "Mall";

interface SearchResult {
  id: number;
  name: string;
  type: DistributorType;
  location: string;
  province: string;
  city: string;
  lat: number;
  lng: number;
  socialMedia: string;
  avatarPlaceholder: string;
  imagePlaceholder: string;
  caption: string;
  likes: string;
}

const MOCK_DISTRIBUTORS: SearchResult[] = [
  // KOTA BOGOR
  {
    id: 1,
    name: "Resto Pecel Lele Si Doel",
    type: "Resto",
    location: "Kota Bogor, Jawa Barat",
    province: "Jawa Barat",
    city: "Kota Bogor",
    lat: -6.595038,
    lng: 106.816635,
    socialMedia: "pecellelesidoel_bogor",
    avatarPlaceholder: "bg-orange-500",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80",
    caption:
      "Porsi jumbo siap disajikan! Ikan lele dan ayam segar setiap hari dari supplier terbaik. 🐟🔥 #PecelLele #KulinerBogor #InfoBogor",
    likes: "1,245",
  },
  {
    id: 2,
    name: "KDMP Pasar Anyar Bogor",
    type: "KDMP",
    location: "Kota Bogor, Jawa Barat",
    province: "Jawa Barat",
    city: "Kota Bogor",
    lat: -6.584347,
    lng: 106.797274,
    socialMedia: "pasaranyar_bogorraya",
    avatarPlaceholder: "bg-emerald-600",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80",
    caption:
      "Stok sembako sayur mayur melimpah pagi ini bun! Siap diborong tengkulak. 🥬🥕🥔 #PasarAnyar #Bogor",
    likes: "830",
  },
  {
    id: 3,
    name: "Toko Mebel Kayu Jati Indah",
    type: "Toko Mebel",
    location: "Kota Bogor, Jawa Barat",
    province: "Jawa Barat",
    city: "Kota Bogor",
    lat: -6.6021,
    lng: 106.8012,
    socialMedia: "mebelindah_bogor",
    avatarPlaceholder: "bg-amber-700",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80",
    caption:
      "Set meja makan minimalis kayu jati asli Jepara. Promo akhir bulan! #MebelBogor #InteriorRumah #KayuJati",
    likes: "2,109",
  },

  // KOTA SURAKARTA
  {
    id: 4,
    name: "Warung Makan Nila Bakar Bengawan",
    type: "Resto",
    location: "Kota Surakarta, Jawa Tengah",
    province: "Jawa Tengah",
    city: "Kota Surakarta",
    lat: -7.556111,
    lng: 110.831667,
    socialMedia: "nilabengawan_solo",
    avatarPlaceholder: "bg-red-500",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?w=400&q=80",
    caption:
      "Nila bakar madu pedas manis siap menemani makan siang sedulur Solo. Nikmatnya sampai ke tulang! 🤤🔥 #KulinerSolo #Surakarta",
    likes: "3,450",
  },
  {
    id: 5,
    name: "KDMP Pasar Gede Solo",
    type: "KDMP",
    location: "Kota Surakarta, Jawa Tengah",
    province: "Jawa Tengah",
    city: "Kota Surakarta",
    lat: -7.5714,
    lng: 110.8291,
    socialMedia: "pasargede_official",
    avatarPlaceholder: "bg-blue-600",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=400&q=80",
    caption:
      "Suasana pagi di Pasar Gede Solo. Pusat grosir bumbu rempah dan hasil bumi terlengkap. #PasarGede #SoloInfo",
    likes: "5,612",
  },
  {
    id: 6,
    name: "Solo Furniture Mall",
    type: "Mall",
    location: "Kota Surakarta, Jawa Tengah",
    province: "Jawa Tengah",
    city: "Kota Surakarta",
    lat: -7.575,
    lng: 110.8234,
    socialMedia: "solofurnituremall",
    avatarPlaceholder: "bg-stone-800",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80",
    caption:
      "Koleksi sofa modern minimalis sudah tiba. Bikin ruang tamu makin aesthetic. Mampir ke showroom kami ya! 🛋️✨ #FurnitureSolo",
    likes: "4,200",
  },

  // KABUPATEN BOJONEGORO
  {
    id: 7,
    name: "Ayam Geprek Sambal Korek Bojonegoro",
    type: "Resto",
    location: "Kabupaten Bojonegoro, Jawa Timur",
    province: "Jawa Timur",
    city: "Kabupaten Bojonegoro",
    lat: -7.150975,
    lng: 111.881729,
    socialMedia: "ayamgeprekkorek_bjn",
    avatarPlaceholder: "bg-red-600",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80",
    caption:
      "Awas pedasnya nendang! Sambal korek fresh ulek dadakan. Promo paket mahasiswa setiap jumat. 🌶️🍗 #KulinerBojonegoro",
    likes: "1,890",
  },
  {
    id: 8,
    name: "KDMP Pasar Kota Bojonegoro",
    type: "KDMP",
    location: "Kabupaten Bojonegoro, Jawa Timur",
    province: "Jawa Timur",
    city: "Kabupaten Bojonegoro",
    lat: -7.1556,
    lng: 111.8845,
    socialMedia: "pasarkota_bojonegoro",
    avatarPlaceholder: "bg-teal-700",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80",
    caption:
      "Harga cabai dan bawang mulai stabil lur. Siap supply untuk warung-warung di Bojonegoro. 🌶️🧅",
    likes: "956",
  },
  {
    id: 9,
    name: "Toko Mebel Jati Kusuma",
    type: "Toko Mebel",
    location: "Kabupaten Bojonegoro, Jawa Timur",
    province: "Jawa Timur",
    city: "Kabupaten Bojonegoro",
    lat: -7.162,
    lng: 111.89,
    socialMedia: "jatikusuma_bjn",
    avatarPlaceholder: "bg-yellow-800",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=400&q=80",
    caption:
      "Lemari pakaian 3 pintu ukiran klasik asli Bojonegoro. Kualitas terjamin awet sampai anak cucu. #MebelBojonegoro",
    likes: "1,455",
  },
  // Additional 50 dummy distributors (Unsplash images)
  {
    id: 10,
    name: "Resto Nasi Liwet Bu Tini",
    type: "Resto",
    location: "Kota Bogor, Jawa Barat",
    province: "Jawa Barat",
    city: "Kota Bogor",
    lat: -6.595038,
    lng: 106.816635,
    socialMedia: "nasiliwet_butini",
    avatarPlaceholder: "bg-orange-500",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80",
    caption: "Nasi liwet hangat dan lauk melimpah setiap pagi. #KulinerBogor",
    likes: "1,024",
  },
  {
    id: 11,
    name: "KDMP Gudang Bogor Sentral",
    type: "KDMP",
    location: "Kota Bogor, Jawa Barat",
    province: "Jawa Barat",
    city: "Kota Bogor",
    lat: -6.595038,
    lng: 106.816635,
    socialMedia: "gudang_bogor_sentral",
    avatarPlaceholder: "bg-emerald-600",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80",
    caption: "Pusat grosir kebutuhan pasar, siap suplai tiap hari.",
    likes: "872",
  },
  {
    id: 12,
    name: "Toko Mebel Rahayu",
    type: "Toko Mebel",
    location: "Kota Bogor, Jawa Barat",
    province: "Jawa Barat",
    city: "Kota Bogor",
    lat: -6.595038,
    lng: 106.816635,
    socialMedia: "mebelrahayu_bogor",
    avatarPlaceholder: "bg-amber-700",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80",
    caption: "Furniture kayu berkualitas, garansi 1 tahun.",
    likes: "2,010",
  },
  {
    id: 13,
    name: "Mall Bogor Indah",
    type: "Mall",
    location: "Kota Bogor, Jawa Barat",
    province: "Jawa Barat",
    city: "Kota Bogor",
    lat: -6.595038,
    lng: 106.816635,
    socialMedia: "mallbogorindah",
    avatarPlaceholder: "bg-stone-800",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80",
    caption: "Pusat perbelanjaan lengkap, promo akhir pekan!",
    likes: "3,120",
  },
  {
    id: 14,
    name: "Warung Soto Betawi H. Aman",
    type: "Resto",
    location: "Kota Bogor, Jawa Barat",
    province: "Jawa Barat",
    city: "Kota Bogor",
    lat: -6.595038,
    lng: 106.816635,
    socialMedia: "sotobetawi_aman",
    avatarPlaceholder: "bg-red-500",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?w=400&q=80",
    caption: "Kuah kental dan empuk daging sapi, resep turun temurun.",
    likes: "1,540",
  },
  {
    id: 15,
    name: "KDMP Pasar Bogor Utama",
    type: "KDMP",
    location: "Kota Bogor, Jawa Barat",
    province: "Jawa Barat",
    city: "Kota Bogor",
    lat: -6.595038,
    lng: 106.816635,
    socialMedia: "pasarbogor_utama",
    avatarPlaceholder: "bg-blue-600",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=400&q=80",
    caption: "Bumbu dan sayur segar tersedia setiap pagi.",
    likes: "680",
  },
  {
    id: 16,
    name: "Toko Mebel Minimalis Bogor",
    type: "Toko Mebel",
    location: "Kota Bogor, Jawa Barat",
    province: "Jawa Barat",
    city: "Kota Bogor",
    lat: -6.595038,
    lng: 106.816635,
    socialMedia: "minimalismebel_bogor",
    avatarPlaceholder: "bg-teal-700",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=400&q=80",
    caption: "Desain modern, siap kirim antar kota.",
    likes: "1,120",
  },
  {
    id: 17,
    name: "Resto Bakso Pak Slamet",
    type: "Resto",
    location: "Kota Bogor, Jawa Barat",
    province: "Jawa Barat",
    city: "Kota Bogor",
    lat: -6.595038,
    lng: 106.816635,
    socialMedia: "baksupakslamet",
    avatarPlaceholder: "bg-yellow-800",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80",
    caption: "Bakso urat empuk dengan porsi besar, favorit warga.",
    likes: "2,300",
  },
  {
    id: 18,
    name: "KDMP Sayur Segar Bogor",
    type: "KDMP",
    location: "Kota Bogor, Jawa Barat",
    province: "Jawa Barat",
    city: "Kota Bogor",
    lat: -6.595038,
    lng: 106.816635,
    socialMedia: "sayursegar_bogor",
    avatarPlaceholder: "bg-emerald-600",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80",
    caption: "Pasokan sayur segar dari petani lokal setiap hari.",
    likes: "910",
  },
  {
    id: 19,
    name: "Toko Mebel Klasik Bogor",
    type: "Toko Mebel",
    location: "Kota Bogor, Jawa Barat",
    province: "Jawa Barat",
    city: "Kota Bogor",
    lat: -6.595038,
    lng: 106.816635,
    socialMedia: "mebelklasik_bogor",
    avatarPlaceholder: "bg-amber-700",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80",
    caption: "Ukiran tangan, bahan jati pilihan.",
    likes: "1,005",
  },
  {
    id: 20,
    name: "Resto Goreng Ikan Pak Joko",
    type: "Resto",
    location: "Kota Bogor, Jawa Barat",
    province: "Jawa Barat",
    city: "Kota Bogor",
    lat: -6.595038,
    lng: 106.816635,
    socialMedia: "gorengikan_joko",
    avatarPlaceholder: "bg-red-500",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?w=400&q=80",
    caption: "Ikan segar digoreng krispi dan sambal khas rumah.",
    likes: "1,870",
  },
  {
    id: 21,
    name: "KDMP Bulk Distributor Bogor",
    type: "KDMP",
    location: "Kota Bogor, Jawa Barat",
    province: "Jawa Barat",
    city: "Kota Bogor",
    lat: -6.595038,
    lng: 106.816635,
    socialMedia: "bulk_bogor",
    avatarPlaceholder: "bg-blue-600",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=400&q=80",
    caption: "Layanan grosir untuk toko dan rumah makan.",
    likes: "640",
  },
  {
    id: 22,
    name: "Toko Mebel Sederhana",
    type: "Toko Mebel",
    location: "Kota Bogor, Jawa Barat",
    province: "Jawa Barat",
    city: "Kota Bogor",
    lat: -6.595038,
    lng: 106.816635,
    socialMedia: "mebelsederhana_bgr",
    avatarPlaceholder: "bg-teal-700",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=400&q=80",
    caption: "Murah dan tahan lama, cocok untuk usaha kos.",
    likes: "745",
  },
  {
    id: 23,
    name: "Resto Seafood Laut Segar",
    type: "Resto",
    location: "Kota Bogor, Jawa Barat",
    province: "Jawa Barat",
    city: "Kota Bogor",
    lat: -6.595038,
    lng: 106.816635,
    socialMedia: "seafoodsegard",
    avatarPlaceholder: "bg-yellow-800",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80",
    caption: "Hidangan laut segar dengan sambal spesial.",
    likes: "2,415",
  },
  {
    id: 24,
    name: "KDMP Pusat Sayur Bogor",
    type: "KDMP",
    location: "Kota Bogor, Jawa Barat",
    province: "Jawa Barat",
    city: "Kota Bogor",
    lat: -6.595038,
    lng: 106.816635,
    socialMedia: "pusatsayur_bgr",
    avatarPlaceholder: "bg-emerald-600",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80",
    caption: "Distribusi sayur segar ke pasar tradisional.",
    likes: "512",
  },
  {
    id: 25,
    name: "Toko Mebel Anak Muda",
    type: "Toko Mebel",
    location: "Kota Bogor, Jawa Barat",
    province: "Jawa Barat",
    city: "Kota Bogor",
    lat: -6.595038,
    lng: 106.816635,
    socialMedia: "mebelkekinian_bogor",
    avatarPlaceholder: "bg-amber-700",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80",
    caption: "Style minimalis untuk apartemen dan kos.",
    likes: "1,300",
  },
  {
    id: 26,
    name: "Resto Pecak Ikan Segar",
    type: "Resto",
    location: "Kota Bogor, Jawa Barat",
    province: "Jawa Barat",
    city: "Kota Bogor",
    lat: -6.595038,
    lng: 106.816635,
    socialMedia: "pecakikan_bgr",
    avatarPlaceholder: "bg-red-500",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?w=400&q=80",
    caption: "Sajian tradisional dengan sambal ulek.",
    likes: "1,045",
  },
  {
    id: 27,
    name: "KDMP Wholesale Bogor",
    type: "KDMP",
    location: "Kota Bogor, Jawa Barat",
    province: "Jawa Barat",
    city: "Kota Bogor",
    lat: -6.595038,
    lng: 106.816635,
    socialMedia: "wholesale_bogor",
    avatarPlaceholder: "bg-blue-600",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=400&q=80",
    caption: "Solusi pasokan untuk UMKM dan warung.",
    likes: "423",
  },
  {
    id: 28,
    name: "Toko Mebel Keluarga",
    type: "Toko Mebel",
    location: "Kota Bogor, Jawa Barat",
    province: "Jawa Barat",
    city: "Kota Bogor",
    lat: -6.595038,
    lng: 106.816635,
    socialMedia: "mebelkeluarga",
    avatarPlaceholder: "bg-teal-700",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=400&q=80",
    caption: "Perabot keluarga dengan harga terjangkau.",
    likes: "978",
  },
  {
    id: 29,
    name: "Resto Tongseng Pak Udin",
    type: "Resto",
    location: "Kota Bogor, Jawa Barat",
    province: "Jawa Barat",
    city: "Kota Bogor",
    lat: -6.595038,
    lng: 106.816635,
    socialMedia: "tongseng_pakudin",
    avatarPlaceholder: "bg-yellow-800",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80",
    caption: "Tongseng empuk dan kaya rempah menjadi andalan.",
    likes: "1,210",
  },
  // Jawa Tengah (Surakarta) entries
  {
    id: 30,
    name: "Resto Gudeg Solo Asli",
    type: "Resto",
    location: "Kota Surakarta, Jawa Tengah",
    province: "Jawa Tengah",
    city: "Kota Surakarta",
    lat: -7.556111,
    lng: 110.831667,
    socialMedia: "gudegsolo_asli",
    avatarPlaceholder: "bg-orange-500",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80",
    caption: "Gudeg manis legit, resep turun temurun.",
    likes: "4,010",
  },
  {
    id: 31,
    name: "KDMP Solo Pusat",
    type: "KDMP",
    location: "Kota Surakarta, Jawa Tengah",
    province: "Jawa Tengah",
    city: "Kota Surakarta",
    lat: -7.556111,
    lng: 110.831667,
    socialMedia: "kdmp_solo_pusat",
    avatarPlaceholder: "bg-emerald-600",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80",
    caption: "Pasokan grosir bumbu dan bahan baku restoran.",
    likes: "2,400",
  },
  {
    id: 32,
    name: "Toko Mebel Solo Jaya",
    type: "Toko Mebel",
    location: "Kota Surakarta, Jawa Tengah",
    province: "Jawa Tengah",
    city: "Kota Surakarta",
    lat: -7.556111,
    lng: 110.831667,
    socialMedia: "mebelsolojaya",
    avatarPlaceholder: "bg-amber-700",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=400&q=80",
    caption: "Mebel elegan khas Solo, siap kirim.",
    likes: "1,890",
  },
  {
    id: 33,
    name: "Solo Furniture Mall",
    type: "Mall",
    location: "Kota Surakarta, Jawa Tengah",
    province: "Jawa Tengah",
    city: "Kota Surakarta",
    lat: -7.575,
    lng: 110.8234,
    socialMedia: "solofurnituremall",
    avatarPlaceholder: "bg-stone-800",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80",
    caption: "Koleksi sofa modern minimalis sudah tiba.",
    likes: "4,200",
  },
  {
    id: 34,
    name: "Resto Nasi Liwet Solo",
    type: "Resto",
    location: "Kota Surakarta, Jawa Tengah",
    province: "Jawa Tengah",
    city: "Kota Surakarta",
    lat: -7.556111,
    lng: 110.831667,
    socialMedia: "nasiliwet_solo",
    avatarPlaceholder: "bg-red-500",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?w=400&q=80",
    caption: "Nasi liwet hangat, lauk lengkap.",
    likes: "3,010",
  },
  {
    id: 35,
    name: "KDMP Solo Timur",
    type: "KDMP",
    location: "Kota Surakarta, Jawa Tengah",
    province: "Jawa Tengah",
    city: "Kota Surakarta",
    lat: -7.556111,
    lng: 110.831667,
    socialMedia: "kdmp_solo_timur",
    avatarPlaceholder: "bg-blue-600",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=400&q=80",
    caption: "Pusat grosir untuk usaha kuliner.",
    likes: "2,540",
  },
  {
    id: 36,
    name: "Toko Mebel Solo Mandiri",
    type: "Toko Mebel",
    location: "Kota Surakarta, Jawa Tengah",
    province: "Jawa Tengah",
    city: "Kota Surakarta",
    lat: -7.556111,
    lng: 110.831667,
    socialMedia: "mebelmandiri_solo",
    avatarPlaceholder: "bg-teal-700",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80",
    caption: "Perabot rumah tangga, custom design.",
    likes: "1,700",
  },
  {
    id: 37,
    name: "Resto Ayam Bakar Solo",
    type: "Resto",
    location: "Kota Surakarta, Jawa Tengah",
    province: "Jawa Tengah",
    city: "Kota Surakarta",
    lat: -7.556111,
    lng: 110.831667,
    socialMedia: "ayambakar_solo",
    avatarPlaceholder: "bg-yellow-800",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80",
    caption: "Ayam bakar bumbu khas Solo, favorit keluarga.",
    likes: "2,900",
  },
  {
    id: 38,
    name: "KDMP Solo Barat",
    type: "KDMP",
    location: "Kota Surakarta, Jawa Tengah",
    province: "Jawa Tengah",
    city: "Kota Surakarta",
    lat: -7.556111,
    lng: 110.831667,
    socialMedia: "kdmp_solo_barat",
    avatarPlaceholder: "bg-emerald-600",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80",
    caption: "Grosir bahan pokok, harga kompetitif.",
    likes: "760",
  },
  {
    id: 39,
    name: "Toko Mebel Solo Lama",
    type: "Toko Mebel",
    location: "Kota Surakarta, Jawa Tengah",
    province: "Jawa Tengah",
    city: "Kota Surakarta",
    lat: -7.556111,
    lng: 110.831667,
    socialMedia: "mebellama_solo",
    avatarPlaceholder: "bg-amber-700",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=400&q=80",
    caption: "Daya tahan tinggi, cocok untuk usaha homestay.",
    likes: "1,120",
  },
  {
    id: 40,
    name: "Resto Nila Bakar Solo",
    type: "Resto",
    location: "Kota Surakarta, Jawa Tengah",
    province: "Jawa Tengah",
    city: "Kota Surakarta",
    lat: -7.556111,
    lng: 110.831667,
    socialMedia: "nilabakar_solo",
    avatarPlaceholder: "bg-red-500",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?w=400&q=80",
    caption: "Nila segar, bumbu meresap sampai ke tulang.",
    likes: "860",
  },
  {
    id: 41,
    name: "KDMP Solo Central",
    type: "KDMP",
    location: "Kota Surakarta, Jawa Tengah",
    province: "Jawa Tengah",
    city: "Kota Surakarta",
    lat: -7.556111,
    lng: 110.831667,
    socialMedia: "kdmp_central_solo",
    avatarPlaceholder: "bg-blue-600",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=400&q=80",
    caption: "Melayani permintaan harian untuk UMKM.",
    likes: "1,340",
  },
  {
    id: 42,
    name: "Toko Kursi Solo",
    type: "Toko Mebel",
    location: "Kota Surakarta, Jawa Tengah",
    province: "Jawa Tengah",
    city: "Kota Surakarta",
    lat: -7.556111,
    lng: 110.831667,
    socialMedia: "tokokursi_solo",
    avatarPlaceholder: "bg-teal-700",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80",
    caption: "Koleksi kursi dan meja terbaik untuk kafe.",
    likes: "980",
  },
  {
    id: 43,
    name: "Resto Pecel Solo Asri",
    type: "Resto",
    location: "Kota Surakarta, Jawa Tengah",
    province: "Jawa Tengah",
    city: "Kota Surakarta",
    lat: -7.556111,
    lng: 110.831667,
    socialMedia: "pecelsolo_asri",
    avatarPlaceholder: "bg-yellow-800",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80",
    caption: "Sambal ulek khas Solo, porsi pas untuk keluarga.",
    likes: "1,760",
  },
  {
    id: 44,
    name: "KDMP Solo Wholesale",
    type: "KDMP",
    location: "Kota Surakarta, Jawa Tengah",
    province: "Jawa Tengah",
    city: "Kota Surakarta",
    lat: -7.556111,
    lng: 110.831667,
    socialMedia: "wholesale_solo",
    avatarPlaceholder: "bg-emerald-600",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80",
    caption: "Harga grosir untuk pembelian skala besar.",
    likes: "420",
  },
  // Jawa Timur (Bojonegoro) entries
  {
    id: 45,
    name: "Resto Ayam Goreng Bojonegoro",
    type: "Resto",
    location: "Kabupaten Bojonegoro, Jawa Timur",
    province: "Jawa Timur",
    city: "Kabupaten Bojonegoro",
    lat: -7.150975,
    lng: 111.881729,
    socialMedia: "ayamgoreng_bjn",
    avatarPlaceholder: "bg-orange-500",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?w=400&q=80",
    caption: "Ayam goreng renyah sambal andalan Bojonegoro.",
    likes: "1,210",
  },
  {
    id: 46,
    name: "KDMP Bojonegoro Pusat",
    type: "KDMP",
    location: "Kabupaten Bojonegoro, Jawa Timur",
    province: "Jawa Timur",
    city: "Kabupaten Bojonegoro",
    lat: -7.150975,
    lng: 111.881729,
    socialMedia: "kdmp_bjn_pusat",
    avatarPlaceholder: "bg-emerald-600",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80",
    caption: "Distributor lokal siap antar ke pasar terdekat.",
    likes: "675",
  },
  {
    id: 47,
    name: "Toko Mebel Jaya Bojonegoro",
    type: "Toko Mebel",
    location: "Kabupaten Bojonegoro, Jawa Timur",
    province: "Jawa Timur",
    city: "Kabupaten Bojonegoro",
    lat: -7.150975,
    lng: 111.881729,
    socialMedia: "mebeljaya_bjn",
    avatarPlaceholder: "bg-amber-700",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80",
    caption: "Perabot rumah tangga ukuran besar, kualitas ok.",
    likes: "1,150",
  },
  {
    id: 48,
    name: "Resto Sego Krawu Bojonegoro",
    type: "Resto",
    location: "Kabupaten Bojonegoro, Jawa Timur",
    province: "Jawa Timur",
    city: "Kabupaten Bojonegoro",
    lat: -7.150975,
    lng: 111.881729,
    socialMedia: "segokrawu_bjn",
    avatarPlaceholder: "bg-red-500",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80",
    caption: "Rasa khas Jawa Timur, bumbu mantap.",
    likes: "2,005",
  },
  {
    id: 49,
    name: "KDMP Bojonegoro Timur",
    type: "KDMP",
    location: "Kabupaten Bojonegoro, Jawa Timur",
    province: "Jawa Timur",
    city: "Kabupaten Bojonegoro",
    lat: -7.150975,
    lng: 111.881729,
    socialMedia: "kdmp_bjn_timur",
    avatarPlaceholder: "bg-blue-600",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=400&q=80",
    caption: "Solusi pasokan untuk toko kelontong dan warung.",
    likes: "430",
  },
  {
    id: 50,
    name: "Toko Mebel Murah Bojonegoro",
    type: "Toko Mebel",
    location: "Kabupaten Bojonegoro, Jawa Timur",
    province: "Jawa Timur",
    city: "Kabupaten Bojonegoro",
    lat: -7.150975,
    lng: 111.881729,
    socialMedia: "mebelmurah_bjn",
    avatarPlaceholder: "bg-teal-700",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=400&q=80",
    caption: "Harga ekonomis untuk kebutuhan rumah tangga.",
    likes: "890",
  },
  {
    id: 51,
    name: "Resto Soto Bojonegoro Mantap",
    type: "Resto",
    location: "Kabupaten Bojonegoro, Jawa Timur",
    province: "Jawa Timur",
    city: "Kabupaten Bojonegoro",
    lat: -7.150975,
    lng: 111.881729,
    socialMedia: "soto_bjn_mantap",
    avatarPlaceholder: "bg-yellow-800",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?w=400&q=80",
    caption: "Kuah gurih, porsi besar, cocok untuk keluarga.",
    likes: "1,020",
  },
  {
    id: 52,
    name: "KDMP Sayur Bojonegoro",
    type: "KDMP",
    location: "Kabupaten Bojonegoro, Jawa Timur",
    province: "Jawa Timur",
    city: "Kabupaten Bojonegoro",
    lat: -7.150975,
    lng: 111.881729,
    socialMedia: "sayurbjn_kdmp",
    avatarPlaceholder: "bg-emerald-600",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80",
    caption: "Pasokan hortikultura dari petani setempat.",
    likes: "710",
  },
  {
    id: 53,
    name: "Toko Mebel Ukir Bojonegoro",
    type: "Toko Mebel",
    location: "Kabupaten Bojonegoro, Jawa Timur",
    province: "Jawa Timur",
    city: "Kabupaten Bojonegoro",
    lat: -7.150975,
    lng: 111.881729,
    socialMedia: "mebelukir_bjn",
    avatarPlaceholder: "bg-amber-700",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80",
    caption: "Ukiran tradisional, bahan jati pilihan.",
    likes: "1,330",
  },
  {
    id: 54,
    name: "Resto Ikan Bakar Bojonegoro",
    type: "Resto",
    location: "Kabupaten Bojonegoro, Jawa Timur",
    province: "Jawa Timur",
    city: "Kabupaten Bojonegoro",
    lat: -7.150975,
    lng: 111.881729,
    socialMedia: "ikanbakar_bjn",
    avatarPlaceholder: "bg-red-500",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80",
    caption: "Ikan bakar dengan sambal khas kampung.",
    likes: "1,080",
  },
  {
    id: 55,
    name: "KDMP Pusat Bojonegoro Wholesale",
    type: "KDMP",
    location: "Kabupaten Bojonegoro, Jawa Timur",
    province: "Jawa Timur",
    city: "Kabupaten Bojonegoro",
    lat: -7.150975,
    lng: 111.881729,
    socialMedia: "kdmp_wholesale_bjn",
    avatarPlaceholder: "bg-blue-600",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=400&q=80",
    caption: "Pelayanan pembelian grosir untuk UMKM.",
    likes: "360",
  },
  {
    id: 56,
    name: "Toko Mebel Teras Bojonegoro",
    type: "Toko Mebel",
    location: "Kabupaten Bojonegoro, Jawa Timur",
    province: "Jawa Timur",
    city: "Kabupaten Bojonegoro",
    lat: -7.150975,
    lng: 111.881729,
    socialMedia: "terasmobel_bjn",
    avatarPlaceholder: "bg-teal-700",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=400&q=80",
    caption: "Perabot outdoor dan teras berkualitas.",
    likes: "525",
  },
  {
    id: 57,
    name: "Resto Mie Ayam Kedung",
    type: "Resto",
    location: "Kabupaten Bojonegoro, Jawa Timur",
    province: "Jawa Timur",
    city: "Kabupaten Bojonegoro",
    lat: -7.150975,
    lng: 111.881729,
    socialMedia: "mieayam_kedung",
    avatarPlaceholder: "bg-yellow-800",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?w=400&q=80",
    caption: "Mie ayam lezat, topping melimpah.",
    likes: "890",
  },
  {
    id: 58,
    name: "KDMP Gudang Bojonegoro South",
    type: "KDMP",
    location: "Kabupaten Bojonegoro, Jawa Timur",
    province: "Jawa Timur",
    city: "Kabupaten Bojonegoro",
    lat: -7.150975,
    lng: 111.881729,
    socialMedia: "gudang_bjn_south",
    avatarPlaceholder: "bg-emerald-600",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80",
    caption: "Logistik cepat, suplai ke wilayah timur.",
    likes: "410",
  },
  {
    id: 59,
    name: "Toko Mebel Nusa",
    type: "Toko Mebel",
    location: "Kabupaten Bojonegoro, Jawa Timur",
    province: "Jawa Timur",
    city: "Kabupaten Bojonegoro",
    lat: -7.150975,
    lng: 111.881729,
    socialMedia: "mebelnusa_bjn",
    avatarPlaceholder: "bg-amber-700",
    imagePlaceholder:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80",
    caption: "Mebel modern dan klasik, siap kirim luar kota.",
    likes: "1,075",
  },
];

const LOCATIONS: Record<string, string[]> = {
  "Jawa Barat": ["Kota Bogor"],
  "Jawa Tengah": ["Kota Surakarta"],
  "Jawa Timur": ["Kabupaten Bojonegoro"],
};

const CariDistributor = () => {
  usePageTitle("Cari Distributor");

  // State for AI Search
  const [province, setProvince] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [keyword, setKeyword] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(
    null,
  );
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [activeMarkerId, setActiveMarkerId] = useState<number | null>(null);

  // State for Map Tooltip (Provinces)
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setActiveMarkerId(null);

    setTimeout(() => {
      let filtered = MOCK_DISTRIBUTORS;

      // Filter by location
      if (province) {
        filtered = filtered.filter((d) => d.province === province);
      }
      if (city) {
        filtered = filtered.filter((d) => d.city === city);
      }

      // Mock AI Intent Logic
      const kw = keyword.toLowerCase();
      const isFood =
        kw.includes("lele") || kw.includes("nila") || kw.includes("ayam");
      const isFurniture = kw.includes("kursi") || kw.includes("meja");

      if (isFood) {
        filtered = filtered.filter(
          (d) => d.type === "Resto" || d.type === "KDMP",
        );
      } else if (isFurniture) {
        filtered = filtered.filter(
          (d) => d.type === "Toko Mebel" || d.type === "Mall",
        );
      } else if (kw) {
        // If keyword doesn't match AI rules, do a basic text search
        filtered = filtered.filter((d) => d.name.toLowerCase().includes(kw));
      }

      setSearchResults(filtered);
      setIsSearching(false);
    }, 600); // mock network delay
  };

  const handleMapClick = (
    geo: any,
    e: React.MouseEvent<SVGPathElement, MouseEvent>,
  ) => {
    // If clicking on province while viewing search results, just dismiss markers tooltip
    setActiveMarkerId(null);

    let rawName =
      geo.properties.Propinsi ||
      geo.properties.name ||
      geo.properties.state ||
      "";

    if (rawName.toLowerCase().includes("jakarta")) rawName = "DKI Jakarta";
    if (rawName.toLowerCase().includes("yogyakarta")) rawName = "DI Yogyakarta";
    if (rawName.toLowerCase().includes("bangka"))
      rawName = "Kepulauan Bangka Belitung";

    const matchedKey = Object.keys(distributorsByProvince).find(
      (key) => key.toLowerCase() === rawName.toLowerCase(),
    );

    const finalName = matchedKey || rawName;
    const distributors = distributorsByProvince[finalName] || [];
    const keterangan = getKeteranganTambahan(finalName);

    setTooltip({
      x: e.clientX,
      y: e.clientY,
      provinceName: finalName,
      distributors: distributors,
      keterangan: keterangan,
    });
  };

  const closeTooltips = () => {
    setTooltip(null);
  };

  return (
    <div
      className="min-h-screen bg-transparent relative"
      onClick={closeTooltips}
    >
      <div className="max-w-[80rem] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 space-y-6">
        {/* TOP SECTION: Interactive Map */}
        <div className="bg-gradient-to-b from-[#f2fcf9] from-2% to-white rounded-2xl p-6 shadow-md border border-gray-100 min-w-0 relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
            <div>
              <h3 className="font-semibold text-xl text-gray-800">
                Peta Interaktif Distributor Nasional
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Gunakan Pencarian Cerdas di bawah peta untuk memunculkan titik
                spesifik. Klik provinsi untuk info jaringan.
              </p>
            </div>
            {searchResults && searchResults.length > 0 && (
              <span className="px-4 py-2 bg-primary/10 text-primary text-sm font-bold rounded-full animate-pulse border border-primary/20 whitespace-nowrap">
                {searchResults.length} Titik Ditemukan
              </span>
            )}
          </div>

          <div className="h-[28rem] sm:h-[32rem] w-full bg-[#f0f8ff] rounded-xl overflow-hidden relative cursor-pointer flex items-center justify-center border border-blue-100 shadow-inner">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                scale: 1200,
                center: [118, -2.5],
              }}
              style={{ width: "100%", height: "100%" }}
            >
              <Geographies geography={geoUrl}>
                {({ geographies }: { geographies: any[] }) =>
                  geographies.map((geo: any) => {
                    let geoName =
                      geo.properties.Propinsi ||
                      geo.properties.name ||
                      geo.properties.state ||
                      "";
                    if (geoName.toLowerCase().includes("jakarta"))
                      geoName = "DKI Jakarta";
                    if (geoName.toLowerCase().includes("yogyakarta"))
                      geoName = "DI Yogyakarta";

                    const isSelected =
                      tooltip?.provinceName.toLowerCase() ===
                      geoName.toLowerCase();

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={isSelected ? "#10b981" : "#cbd5e1"}
                        stroke="#ffffff"
                        strokeWidth={0.8}
                        onClick={(e: any) => {
                          e.stopPropagation();
                          handleMapClick(geo, e);
                        }}
                        style={{
                          default: { outline: "none" },
                          hover: { fill: "#6ee7b7", outline: "none" },
                          pressed: { fill: "#059669", outline: "none" },
                        }}
                      />
                    );
                  })
                }
              </Geographies>

              {/* Render Search Result Markers on Map */}
              {searchResults &&
                searchResults.map((result) => {
                  const isHovered = activeMarkerId === result.id;
                  return (
                    <Marker
                      key={result.id}
                      coordinates={[result.lng, result.lat]}
                      onMouseEnter={() => setActiveMarkerId(result.id)}
                      onMouseLeave={() => setActiveMarkerId(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMarkerId(result.id);
                      }}
                    >
                      <g transform="translate(-12, -24)">
                        <path
                          fill={isHovered ? "#ef4444" : "#f59e0b"}
                          d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z"
                        />
                        <circle cx="12" cy="10" r="4" fill="white" />
                      </g>
                      {isHovered && (
                        <text
                          textAnchor="middle"
                          y={-32}
                          style={{
                            fontFamily: "system-ui",
                            fill: "#1f2937",
                            fontSize: "14px",
                            fontWeight: "bold",
                            filter:
                              "drop-shadow(0px 0px 4px rgba(255,255,255,0.8))",
                          }}
                        >
                          {result.name}
                        </text>
                      )}
                    </Marker>
                  );
                })}
            </ComposableMap>
          </div>
        </div>

        {/* AI Search Section */}
        <div
          className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 min-w-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-xl text-gray-800">
              Pencarian Cerdas (AI-Driven)
            </h3>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Ketik kebutuhan Anda dan AI akan memetakan target outlet terbaik di
            wilayah Anda. <br className="hidden sm:block" />
            <span className="text-gray-400 text-xs">
              Simulasi: Ketik "lele" atau "meja" pada wilayah Bogor, Surakarta,
              atau Bojonegoro.
            </span>
          </p>

          <form
            onSubmit={handleSearch}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Provinsi
              </label>
              <select
                className="w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
                value={province}
                onChange={(e) => {
                  setProvince(e.target.value);
                  setCity("");
                }}
              >
                <option value="">Semua Provinsi</option>
                {Object.keys(LOCATIONS).map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Kabupaten/Kota
              </label>
              <select
                className="w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white disabled:bg-gray-50 disabled:text-gray-400"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={!province}
              >
                <option value="">Semua Kota</option>
                {province &&
                  LOCATIONS[province]?.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
              </select>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Kata Kunci (Kebutuhan)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Contoh: lele, nila, ayam atau kursi, meja..."
                  className="flex-1 border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 flex items-center justify-center min-w-[100px] disabled:opacity-70 transition-colors"
                >
                  {isSearching ? (
                    <span className="animate-pulse">Mencari...</span>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" /> Cari
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Embedded Social Media Search Results */}
        {searchResults && (
          <div
            className="bg-transparent min-w-0"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="font-semibold text-gray-800 mb-6 flex items-center gap-2">
              Temuan Outlet di Sosial Media
              <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                {searchResults.length}
              </span>
            </h4>

            {searchResults.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-500 text-sm shadow-sm">
                Tidak ada distributor atau outlet yang memposting tentang{" "}
                <strong>"{keyword}"</strong> di area yang dipilih.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-white border ${activeMarkerId === item.id ? "border-primary ring-4 ring-primary/20" : "border-gray-200"} rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer`}
                    onMouseEnter={() => setActiveMarkerId(item.id)}
                    onMouseLeave={() => setActiveMarkerId(null)}
                  >
                    {/* IG-like Header */}
                    <div className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-full ${item.avatarPlaceholder} flex items-center justify-center text-white font-bold text-xs shadow-inner`}
                        >
                          {item.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 leading-none">
                            {item.socialMedia}
                          </p>
                          <p className="text-[10px] text-gray-500 flex items-center gap-0.5 mt-0.5">
                            <MapPin className="w-2.5 h-2.5" /> {item.city}
                          </p>
                        </div>
                      </div>
                      <div className="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded-md font-medium tracking-wide">
                        {item.type}
                      </div>
                    </div>

                    {/* Image Area */}
                    <div className="w-full aspect-square bg-gray-100 relative group overflow-hidden">
                      <img
                        src={item.imagePlaceholder}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />

                      {/* Floating Location Tag overlay */}
                      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Navigation className="w-3 h-3" />
                        {`${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}`}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="px-3 pt-3 pb-1 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button className="text-gray-800 hover:text-red-500 transition-colors">
                          <Heart className="w-5 h-5" />
                        </button>
                        <button className="text-gray-800 hover:text-gray-600 transition-colors">
                          <MessageCircle className="w-5 h-5" />
                        </button>
                        <button className="text-gray-800 hover:text-gray-600 transition-colors">
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                      <button className="text-gray-800 hover:text-gray-600 transition-colors">
                        <Bookmark className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Caption Area */}
                    <div className="px-3 pb-4">
                      <p className="text-xs font-semibold text-gray-900 mb-1">
                        {item.likes} suka
                      </p>
                      <p className="text-xs text-gray-800 leading-relaxed">
                        <span className="font-bold mr-1">
                          {item.socialMedia}
                        </span>
                        {item.caption}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Map Tooltip (For Provinces) */}
      {tooltip && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-72 pointer-events-none transform -translate-x-1/2 -translate-y-[110%]"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transition: "opacity 0.2s ease-in-out",
          }}
        >
          <div className="absolute w-3 h-3 bg-white border-b border-r border-gray-200 transform rotate-45 left-1/2 -bottom-1.5 -translate-x-1/2"></div>

          <h4 className="font-bold text-gray-800 text-lg border-b pb-2 mb-2">
            {tooltip.provinceName}
          </h4>

          {tooltip.distributors.length > 0 ? (
            <div className="mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase">
                Daftar Distributor:
              </span>
              <ul className="mt-1 space-y-1">
                {tooltip.distributors.map((d, i) => (
                  <li
                    key={i}
                    className="text-sm text-gray-700 font-medium flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic mb-3">
              Tidak ada data distributor.
            </p>
          )}

          <div className="bg-emerald-50 p-2 rounded text-xs space-y-1.5 border border-emerald-100">
            <p>
              <strong className="text-emerald-900">Jenis Barang:</strong>{" "}
              <span className="text-emerald-700">
                {tooltip.keterangan.jenisBarang}
              </span>
            </p>
            <p>
              <strong className="text-emerald-900">Skala:</strong>{" "}
              <span className="text-emerald-700">
                {tooltip.keterangan.skala}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CariDistributor;
