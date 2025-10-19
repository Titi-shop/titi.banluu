"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "../app/context/LanguageContext";
import { ShoppingCart, Globe } from "lucide-react"; // Biểu tượng đẹp, dễ dùng

export default function Navbar() {
  const { translate } = useLanguage();
  const [piPrice, setPiPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // 📈 Lấy giá Pi Network từ API (hoặc mô phỏng)
  useEffect(() => {
    const fetchPiPrice = async () => {
      try {
        const res = await fetch("https://api.coincap.io/v2/assets/pi-network"); // API công khai
        const data = await res.json();
        const price = Number(data.data?.priceUsd ?? 0);
        setPiPrice(price);
      } catch (error) {
        console.error("Không thể lấy giá Pi:", error);
        // Dữ liệu mô phỏng fallback
        setPiPrice(32.1);
      } finally {
        setLoading(false);
      }
    };

    fetchPiPrice();
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
          <p className="text-sm text-gray-500">
            {translate("pi_price") ?? "Pi Network"}
          </p>
          <p className="text-lg font-semibold text-yellow-600">
            {loading
              ? "Đang cập nhật..."
              : piPrice
              ? `$${piPrice.toFixed(2)} USD`
              : "N/A"}
          </p>
        </div>

        {/* Ngôn ngữ */}
        <Link href="/language" className="text-gray-700 hover:text-yellow-500">
          <Globe size={24} />
        </Link>
      </div>
    </header>
  );
}
