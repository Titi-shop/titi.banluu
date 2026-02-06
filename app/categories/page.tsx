"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

/* =========================
   TYPES
========================= */
type Category = {
  id: number | string;
  name: string;
  icon?: string | null;
};

type Product = {
  id: number | string;
  name: string;
  price: number;
  finalPrice?: number;
  isSale?: boolean;
  images?: string[];
  categoryId: number | string;
  createdAt: string;
};

/* =========================
   PAGE
========================= */
export default function CategoriesPage() {
  const { t } = useTranslation();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<
    number | string | null
  >(null);
  const [loading, setLoading] = useState(true);

  /* =========================
     LOAD DATA
  ========================= */
  useEffect(() => {
    async function loadData() {
      try {
        const [resCate, resProd] = await Promise.all([
          fetch("/api/categories", { cache: "no-store" }),
          fetch("/api/products", { cache: "no-store" }),
        ]);

        if (!resCate.ok || !resProd.ok) {
          throw new Error("API lỗi");
        }

        const cateData: Category[] = await resCate.json();
        const prodData: Product[] = await resProd.json();

        setCategories(
          [...cateData].sort(
            (a, b) => Number(a.id) - Number(b.id)
          )
        );

        setProducts(
          [...prodData].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime()
          )
        );
      } catch (err) {
        console.error("❌ Load categories/products error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  /* =========================
     FILTER PRODUCTS
  ========================= */
  const visibleProducts = useMemo(() => {
    if (!activeCategoryId) return products;
    return products.filter(
      (p) => String(p.categoryId) === String(activeCategoryId)
    );
  }, [products, activeCategoryId]);

  return (
    <main className="max-w-7xl mx-auto p-4">
      {/* =========================
          BANNER
      ========================= */}
      <div className="mb-6 rounded-xl overflow-hidden shadow">
        <img
          src="/banner.png"
          alt="Banner"
          className="w-full h-40 object-cover"
        />
      </div>

      {/* =========================
          CONTENT
      ========================= */}
      <div className="grid grid-cols-12 gap-4">
        {/* ===== LEFT: CATEGORIES ===== */}
        <aside className="col-span-4 sm:col-span-3 md:col-span-2">
          <h2 className="font-semibold text-gray-700 mb-3">
            {t["category_title"] || "Danh mục"}
          </h2>

          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setActiveCategoryId(null)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                  activeCategoryId === null
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {t["all_categories"] || "Tất cả"}
              </button>
            </li>

            {categories.map((c) => {
              const key = "category_" + c.id;
              const active =
                String(activeCategoryId) === String(c.id);

              return (
                <li key={c.id}>
                  <button
                    onClick={() => setActiveCategoryId(c.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm truncate ${
                      active
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {t[key] || c.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* ===== RIGHT: PRODUCTS ===== */}
        <section className="col-span-8 sm:col-span-9 md:col-span-10">
          {loading ? (
            <p className="text-gray-500">
              {t["loading"] || "Đang tải..."}
            </p>
          ) : visibleProducts.length === 0 ? (
            <p className="text-gray-500">
              {t["no_product"] || "Chưa có sản phẩm"}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {visibleProducts.map((p) => (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  className="border rounded-lg p-2 hover:shadow-md transition bg-white"
                >
                  <img
                    src={p.images?.[0] || "/placeholder.png"}
                    className="w-full h-32 object-cover rounded"
                  />

                  <h3 className="mt-2 text-sm font-medium truncate">
                    {p.name}
                  </h3>

                  {p.isSale &&
                  typeof p.finalPrice === "number" ? (
                    <>
                      <p className="text-red-600 font-semibold">
                        {p.finalPrice.toLocaleString()} π
                      </p>
                      <p className="text-xs line-through text-gray-400">
                        {p.price.toLocaleString()} π
                      </p>
                    </>
                  ) : (
                    <p className="text-orange-600 font-semibold">
                      {p.price.toLocaleString()} π
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
