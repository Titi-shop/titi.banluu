"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useCart } from "@/app/context/CartContext";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import CheckoutSheet from "./CheckoutSheet";

function formatDetail(text: string) {
  return text
    .replace(/\\n/g, "\n")      // FIX dữ liệu lưu dạng \n
    .replace(/\r\n/g, "\n")     // FIX Windows newline
    .trim();
}
function formatShortDescription(text?: string) {
  if (!text || typeof text !== "string") return [];

  return text
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);
}

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
  price: number;        // giá gốc
  finalPrice: number;   // giá sale / giá thanh toán
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

  const quantity = 1;

  /* =======================
     LOAD PRODUCT
  ======================= */
  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch("/api/products");
        const data: unknown = await res.json();

        if (!Array.isArray(data)) return;

        const normalized: Product[] = data.map((p) => {
          const api = p as ApiProduct;
          const finalPrice =
            typeof api.finalPrice === "number"
              ? api.finalPrice
              : api.price;

          return {
            id: api.id,
            name: api.name,
            price: api.price,
            finalPrice,
            isSale: finalPrice < api.price,
            description: api.description ?? "",
            detail: api.detail ?? "",
            views: api.views ?? 0,
            sold: api.sold ?? 0,
            images: Array.isArray(api.images) ? api.images : [],
            detailImages: Array.isArray(api.detailImages)
              ? api.detailImages
              : [],
            categoryId: api.categoryId ?? null,
          };
        });

        const found = normalized.find((p) => p.id === id);
        if (found) setProduct(found);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [id]);

  /* =======================
     STATES
  ======================= */
  if (loading) return <p className="p-4">{t.loading}</p>;
  if (!product) return <p className="p-4">{t.no_products}</p>;

  const images =
    product.images.length > 0
      ? product.images
      : ["/placeholder.png"];

  const next = () =>
    setCurrentIndex((i) => (i + 1) % images.length);

  const prev = () =>
    setCurrentIndex((i) =>
      i === 0 ? images.length - 1 : i - 1
    );

  /* =======================
     ACTIONS (FIXED)
  ======================= */

  const add = () => {
    addToCart({
      ...product,
      price: product.finalPrice, // ✅ DÙNG GIÁ SALE
      quantity,
    });
    router.push("/cart");
  };

  const buy = () => {
    addToCart({
      ...product,
      price: product.finalPrice, // ✅ DÙNG GIÁ SALE
      quantity,
    });
    setOpenCheckout(true);
  };

  /* =======================
     RENDER
  ======================= */
  return (
     <div className="pb-32 bg-gray-50 min-h-screen">
      {/* MAIN IMAGES */}
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

      {/* INFO */}
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

      {/* META */}
      <div className="bg-white px-4 pb-4 flex gap-4 text-gray-600 text-sm">
        <span>👁 {product.views}</span>
        <span>
          🛒 {product.sold} {t.orders}
        </span>
      </div>

      {/* SHORT DESCRIPTION (Shopee style) */}
<div className="bg-white p-4">
  <h3 className="text-sm font-semibold mb-2">
    {t.product_description ?? "Mô tả sản phẩm"}
  </h3>

  {product.description ? (
  <ul className="space-y-1 text-sm text-gray-700 leading-relaxed">
    {formatShortDescription(product.description).map((line, i) => (
      <li key={i} className="flex gap-2">
        <span className="text-orange-500">•</span>
        <span>{line}</span>
      </li>
    ))}
  </ul>
) : (
  <p className="text-sm text-gray-400">
    {t.no_description}
  </p>
)}
</div>

      {/* DETAIL IMAGES */}
      {product.detailImages.length > 0 && (
        <div className="bg-white mt-2 space-y-2">
          {product.detailImages.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`detail-${i}`}
              className="w-full object-cover"
            />
          ))}
        </div>
      )}

      {/* DETAIL CONTENT */}
      <div className="bg-white mt-2 px-4 py-5">
  <h3 className="text-base font-semibold mb-3">
    Chi tiết sản phẩm
  </h3>

  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
    {formatDetail(product.detail || t.no_description)}
  </div>
</div>

      {/* ACTIONS */}
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

      {/* CHECKOUT SHEET */}
      <CheckoutSheet
  open={openCheckout}
  onClose={() => setOpenCheckout(false)}
  product={{
    id: product.id,
    name: product.name,
    price: product.price,
    finalPrice: product.finalPrice,
    images: product.images,
  }}
/>
    </div>
  );
}
