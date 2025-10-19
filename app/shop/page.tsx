"use client";

import { useLanguage } from "../context/LanguageContext";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ShopPage() {
  const { translate } = useLanguage(); // ✅ Dùng đa ngôn ngữ
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("❌ Lỗi khi tải sản phẩm:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <main className="p-4 max-w-6xl mx-auto">
      {/* 🏷 Tiêu đề */}
      <h1 className="text-2xl font-bold mb-4 text-orange-500">
        🛍️ {translate("shop_title")}
      </h1>

      {loading ? (
        <p className="text-gray-600">⏳ {translate("loading") || "Đang tải sản phẩm..."}</p>
      ) : products.length === 0 ? (
        <p className="text-gray-500">{translate("no_products") || "Chưa có sản phẩm nào."}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.id}`}
              className="border rounded-xl shadow hover:shadow-lg transition p-3 flex flex-col bg-white"
            >
              <img
                src={p.images?.[0] || "/placeholder.png"}
                alt={p.name}
                className="rounded-md w-full h-40 object-cover"
              />
              <h3 className="font-semibold mt-2 text-gray-800 line-clamp-2">{p.name}</h3>
              <p className="text-orange-500 font-medium mt-1">
                {translate("product_price")}: {p.price} Pi
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
