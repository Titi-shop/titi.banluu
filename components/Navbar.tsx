"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "../app/context/LanguageContext";
import { ShoppingCart, Globe } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { translate } = useLanguage();
  const [piPrice, setPiPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSeller, setIsSeller] = useState(false);
  const router = useRouter();

  // 📈 Lấy giá Pi Network từ API
  useEffect(() => {
    const fetchPiPrice = async () => {
      try {
        const res = await fetch("https://api.coincap.io/v2/assets/pi-network");
        const data = await res.json();
        const price = Number(data.data?.priceUsd ?? 0);
        setPiPrice(price);
      } catch (error) {
        console.error("Không thể lấy giá Pi:", error);
        setPiPrice(32.1); // fallback
      } finally {
        setLoading(false);
      }
    };

    fetchPiPrice();
  }, []);

  // 👤 Kiểm tra tài khoản đăng nhập để hiển thị nút "Đăng hàng"
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("pi_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const username = parsed?.user?.username;
        if (username === "nguyenminhduc1991111") {
          setIsSeller(true);
        }
      }
    } catch (err) {
      console.error("Lỗi đọc pi_user:", err);
    }
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b shadow-sm z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          {/* 🛒 Giỏ hàng */}
          <Link href="/cart" className="text-gray-700 hover:text-yellow-500">
            <ShoppingCart size={24} />
          </Link>

          {/* 🟡 Nút Đăng hàng (chỉ hiện khi là admin nguyenminhduc1991111) */}
          {isSeller && (
            <button
              onClick={() => router.push("/seller")}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-3 py-1 rounded-lg text-sm"
            >
              🛒 Đăng hàng
            </button>
          )}
        </div>

        {/* 💰 Giá Pi Network */}
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

        {/* 🌐 Ngôn ngữ */}
        <Link href="/language" className="text-gray-700 hover:text-yellow-500">
          <Globe size={24} />
        </Link>
      </div>
    </header>
  );
}
