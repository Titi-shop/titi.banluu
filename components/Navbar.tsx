"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "../app/context/LanguageContext";
import { ShoppingCart, Globe } from "lucide-react";
import { useRouter } from "next/navigation";

// ✅ Dịch vụ lấy giá Pi
class PiPriceService {
  static async getPiPrice() {
    try {
      // Option 1: GCV Fixed Price (ổn định)
      const gcvPrice = 314159; // $314,159 USD / 1 Pi

      // Option 2 (tùy chọn): Lấy từ API ngoài nếu muốn realtime
      // const response = await fetch('https://api.pi-price.com/current');
      // const data = await response.json();
      // return data.price;

      return gcvPrice;
    } catch (error) {
      console.error("Error fetching Pi price:", error);
      return 314159; // fallback GCV
    }
  }

  static formatPrice(price, currency = "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }

  static formatPriceVND(priceUSD) {
    const usdToVnd = 23000; // tỷ giá USD → VND
    const priceVND = priceUSD * usdToVnd;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(priceVND);
  }
}

export default function Navbar() {
  const { translate } = useLanguage();
  const [piPrice, setPiPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSeller, setIsSeller] = useState(false);
  const router = useRouter();

  // 📈 Lấy giá Pi (ổn định bằng PiPriceService)
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const price = await PiPriceService.getPiPrice();
        setPiPrice(price);
      } catch (err) {
        console.error("Lỗi khi lấy giá Pi:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
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

          {/* 🟡 Nút Đăng hàng (chỉ hiện khi là seller) */}
          {isSeller && (
            <button
              onClick={() => router.push("/seller")}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-3 py-1 rounded-lg text-sm"
            >
              🛒 Đăng hàng
            </button>
          )}
        </div>

        {/* 💰 Giá Pi */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            {translate("pi_price") ?? "Pi Network"}
          </p>
          <p className="text-lg font-semibold text-yellow-600">
            {loading
              ? "Đang cập nhật..."
              : piPrice
              ? PiPriceService.formatPrice(piPrice, "USD")
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
