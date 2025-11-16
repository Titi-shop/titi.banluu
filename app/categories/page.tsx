// app/categories/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// 🧩 Hàm tạo slug từ tên danh mục (chuẩn SEO)
function toSlug(str: string) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // bỏ dấu tiếng Việt
    .toLowerCase()
    .replace(/\s+/g, "-") // thay dấu cách bằng -
    .replace(/[^\w-]+/g, ""); // bỏ ký tự lạ
}

export default function CategoryPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error("❌ Lỗi tải danh mục:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <main className="p-4 max-w-6xl mx-auto">

      {/* 🔙 BACK BUTTON */}
      <button
        onClick={() => window.history.back()}
        className="text-orange-600 font-bold text-lg mb-3"
      >
        ←
      </button>

      <h1 className="text-2xl font-bold mb-4 text-orange-600">
        Danh mục sản phẩm
      </h1>

      {/* Danh mục dạng trượt ngang */}
      <div className="flex overflow-x-auto space-x-5 py-3 px-2">
        {loading ? (
          <p className="text-gray-600">Đang tải...</p>
        ) : categories.length === 0 ? (
          <p className="text-gray-500">Không có danh mục</p>
        ) : (
          categories.map((c) => (
            <Link
              key={c.id}
              href={`/category/${toSlug(c.name)}`} // ⭐ ĐÃ ĐỔI TỪ ID → SLUG
              className="flex flex-col items-center min-w-[90px]"
            >
              <img
                src={c.icon || "/placeholder.png"}
                alt={c.name}
                className="w-16 h-16 rounded-full border object-cover"
              />
              <span className="text-sm text-center mt-2">{c.name}</span>
            </Link>
          ))
        )}
      </div>

      {/* ———————————————— */}
      {/* GRID DANH MỤC */}
      {/* ———————————————— */}
      <h2 className="text-lg font-semibold text-gray-700 mt-6 mb-3">
        Tất cả danh mục
      </h2>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 pb-10">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/category/${toSlug(c.name)}`} // ⭐ ĐÃ ĐỔI TỪ ID → SLUG
            className="flex flex-col items-center"
          >
            <img
              src={c.icon || "/placeholder.png"}
              alt={c.name}
              className="w-16 h-16 rounded-full border object-cover"
            />
            <span className="mt-2 text-sm">{c.name}</span>
          </Link>
        ))}
      </div>

    </main>
  );
}
