"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react"; // 🟠 icon địa cầu từ lucide-react

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [piPrice, setPiPrice] = useState<number | null>(null);

  // 🧭 Lấy danh sách sản phẩm khi mở trang
  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Lỗi tải sản phẩm:", err);
        setLoading(false);
      });
  }, []);

  // 🌐 Lấy giá Pi Network (ví dụ từ API ngoài, hoặc tạm gán)
  useEffect(() => {
    async function fetchPiPrice() {
      try {
        // 🚀 Bạn có thể thay bằng API thật, ví dụ: https://api.coinpaprika.com/v1/tickers/pi-network-pi
        const res = await fetch("https://api.coinpaprika.com/v1/tickers/pi-network-pi");
        const data = await res.json();
        setPiPrice(Number(data.quotes.USD.price.toFixed(2)));
      } catch (err) {
        console.warn("⚠️ Không thể lấy giá Pi, dùng giá mặc định.");
        setPiPrice(35.0); // Giá mặc định tạm
      }
    }
    fetchPiPrice();
  }, []);

  // 💬 Khi đang tải dữ liệu
  if (loading) {
    return <p className="text-center mt-10">⏳ Đang tải sản phẩm...</p>;
  }

  // 💬 Khi không có sản phẩm
  if (products.length === 0) {
    return <p className="text-center mt-10 text-gray-500">Chưa có sản phẩm nào.</p>;
  }

  // ✅ Giao diện chính
  return (
    <main className="p-6 relative min-h-screen">
      {/* 🟠 Thanh tiêu đề phía trên */}
      <div className="flex justify-center items-center mb-8 relative">
        {/* 🌐 Icon địa cầu góc phải */}
        <button
          onClick={() => router.push("/language")}
          className="absolute right-0 top-0 text-gray-600 hover:text-orange-500 transition"
          title="Thay đổi ngôn ngữ"
        >
          <Globe size={28} />
        </button>

        {/* 💰 Giá Pi */}
        <div className="text-center">
          <p className="text-xl font-bold text-orange-600">
            {piPrice ? `${piPrice} USD / Pi` : "Đang cập nhật giá Pi..."}
          </p>
        </div>
      </div>

      {/* 🛍 Danh sách sản phẩm */}
      <h1 className="text-2xl font-bold text-center mb-6">🛍 Danh sách sản phẩm</h1>

      <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-6">
        {products.map((p) => {
          const hasImages = p.images && p.images.length > 0;

          return (
            <div
              key={p.id}
              onClick={() => router.push(`/product/${p.id}`)}
              className="border rounded-lg shadow hover:shadow-lg transition bg-white p-4 cursor-pointer"
            >
              {/* Ảnh sản phẩm */}
              {hasImages ? (
                <div className="flex gap-2 overflow-x-auto mb-3">
                  {p.images.map((img: string, idx: number) => (
                    <img
                      key={idx}
                      src={img.startsWith("/uploads") ? img : `/uploads/${img}`}
                      alt={p.name}
                      className="w-24 h-24 object-cover rounded border"
                    />
                  ))}
                </div>
              ) : (
                <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-gray-400 mb-3 rounded">
                  Không có ảnh
                </div>
              )}

              {/* Thông tin */}
              <h2 className="font-semibold text-lg">{p.name}</h2>
              <p className="text-yellow-600 font-bold">{p.price} Pi</p>
              <p className="text-gray-500 text-sm mt-1">{p.description}</p>
            </div>
          );
        })}
      </div>
    </main>
  );
}
