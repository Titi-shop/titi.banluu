"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <p className="text-center mt-10 text-gray-600">⏳ Đang tải sản phẩm...</p>;
  }

  if (products.length === 0) {
    return <p className="text-center mt-10 text-gray-500">Chưa có sản phẩm nào.</p>;
  }

  return (
    <main className="bg-gray-50 min-h-screen pb-20">
      {/* 🧭 Thanh điều hướng trên */}
      <Navbar />

      {/* 🛍 Tiêu đề */}
      <h1 className="text-xl font-bold text-center mt-6 mb-4 text-gray-800">
        🛍 Danh sách sản phẩm
      </h1>

      {/* 🔳 Lưới sản phẩm */}
      <div className="grid gap-4 px-3 sm:px-6 
                      grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {products.map((p) => {
          const hasImages = p.images && p.images.length > 0;
          const firstImage = hasImages ? (p.images[0].startsWith("/uploads") ? p.images[0] : `/uploads/${p.images[0]}`) : null;

          return (
            <div
              key={p.id}
              onClick={() => router.push(`/product/${p.id}`)}
              className="bg-white rounded-xl shadow hover:shadow-lg transition-all cursor-pointer border border-gray-100 p-3 flex flex-col"
            >
              {/* 🖼 Ảnh sản phẩm */}
              {firstImage ? (
                <img
                  src={firstImage}
                  alt={p.name}
                  className="w-full aspect-square object-cover rounded-lg mb-2"
                />
              ) : (
                <div className="w-full aspect-square bg-gray-100 flex items-center justify-center text-gray-400 rounded-lg mb-2">
                  Không có ảnh
                </div>
              )}

              {/* 📦 Thông tin */}
              <div className="flex-grow flex flex-col justify-between">
                <h2 className="font-semibold text-sm sm:text-base text-gray-800 line-clamp-2 leading-tight">
                  {p.name}
                </h2>
                <p className="text-orange-600 font-bold text-sm sm:text-base mt-1">
                  {p.price} Pi
                </p>
                {p.description && (
                  <p className="text-gray-500 text-xs mt-1 line-clamp-2">
                    {p.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
