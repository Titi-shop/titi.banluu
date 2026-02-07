"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart } from "lucide-react";

import { useCart } from "../../context/CartContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import CheckoutSheet from "./CheckoutSheet";

/* =======================
   TYPES
======================= */

interface ApiProduct {
  id: string;
  name: string;
  price: number;
  finalPrice?: number;
  description?: string;
  detail?: string;
  views?: number;
  sold?: number;
  images?: string[];
  detailImages?: string[];
  categoryId?: string | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  finalPrice: number;
  isSale: boolean;
  description: string;
  detail: string;
  views: number;
  sold: number;
  images: string[];
  detailImages: string[];
  categoryId: string | null;
}

/* =======================
   PAGE
======================= */

export default function ProductDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openCheckout, setOpenCheckout] = useState(false);

  /* =======================
     LOAD PRODUCT
  ======================= */
  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch("/api/products");
        const data: unknown = await res.json();

        if (!Array.isArray(data)) return;

        const found = data.find(
          (p: ApiProduct) => String(p.id) === String(id)
        ) as ApiProduct | undefined;

        if (!found) return;

        const finalPrice =
          typeof found.finalPrice === "number"
            ? found.finalPrice
            : found.price;

        setProduct({
          id: found.id,
          name: found.name,
          price: found.price,
          finalPrice,
          isSale: finalPrice < found.price,
          description: found.description ?? "",
          detail: found.detail ?? "",
          views: found.views ?? 0,
          sold: found.sold ?? 0,
          images: Array.isArray(found.images) ? found.images : [],
          detailImages: Array.isArray(found.detailImages)
            ? found.detailImages
            : [],
          categoryId: found.categoryId ?? null,
        });
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [id]);

  if (loading) return <p className="p-4">{t.loading}</p>;
  if (!product) return <p className="p-4">{t.no_products}</p>;

  const images =
    product.images.length > 0
      ? product.images
      : ["/placeholder.png"];

  /* =======================
     ACTIONS
  ======================= */
  const handleAddToCart = () => {
    addToCart({
      ...product,
      quantity: 1,
      price: product.finalPrice, // 🔴 QUAN TRỌNG: dùng giá sale
    });
    router.push("/cart");
  };

  const handleBuyNow = () => {
    addToCart({
      ...product,
      quantity: 1,
      price: product.finalPrice, // 🔴 GIÁ SALE
    });
    setOpenCheckout(true);
  };

  /* =======================
     RENDER
  ======================= */
  return (
    <div className="pb-32 bg-gray-50 min-h-screen">

      {/* IMAGES */}
      <div className="mt-14 relative w-full h-80 bg-white">
        <img
          src={images[currentIndex]}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* INFO */}
      <div className="bg-white p-4 flex justify-between">
        <h2 className="text-lg font-medium">{product.name}</h2>

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

      {/* DESCRIPTION */}
      <div className="bg-white p-4">
        {product.description || t.no_description}
      </div>

      {/* ACTIONS */}
      <div className="fixed bottom-16 left-0 right-0 bg-white p-3 shadow flex gap-2 z-50">
        <button
          onClick={handleAddToCart}
          className="flex-1 bg-yellow-500 text-white py-2 rounded-md"
        >
          {t.add_to_cart}
        </button>

        <button
          onClick={handleBuyNow}
          className="flex-1 bg-red-500 text-white py-2 rounded-md"
        >
          {t.buy_now}
        </button>
      </div>

      {/* CHECKOUT SHEET (PRODUCT ONLY) */}
      <CheckoutSheet
        open={openCheckout}
        onClose={() => setOpenCheckout(false)}
      />
    </div>
  );
}
