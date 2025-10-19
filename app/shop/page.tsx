"use client";

import { useLanguage } from "../context/LanguageContext";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ShopPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Lấy danh sách sản phẩm từ API của bạn
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Lỗi khi tải sản phẩm:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <main className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-orange-500">🛍️ Danh mục sản phẩm</h1>

      {loading ? (
        <p>⏳ Đang tải sản phẩm...</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.id}`}
              className="border rounded-xl shadow hover:shadow-lg transition p-3 flex flex-col"
            >
              <img
                src={p.images?.[0] || "/placeholder.png"}
                alt={p.name}
                className="rounded-md w-full h-40 object-cover"
              />
              <h3 className="font-semibold mt-2 text-gray-800">{p.name}</h3>
              <p className="text-orange-500 font-medium">{p.price} Pi</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
