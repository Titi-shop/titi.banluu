"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

interface Product {
  id: string;
  name: string;
  price: number;
  finalPrice?: number;
  isSale?: boolean;
  images?: string[];
  createdAt?: string;
}

interface Category {
  id: number;
  name: string;
  icon?: string;
}

export default function ShopPage() {
  const { t } = useTranslation();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [visible, setVisible] = useState(20);

  useEffect(() => {
    fetch("/api/categories", { cache: "no-store" })
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  useEffect(() => {
    fetch("/api/products", { cache: "no-store" })
      .then((r) => r.json())
      .then(setProducts);
  }, []);

  return (
    <main className="pb-20 bg-white min-h-screen">
      <img
        src="banners/30FD1BCC-E31C-4702-9E63-8BF08C5E311C.png"
        className="w-full h-40 object-cover"
      />

      <div className="px-3 mt-4 space-y-6">
        {/* CATEGORIES */}
        <section>
          <h2 className="font-semibold">
            {t.categories}
          </h2>
          <div className="flex overflow-x-auto gap-4">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.id}`}
                className="flex flex-col items-center"
              >
                <img
                  src={c.icon || "/placeholder.png"}
                  className="w-14 h-14 rounded-full"
                />
                <span className="text-sm">
                  {c.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* PRODUCTS */}
        <section>
          <h2 className="font-bold">
            {t.all_products}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {products.slice(0, visible).map((p) => (
              <Link
                key={p.id}
                href={`/product/${p.id}`}
                className="bg-white p-2 rounded-lg shadow border"
              >
                <img
                  src={p.images?.[0] || "/placeholder.png"}
                  className="w-full h-28 object-cover rounded"
                />

                <p className="text-sm font-semibold truncate">
                  {p.name}
                </p>

                <p className="text-orange-600 font-bold">
                  {p.finalPrice ?? p.price} π
                </p>

                {p.isSale && (
                  <p className="text-xs line-through text-gray-400">
                    {p.price} π
                  </p>
                )}
              </Link>
            ))}
          </div>

          {visible < products.length && (
            <div className="text-center mt-4">
              <button
                onClick={() =>
                  setVisible((v) => v + 20)
                }
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
