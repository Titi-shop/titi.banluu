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
  images?: string[];
  categoryId: number | string;
  createdAt?: string;
};

/* =========================
   CLIENT PAGE
========================= */
export default function CategoriesClient() {
  const { t } = useTranslation();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategoryId, setActiveCategoryId] =
    useState<number | string | null>(null);
  const [loading, setLoading] = useState(true);

  /* =========================
     LOAD DATA (CLIENT ONLY)
  ========================= */
  useEffect(() => {
    Promise.all([
      fetch("/api/categories", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/products", { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([cateData, prodData]: [Category[], Product[]]) => {
        setCategories(
          [...cateData].sort((a, b) => Number(a.id) - Number(b.id))
        );

        setProducts(
          [...prodData].sort((a, b) => {
            const at = a.createdAt ?? "";
            const bt = b.createdAt ?? "";
            return bt.localeCompare(at);
          })
        );
      })
      .finally(() => setLoading(false));
  }, []);

  /* =========================
     FILTER
  ========================= */
  const visibleProducts = useMemo(() => {
    if (activeCategoryId === null) return products;
    return products.filter(
      (p) => String(p.categoryId) === String(activeCategoryId)
    );
  }, [products, activeCategoryId]);

  return (
    <main className="bg-gradient-to-b from-orange-50 to-white min-h-screen pb-24">
      {/* =========================
          BANNER
      ========================= */}
      <div className="px-3 mt-4">
        <img
          src="/banners/30FD1BCC-E31C-4702-9E63-8BF08C5E311C.png"
          alt="Banner"
          className="w-full h-[160px] rounded-3xl object-cover shadow-md"
        />
      </div>

      {/* =========================
          CONTENT
      ========================= */}
      <div className="mt-4 grid grid-cols-12 gap-2 px-2">
        {/* ===== LEFT: CATEGORY ===== */}
        <aside className="col-span-2 overflow-y-auto">
          <div className="flex flex-col items-center gap-4 py-2">
            <button
              onClick={() => setActiveCategoryId(null)}
              className={`text-xs px-2 py-1 rounded-full ${
                activeCategoryId === null
                  ? "bg-orange-500 text-white"
                  : "text-gray-500"
              }`}
            >
              🛍 {t("all")}
            </button>

            {categories.map((c) => {
              const active =
                String(activeCategoryId) === String(c.id);

              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCategoryId(c.id)}
                  className={`flex flex-col items-center gap-1 ${
                    active
                      ? "text-orange-600 font-semibold"
                      : "text-gray-500"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      active ? "bg-orange-100" : "bg-gray-100"
                    }`}
                  >
                    <img
                      src={c.icon || "/placeholder.png"}
                      alt={t(`category_${c.id}`)}
                      className="w-6 h-6 object-contain"
                    />
                  </div>
                  <span className="text-[10px] text-center line-clamp-2">
                    {t(`category_${c.id}`)}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ===== RIGHT: PRODUCTS ===== */}
        <section className="col-span-10 px-2">
          {loading ? (
            <p className="text-sm text-gray-400">
              {t("loading_products")}
            </p>
          ) : visibleProducts.length === 0 ? (
            <p className="text-sm text-gray-400">
              {t("no_product")}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {visibleProducts.map((p) => {
                const isSale =
                  typeof p.finalPrice === "number" &&
                  p.finalPrice < p.price;

                const discount =
                  isSale && p.finalPrice
                    ? Math.round(
                        ((p.price - p.finalPrice) / p.price) * 100
                      )
                    : 0;

                return (
                  <Link
                    key={p.id}
                    href={`/product/${p.id}`}
                    className="group"
                  >
                    <div className="relative overflow-hidden rounded-2xl">
                      {/* SALE BADGE */}
                      {isSale && (
                        <div className="absolute top-2 right-2 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow">
                          -{discount}%
                        </div>
                      )}

                      <img
                        src={p.images?.[0] || "/placeholder.png"}
                        className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    <p className="mt-1 text-sm font-medium line-clamp-2">
                      {p.name}
                    </p>

                    <div className="flex items-center gap-1">
                      <span className="text-orange-600 font-semibold">
                        {(isSale ? p.finalPrice : p.price)?.toLocaleString()} π
                      </span>

                      {isSale && (
                        <span className="text-xs text-gray-400 line-through">
                          {p.price.toLocaleString()} π
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
