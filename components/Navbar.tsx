"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingCart, Globe, Search } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [piPrice, setPiPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { translate } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch("/api/pi-price");
        const data = await res.json();
        if (data?.price_usd) setPiPrice(parseFloat(data.price_usd));
      } catch (error) {
        console.error("⚠️ Lỗi khi lấy giá Pi:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const goSearch = () => router.push("/search");

  return (
    <header className="fixed top-0 left-0 right-0 bg-orange-500 border-b shadow-sm z-50">
      <div className="relative flex items-center justify-between px-4 py-2 text-white">
        {/* 1) 🛒 Giỏ hàng (trái) */}
        <Link href="/cart" aria-label="Giỏ hàng" className="hover:text-yellow-300 transition">
          <ShoppingCart size={22} />
        </Link>

        {/* 2) 💰 Giá Pi (giữa) */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <div className="text-xs sm:text-sm font-semibold bg-white text-orange-600 px-3 py-1 rounded-md shadow-sm">
            {loading
              ? "⏳ " + (translate("loading") || "Đang tải...")
              : piPrice
              ? `π1 ≈ ${piPrice.toFixed(2)} USDT`
              : "⚠️ " + (translate("no_data") || "Không có dữ liệu")}
          </div>
        </div>

        {/* 3) 🔍 Tìm kiếm → 4) 🌐 Ngôn ngữ (phải) */}
        <div className="flex items-center gap-3">
          <button
            onClick={goSearch}
            aria-label="Tìm kiếm"
            className="hover:text-yellow-300 transition"
          >
            <Search size={22} />
          </button>
          <Link
            href="/language"
            aria-label="Ngôn ngữ"
            className="hover:text-yellow-300 transition"
          >
            <Globe size={22} />
          </Link>
        </div>
      </div>
    </header>
  );
}
