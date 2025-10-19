"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingCart, Globe } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [isSeller, setIsSeller] = useState(false);
  const [piPrice, setPiPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
      console.error("⚠️ Lỗi đọc pi_user:", err);
    }
  }, []);

  // 💰 Lấy giá Pi từ API /api/pi-price
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch("/api/pi-price");
        const data = await res.json();
        if (data?.price_usd) {
          setPiPrice(parseFloat(data.price_usd));
        }
      } catch (error) {
        console.error("⚠️ Lỗi khi lấy giá Pi:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 5 * 60 * 1000); // cập nhật mỗi 5 phút
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b shadow-sm z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          {/* 🛒 Giỏ hàng */}
          <Link href="/cart" className="text-gray-700 hover:text-yellow-500">
            <ShoppingCart size={24} />
          </Link>

          {/* 🟡 Nút Đăng hàng (chỉ hiện với tài khoản admin/seller) */}
          {isSeller && (
            <button
              onClick={() => router.push("/seller")}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-3 py-1 rounded-lg text-sm"
            >
              🔘Đăng hàng
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* 💰 Hiển thị giá Pi */}
          <div className="text-sm text-purple-700 font-semibold bg-purple-50 px-2 py-1 rounded-md">
            {loading ? (
              "⏳ Đang tải..."
            ) : piPrice ? (
              <>💰 1 PI ≈ {piPrice.toFixed(2)} USDT</>
            ) : (
              "⚠️ Không có giá"
            )}
          </div>

          {/* 🌐 Ngôn ngữ */}
          <Link href="/language" className="text-gray-700 hover:text-yellow-500">
            <Globe size={24} />
          </Link>
        </div>
      </div>
    </header>
  );
}
