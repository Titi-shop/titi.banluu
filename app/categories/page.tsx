"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

export default function CategoryPage() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories", { cache: "no-store" });
        if (!res.ok) throw new Error("API lỗi");

        const data = await res.json();
        const sorted = data.sort((a: any, b: any) => Number(a.id) - Number(b.id));
        setCategories(sorted);

      } catch (err) {
        console.error("❌ Lỗi tải danh mục:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCategories();
  }, []);

  return (
    <main className="p-4 max-w-6xl mx-auto">
      <button
        onClick={() => window.history.back()}
        className="text-orange-600 font-bold text-lg mb-3"
      >
        ←
      </button>

      <h1 className="text-2xl font-bold mb-4 text-orange-600">
        {t["category_title"] || "Danh mục sản phẩm"}
      </h1>

      {/* DANH MỤC TRƯỢT NGANG */}
      <div className="flex overflow-x-auto space-x-5 py-3 px-2 scrollbar-hide">
        {loading ? (
          <p className="text-gray-600">{t["loading"] || "Đang tải..."}</p>
        ) : categories.length === 0 ? (
          <p className="text-gray-500">{t["no_category"] || "Không có danh mục"}</p>
        ) : (
          categories.map((c) => {
            const key = "category_" + c.id;
            return (
              <Link
                key={c.id}
                href={`/category/${c.id}`}
                className="flex flex-col items-center min-w-[90px]"
              >
                <img
                  src={c.icon || "/placeholder.png"}
                  alt={t[key]}
                  className="w-16 h-16 rounded-full border object-cover"
                />
                <span className="text-sm text-center mt-2 truncate">
                  {t[key] || c.name}
                </span>
              </Link>
            );
          })
        )}
      </div>

      {/* LƯỚI DANH MỤC */}
      <h2 className="text-lg font-semibold text-gray-700 mt-6 mb-3">
        {t["all_categories"] || "Tất cả danh mục"}
      </h2>

      {loading ? (
        <p className="text-gray-600">{t["loading"] || "Đang tải..."}</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 pb-10">
          {categories.map((c) => {
            const key = "category_" + c.id;
            return (
              <Link
                key={c.id}
                href={`/category/${c.id}`}
                className="flex flex-col items-center"
              >
                <img
                  src={c.icon || "/placeholder.png"}
                  alt={t[key]}
                  className="w-16 h-16 rounded-full border object-cover"
                />
                <span className="mt-2 text-sm truncate">
                  {t[key] || c.name}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
