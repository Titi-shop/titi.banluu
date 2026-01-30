"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { ArrowLeft, ShoppingCart } from "lucide-react";

/* =======================
   TYPES
======================= */

interface ApiProduct {
  id: string;
  name: string;
  price: number;
  finalPrice?: number;
  description?: string;
  views?: number;
  sold?: number;
  images?: string[];
  category_id?: string | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  finalPrice: number;
  isSale: boolean;
  description: string;
  views: number;
  sold: number;
  images: string[];
  categoryId: string | null;
}

/* =======================
   PAGE
======================= */

export default function ProductDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addToCart, clearCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const quantity = 1;

  /* =======================
     LOAD PRODUCT
  ======================= */
  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch("/api/products");
        const data: ApiProduct[] = await res.json();

        const normalized: Product[] = data.map((p) => {
          const finalPrice =
            typeof p.finalPrice === "number"
              ? p.finalPrice
              : p.price;

          return {
            id: p.id,
            name: p.name,
            price: p.price,
            finalPrice,
            isSale: finalPrice < p.price,
            description: p.description ?? "",
            views: p.views ?? 0,
            sold: p.sold ?? 0,
            images: Array.isArray(p.images) ? p.images : [],
            categoryId: p.category_id ?? null,
          };
        });

        const found = normalized.find(
          (p) => p.id === id
        );

        if (found) {
          setProduct(found);
        }
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [id]);

  /* =======================
     STATES
  ======================= */
  if (loading) {
    return <p className="p-4">{t.loading}</p>;
  }

  if (!product) {
    return <p className="p-4">{t.no_products}</p>;
  }

  const images =
    product.images.length > 0
      ? product.images
      : ["/placeholder.png"];

  const next = () =>
    setCurrentIndex((i) =>
      (i + 1) % images.length
    );

  const prev = () =>
    setCurrentIndex((i) =>
      i === 0 ? images.length - 1 : i - 1
    );

  /* =======================
     ACTIONS
  ======================= */
  const add = () => {
    addToCart({ ...product, quantity });
    router.push("/cart");
  };

  const buy = () => {
    clearCart();
    addToCart({ ...product, quantity });
    router.push("/checkout");
  };

  /* =======================
     RENDER
  ======================= */
  return (
    <div className="pb-32 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow z-50 flex items-center justify-between px-4 py-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1"
        >
          <ArrowLeft size={20} />
          <span>{t.back}</span>
        </button>

        <h1 className="text-sm font-semibold line-clamp-1">
          {product.name}
        </h1>

        <button
          onClick={() => router.push("/cart")}
        >
          <ShoppingCart size={20} />
        </button>
      </div>

      {/* Images */}
      <div className="mt-14 relative w-full h-80 bg-white">
        <img
          src={images[currentIndex]}
          alt={product.name}
          className="w-full h-full object-cover"
        />

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white px-2 rounded"
            >
              ‹
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white px-2 rounded"
            >
              ›
            </button>

            <div className="absolute bottom-3 flex gap-2 w-full justify-center">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i === currentIndex
                      ? "bg-orange-500"
                      : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Info */}
      <div className="bg-white p-4 flex justify-between">
        <h2 className="text-lg font-medium">
          {product.name}
        </h2>

        <div className="text-right">
          <p className="text-xl font-bold text-orange-600">
            π {product.finalPrice}
          </p>

          {product.isSale && (
            <p className="text-sm text-gray-400 line-through">
              π {product.price}
            </p>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="bg-white px-4 pb-4 flex gap-4 text-gray-600 text-sm">
        <span>👁 {product.views}</span>
        <span>
          🛒 {product.sold} {t.orders}
        </span>
      </div>

      {/* Description */}
      <div className="bg-white p-4">
        {product.description || t.no_description}
      </div>

      {/* Actions */}
      <div className="fixed bottom-16 left-0 right-0 bg-white p-3 shadow flex gap-2 z-50">
        <button
          onClick={add}
          className="flex-1 bg-yellow-500 text-white py-2 rounded-md"
        >
          {t.add_to_cart}
        </button>
        <button
          onClick={buy}
          className="flex-1 bg-red-500 text-white py-2 rounded-md"
        >
          {t.buy_now}
        </button>
      </div>
    </div>
  );
}
