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
        console.error("❌ Load data error:", err);
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
    <main className="max-w-7xl mx-auto">
      {/* =========================
          BANNER
      ========================= */}
      <div className="mx-4 mt-4 rounded-2xl overflow-hidden shadow-xl">
        <img
          src="/banners/30FD1BCC-E31C-4702-9E63-8BF08C5E311C.png"
          alt="Banner"
          className="w-full h-[170px] sm:h-[260px] md:h-[400px] object-cover"
        />
      </div>

      {/* =========================
          CONTENT
      ========================= */}
      <div className="mt-4 grid grid-cols-12 gap-2 px-2 min-h-[120vh]">
        {/* ===== LEFT: AUTO LOOP CATEGORIES ===== */}
        <aside className="col-span-2 border-r h-[200vh] overflow-y-auto">
  <div className="flex flex-col items-center gap-3 py-2">
    {/* ALL */}
    <button
      onClick={() => setActiveCategoryId(null)}
      className={`flex flex-col items-center w-full ${
        activeCategoryId === null
          ? "text-orange-500 font-semibold"
          : "text-gray-600"
      }`}
    >
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border">
        <span className="text-sm">★</span>
      </div>
      <span className="text-[10px] mt-1 text-center">
        {t["all_categories"] || "Tất cả"}
      </span>
    </button>

    {[...categories, ...categories].map((c, index) => {
      const key = "category_" + c.id;
      const active =
        String(activeCategoryId) === String(c.id);

      return (
        <button
          key={`${c.id}-${index}`}
          onClick={() => setActiveCategoryId(c.id)}
          className={`flex flex-col items-center w-full ${
            active
              ? "text-orange-500 font-semibold"
              : "text-gray-600"
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-white border flex items-center justify-center">
            <img
              src={c.icon || "/placeholder.png"}
              alt={t[key] || c.name}
              className="w-6 h-6 object-contain"
            />
          </div>
          <span className="text-[10px] mt-1 text-center px-1 line-clamp-2">
            {t[key] || c.name}
          </span>
        </button>
      );
    })}
  </div>
</aside>
        {/* ===== RIGHT: PRODUCTS ===== */}
        <section className="col-span-10 px-3">
          {loading ? (
            <p className="text-gray-500 text-sm">
              {t["loading"] || "Đang tải..."}
            </p>
          ) : visibleProducts.length === 0 ? (
            <p className="text-gray-500 text-sm">
              {t["no_product"] || "Chưa có sản phẩm"}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {visibleProducts.map((p) => (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  className="bg-white border rounded-xl p-2 hover:shadow-md transition"
                >
                  <img
                    src={p.images?.[0] || "/placeholder.png"}
                    className="w-full h-36 object-cover rounded-lg"
                  />

                  <h3 className="mt-2 text-sm font-medium line-clamp-2">
                    {p.name}
                  </h3>

                  {p.isSale && typeof p.finalPrice === "number" ? (
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

      {/* =========================
          LOOP ANIMATION
      ========================= */}
      <style jsx global>{`
        @keyframes category-loop {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-50%);
          }
        }
        .animate-category-loop {
          animation: category-loop 20s linear infinite;
        }
      `}</style>
    </main>
  );
}
