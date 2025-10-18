"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  images: string[];
  createdAt: string;
}

export default function SellerStockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Gọi API lấy danh sách sản phẩm
  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products", { cache: "no-store" });
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("❌ Lỗi tải sản phẩm:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">📦 Kho sản phẩm của bạn</h1>

      <div className="flex justify-between mb-4">
        <Link
          href="/seller/post"
          className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded"
        >
          ➕ Đăng sản phẩm mới
        </Link>

        <button
          onClick={fetchProducts}
          className="bg-gray-300 hover:bg-gray-400 text-black py-2 px-4 rounded"
        >
          🔄 Làm mới
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-600">⏳ Đang tải sản phẩm...</p>
      ) : products.length === 0 ? (
        <p className="text-center text-gray-600">Chưa có sản phẩm nào.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((p) => (
            <div key={p.id} className="border rounded-lg p-4 shadow bg-white">
              {p.images && p.images[0] && (
                <Image
                  src={p.images[0]}
                  alt={p.name}
                  width={300}
                  height={300}
                  className="object-cover rounded mb-2"
                />
              )}
              <h2 className="font-bold text-lg">{p.name}</h2>
              <p className="text-gray-700">💰 Giá: {p.price} Pi</p>
              <p className="text-sm text-gray-600 mt-1">{p.description}</p>
              <p className="text-xs text-gray-400 mt-2">
                🕒 {new Date(p.createdAt).toLocaleString("vi-VN")}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
