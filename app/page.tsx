"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import BannerCarousel from "./components/BannerCarousel";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

interface Product {
  id: number;
  name: string;
  price: number;
  images?: string[];
  views?: number;
  sold?: number;
  finalPrice?: number;
  isSale?: boolean;
  categoryId?: number | null;
}

interface Category {
  id: number;
  name: string;
  icon?: string;
}

export default function HomePage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [visibleCount, setVisibleCount] = useState(20);
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then(setCategories)
      .finally(() => setLoadingCategories(false));
  }, []);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data: Product[]) => {
        const normalized = data.map((p) => ({
          ...p,
          views: p.views ?? 0,
          sold: p.sold ?? 0,
          finalPrice: p.finalPrice ?? p.price,
        }));

        setProducts(normalized);
        setFilteredProducts(normalized);
      })
      .finally(() => setLoadingProducts(false));
  }, []);

  useEffect(() => {
    let list = [...products];
    if (selectedCategory !== "all") {
      list = list.filter((p) => p.categoryId === selectedCategory);
    }
    setFilteredProducts(list);
    setVisibleCount(20);
  }, [products, selectedCategory]);

  if (loadingProducts) {
    return <p className="text-center mt-10">⏳ {t.loading_products}</p>;
  }

  return (
    <main className="bg-gray-50 min-h-screen pb-24">
      <BannerCarousel />

      <div className="px-3 space-y-4 max-w-6xl mx-auto">
        {/* Categories */}
        <section>
          <h2 className="text-base font-semibold">{t.featured_categories}</h2>
          {loadingCategories ? (
            <p>{t.loading_categories}</p>
          ) : (
            <div className="flex overflow-x-auto space-x-4 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`min-w-[70px] text-xs ${
                  selectedCategory === "all"
                    ? "font-bold text-orange-600"
                    : ""
                }`}
              >
                🛍 {t.all}
              </button>

              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`min-w-[70px] text-xs ${
                    selectedCategory === c.id
                      ? "font-bold text-orange-600"
                      : ""
                  }`}
                >
                  <Image
                    src={c.icon || "/placeholder.png"}
                    alt={t["category_" + c.id] || c.name}
                    width={56}
                    height={56}
                    className="rounded-full mx-auto"
                  />
                  <span>{t["category_" + c.id] || c.name}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Products */}
        <section>
          <h2 className="text-base font-bold">{t.all_products}</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredProducts.slice(0, visibleCount).map((p) => (
              <div
                key={p.id}
                onClick={() => router.push(`/product/${p.id}`)}
                className="bg-white rounded-xl shadow border cursor-pointer"
              >
                <Image
                  src={p.images?.[0] || "/placeholder.png"}
                  alt={p.name}
                  width={300}
                  height={200}
                  className="w-full h-32 object-cover rounded"
                />
                <div className="p-2">
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-orange-600 font-bold">
                    {p.finalPrice} π
                  </p>
                </div>
              </div>
            ))}
          </div>

          {visibleCount < filteredProducts.length && (
            <div className="flex justify-center mt-3">
              <button
                onClick={() => setVisibleCount((p) => p + 20)}
                className="px-6 py-2 bg-orange-600 text-white rounded-full"
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
