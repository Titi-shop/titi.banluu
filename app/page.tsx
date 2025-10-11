"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/add-product", { cache: "no-store" });
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("❌ Lỗi khi tải sản phẩm:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (loading) return <p className="text-center mt-10">⏳ Đang tải sản phẩm...</p>;

  return (
    <main className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-6">
        🛍️ Danh sách sản phẩm
      </h1>

      {products.length === 0 ? (
        <p className="text-center text-gray-500">Chưa có sản phẩm nào.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="block border rounded-lg shadow hover:shadow-lg transition"
            >
              {product.images?.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-40 object-cover rounded-t-lg"
                />
              ) : (
                <div className="w-full h-40 bg-gray-200 flex items-center justify-center text-gray-500 rounded-t-lg">
                  Không có ảnh
                </div>
              )}
              <div className="p-3">
                <h2 className="font-semibold truncate">{product.name}</h2>
                <p className="text-yellow-600 font-bold text-sm">
                  {product.price} π
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
