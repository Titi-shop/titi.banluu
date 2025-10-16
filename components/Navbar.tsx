"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "../app/context/LanguageContext";
import { ShoppingCart, Globe } from "lucide-react";

export default function Navbar() {
  const { translate } = useLanguage();
  const [piData, setPiData] = useState<{ price: number; change: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔄 Hàm lấy giá Pi trực tiếp (API cập nhật nhanh và ổn định)
  const fetchPiPrice = async () => {
    try {
      const res = await fetch("https://api.coinpaprika.com/v1/tickers/pi-network-pi");
      if (!res.ok) throw new Error("Không thể kết nối API");
      const data = await res.json();

      const price = data?.quotes?.USD?.price ?? 0;
      const change = data?.quotes?.USD?.percent_change_24h ?? 0;

      setPiData({ price, change });
    } catch (err) {
      console.error("Lỗi khi lấy giá Pi:", err);
      // fallback nếu lỗi
      setPiData({ price: 0.21042, change: -2.6 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPiPrice(); // lần đầu
    const interval = setInterval(fetchPiPrice, 5 * 60 * 1000); // cập nhật mỗi 5 phút
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b shadow-sm z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-2">
        {/* Giỏ hàng */}
        <Link href="/cart" className="text-gray-700 hover:text-yellow-500">
          <ShoppingCart size={24} />
        </Link>

        {/* Giá Pi Network */}
        <div className="text-center">
          <p className="text-sm text-gray-500">Pi Network</p>

          {loading || !piData ? (
            <p className="text-yellow-600 text-lg">Đang cập nhật...</p>
          ) : (
            <>
              <p className="text-lg font-semibold text-yellow-600">
                ${piData.price.toFixed(5)}
              </p>
              <p
                className={`text-xs ${
                  piData.change >= 0 ? "text-green-600" : "text-red-500"
                }`}
              >
                {piData.change.toFixed(1)}% 24hr
              </p>
            </>
          )}
        </div>

        {/* Ngôn ngữ */}
        <Link href="/language" className="text-gray-700 hover:text-yellow-500">
          <Globe size={24} />
        </Link>
      </div>
    </header>
  );
}
