"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import BannerCarousel from "./components/BannerCarousel";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

/* =======================
   TYPES
======================= */

interface Product {
  id: string; // 🔥 UUID từ DB
  name: string;
  price: number;
  images?: string[];
  views?: number;
  sold?: number;
  finalPrice?: number;
  isSale?: boolean;
  categoryId?: string | null;
}

interface Category {
  id: string;
  name: string;
  icon?: string;
}

/* =======================
   PAGE
======================= */

export default function HomePage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [visibleCount, setVisibleCount] = useState(20);
  const [selectedCategory, setSelectedCategory] =
    useState<string | "all">("all");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  /* =======================
     LOAD CATEGORIES
  ======================= */
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data: Category[]) => setCategories(data))
      .finally(() => setLoadingCategories(false));
  }, []);

  /* =======================
     LOAD PRODUCTS
  ======================= */
  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data: Product[]) => {
        const normalized: Product[] = data.map((p) => ({
          ...p,
          views: p.views ?? 0,
          sold: p.sold ?? 0,
          finalPrice: p.finalPrice ?? p.price,
          isSale:
            typeof p.finalPrice === "number" &&
            p.finalPrice < p.price,
        }));

        setProducts(normalized);
        setFilteredProducts(normalized);
      })
      .finally(() => setLoadingProducts(false));
  }, []);

  /* =======================
     FILTER BY CATEGORY
  ======================= */
  useEffect(() => {
    let list = [...products];

    if (selectedCategory !== "all") {
      list = list.filter(
        (p) => p.categoryId === selectedCategory
      );
    }

    setFilteredProducts(list);
    setVisibleCount(20);
  }, [products, selectedCategory]);

  /* =======================
     LOADING
  ======================= */
  if (loadingProducts) {
    return (
      <p className="text-center mt-10">
        ⏳ {t.loading_products}
      </p>
    );
  }

  /* =======================
     RENDER
  ======================= */
  return (
    <main className="bg-gray-50 min-h-screen pb-24">
      <BannerCarousel />

      <div className="px-3 space-y-5 max-w-6xl mx-auto">
        {/* ===================
            CATEGORIES
        =================== */}
        <section>
          <h2 className="text-base font-semibold mb-2">
            {t.featured_categories}
          </h2>

          {loadingCategories ? (
            <p>{t.loading_categories}</p>
          ) : (
            <div className="flex overflow-x-auto space-x-4 scrollbar-hide">
              {/* ALL */}
              <button
                onClick={() => setSelectedCategory("all")}
                className={`min-w-[56px] h-[56px] flex items-center justify-center rounded-full border ${
                  selectedCategory === "all"
                    ? "border-orange-600 text-orange-600"
                    : "border-gray-300 text-gray-500"
                }`}
                title={t.all}
              >
                🛍
              </button>

              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`min-w-[72px] text-xs text-center ${
                    selectedCategory === c.id
                      ? "font-bold text-orange-600"
                      : "text-gray-600"
                  }`}
                >
                  <Image
                    src={c.icon || "/placeholder.png"}
                    alt={c.name}
                    width={56}
                    height={56}
                    className="rounded-full mx-auto mb-1 border"
                  />
                  <span className="line-clamp-1">
                    {t["category_" + c.id] || c.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ===================
            PRODUCTS
        =================== */}
        <section>
          <h2 className="text-base font-bold mb-2">
            {t.all_products}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredProducts
              .slice(0, visibleCount)
              .map((p) => (
                <div
                  key={p.id}
                  onClick={() =>
                    router.push(`/product/${p.id}`)
                  }
                  className="bg-white rounded-xl border shadow-sm cursor-pointer hover:shadow-md transition"
                >
                  <div className="relative">
                    <Image
                      src={p.images?.[0] || "/placeholder.png"}
                      alt={p.name}
                      width={300}
                      height={300}
                      className="w-full h-36 object-cover rounded-t-xl"
                    />

                    {/* 👁 Views */}
                    <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-2 py-[2px] rounded-full">
                      👁 {p.views}
                    </div>

                    {/* 🛒 Sold */}
                    {p.sold && p.sold > 0 && (
                      <div className="absolute top-1 right-1 bg-orange-600 text-white text-[10px] px-2 py-[2px] rounded-full">
                        🛒 {p.sold}
                      </div>
                    )}
                  </div>

                  <div className="p-2 space-y-1">
                    <p className="text-sm font-medium line-clamp-2">
                      {p.name}
                    </p>

                    <div className="flex items-center gap-1">
                      <span className="text-orange-600 font-bold text-sm">
                        {p.finalPrice} π
                      </span>

                      {p.isSale && (
                        <span className="text-xs text-gray-400 line-through">
                          {p.price} π
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {visibleCount < filteredProducts.length && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() =>
                  setVisibleCount((v) => v + 20)
                }
                className="px-6 py-2 bg-orange-600 text-white rounded-full text-sm"
              >
                {t.load_more}
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
