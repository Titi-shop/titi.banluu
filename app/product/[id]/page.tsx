"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useCart } from "@/app/context/CartContext";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import CheckoutSheet from "./CheckoutSheet";
import { formatPi } from "@/lib/pi";

function formatDetail(text: string) {
  return text
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .trim();
}

function formatShortDescription(text?: string) {
  if (!text || typeof text !== "string") return [];

  return text
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function calcSalePercent(price: number, finalPrice: number) {
  if (finalPrice >= price) return 0;
  return Math.round(((price - finalPrice) / price) * 100);
}

/* =======================
   TYPES
======================= */

interface ProductVariant {
  option1: string;
  option2?: string | null;
  option3?: string | null;
  price: number;
  stock: number;
  sku: string;
}

interface ApiProduct {
  id: string;
  name: string;
  price: number;
  finalPrice?: number;
  description?: string;
  detail?: string;
  views?: number;
  sold?: number;
  thumbnail?: string;
  images?: string[];
  stock?: number;
  isActive?: boolean;
  categoryId?: string | null;
  variants?: ProductVariant[];
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
  thumbnail?: string;
  images: string[];
  stock: number;
  isActive: boolean;
  isOutOfStock: boolean;
  categoryId: string | null;
  variants: ProductVariant[];
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
  const [products, setProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openCheckout, setOpenCheckout] = useState(false);
const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(0);
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

          const stock = typeof api.stock === "number" ? api.stock : 0;
          const isActive = api.isActive !== false;

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

  thumbnail: api.thumbnail ?? "",
  images: Array.isArray(api.images) ? api.images : [],
  categoryId: api.categoryId ?? null,

  stock,
  isActive,
  isOutOfStock: stock <= 0 || !isActive,
  variants: Array.isArray(api.variants) ? api.variants : [],
};
        });

        setProducts(normalized);

        const found = normalized.find((p) => p.id === id);
        if (found) setProduct(found);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [id]);

  /* =======================
   INCREMENT VIEW
======================= */
  useEffect(() => {
    if (!id) return;

    fetch("/api/products/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch((err) =>
      console.error("View update failed:", err)
    );
  }, [id]);

  /* =======================
     STATES
  ======================= */
  if (loading) return <p className="p-4">{t.loading}</p>;
  if (!product) return <p className="p-4">{t.no_products}</p>;

  const relatedProducts = products.filter(
    (p) =>
      p.id !== product.id &&
      p.categoryId &&
      p.categoryId === product.categoryId
  );

  const displayImages = [
  ...(product.thumbnail ? [product.thumbnail] : []),
  ...product.images.filter((img) => img && img !== product.thumbnail),
];

const gallery =
  displayImages.length > 0 ? displayImages : ["/placeholder.png"];

  const next = () =>
  setCurrentIndex((i) => (i + 1) % gallery.length);

const prev = () =>
  setCurrentIndex((i) =>
    i === 0 ? gallery.length - 1 : i - 1
  );

  /* =======================
     ACTIONS
  ======================= */

  const add = () => {
  addToCart({
    id: product.id,
    name: product.name,
    price: product.price,
    sale_price: displayPrice,
    thumbnail: product.thumbnail,
    image: product.thumbnail || product.images?.[0] || "",
    images: product.images,
    quantity,
    variant: selectedVariant
      ? {
          option1: selectedVariant.option1,
          option2: selectedVariant.option2 ?? null,
          option3: selectedVariant.option3 ?? null,
          sku: selectedVariant.sku,
          price: selectedVariant.price,
          stock: selectedVariant.stock,
        }
      : null,
  });

  router.push("/cart");
};

  const buy = () => {
  addToCart({
    id: product.id,
    name: product.name,
    price: product.price,
    sale_price: displayPrice,
    thumbnail: product.thumbnail,
    image: product.thumbnail || product.images?.[0] || "",
    images: product.images,
    quantity,
    variant: selectedVariant
      ? {
          option1: selectedVariant.option1,
          option2: selectedVariant.option2 ?? null,
          option3: selectedVariant.option3 ?? null,
          sku: selectedVariant.sku,
          price: selectedVariant.price,
          stock: selectedVariant.stock,
        }
      : null,
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
  src={gallery[currentIndex]}
  alt={product.name}
  className="w-full h-full object-cover"
/>

        {product.isSale && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            -{calcSalePercent(product.price, product.finalPrice)}%
          </div>
        )}

        {gallery.length > 1 && (
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
      {gallery.map((_, i) => (
        <span
          key={i}
          className={`w-2 h-2 rounded-full ${
            i === currentIndex
              ? "bg-orange-700"
              : "bg-gray-700"
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
          {!hasVariants && product.isSale && (
  <p className="text-sm text-gray-400 line-through">
    π {formatPi(product.price)}
  </p>
)}

          {product.isSale && (
            <p className="text-sm text-gray-400 line-through">
              π {formatPi(product.price)}
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

      {/* STOCK */}
      <div className="bg-white px-4 pb-4 text-sm">
        {finalOutOfStock ? (
  <span className="text-red-500 font-semibold">
    ❌ Hết hàng
  </span>
) : (
  <span className="text-green-600">
    ✅ Còn {displayStock} sản phẩm
  </span>
)}
      </div>

      {/* VARIANTS */}
{hasVariants && (
  <div className="bg-white mt-2 px-4 py-4">
    <h3 className="text-sm font-semibold mb-3">
      {t.product_variants ?? "Phân loại"}
    </h3>

    <div className="space-y-2">
      {product.variants.map((variant, index) => {
        const active = index === selectedVariantIndex;
        const out = variant.stock <= 0;

        return (
          <button
            key={`${variant.sku}-${index}`}
            type="button"
            onClick={() => setSelectedVariantIndex(index)}
            className={`w-full text-left border rounded-lg p-3 ${
              active
                ? "border-orange-500 bg-orange-50"
                : "border-gray-200 bg-white"
            } ${out ? "opacity-60" : ""}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-sm">
                  {variant.option1}
                  {variant.option2 ? ` - ${variant.option2}` : ""}
                  {variant.option3 ? ` - ${variant.option3}` : ""}
                </p>

                {variant.sku && (
                  <p className="text-xs text-gray-500">
                    SKU: {variant.sku}
                  </p>
                )}
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-orange-600">
                  π {formatPi(variant.price)}
                </p>
                <p className="text-xs text-gray-500">
                  {out ? "Hết hàng" : `Còn ${variant.stock}`}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  </div>
)}

      {/* DESCRIPTION */}
      <div className="bg-white p-4">
        <h3 className="text-sm font-semibold mb-2">
          {t.product_description ?? "Mô tả sản phẩm"}
        </h3>

        {product.description ? (
  <ul className="text-sm text-gray-700 space-y-1">
    {formatShortDescription(product.description).map((line, i) => (
      <li key={i}>• {line}</li>
    ))}
  </ul>
) : (
  <p className="text-sm text-gray-400">
    {t.no_description}
  </p>
)}
      </div>

      {/* DETAIL CONTENT */}
<div className="bg-white mt-2 px-4 py-5">
  <h3 className="text-base font-semibold mb-3">
    {t.product_details ?? "Chi tiết sản phẩm"}
  </h3>

  {product.detail ? (
    <div
      className="text-sm text-gray-700 leading-relaxed"
      dangerouslySetInnerHTML={{
        __html: product.detail,
      }}
    />
  ) : (
    <p className="text-sm text-gray-400">
      {t.no_description}
    </p>
  )}
</div>
    

      {/* RELATED */}
      {relatedProducts.length > 0 && (
        <div className="bg-white mt-2 p-4">
          <h3 className="text-sm font-semibold mb-3">
            🔗 {t.product_related_products ?? "Sản phẩm liên quan"}
          </h3>

          <div className="flex gap-3 overflow-x-auto">
            {relatedProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => router.push(`/product/${p.id}`)}
                className="min-w-[140px] bg-gray-50 rounded-lg p-2"
              >
                <img
                  src={p.thumbnail || p.images[0] || "/placeholder.png"}
                  className="w-full h-24 object-cover rounded"
                />

                <p className="text-xs mt-2 line-clamp-2">
                  {p.name}
                </p>

                <p className="text-sm font-semibold text-orange-600">
                  π {formatPi(p.finalPrice)}
                </p>

                {p.isSale && (
                  <p className="text-xs text-gray-400 line-through">
                    π {formatPi(p.price)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ACTIONS */}
      <div className="fixed bottom-16 left-0 right-0 bg-white p-3 shadow flex gap-2 z-50">
        <button
          onClick={add}
          disabled={product.isOutOfStock}
          className={`flex-1 py-2 rounded-md text-white ${
            product.isOutOfStock
              ? "bg-gray-400"
              : "bg-yellow-500"
          }`}
        >
          {t.add_to_cart}
        </button>

        <button
          onClick={buy}
          disabled={finalOutOfStock}
          className={`flex-1 py-2 rounded-md text-white ${
            finalOutOfStock
              ? "bg-gray-400"
              : "bg-red-500"
          }`}
        >
          {product.isOutOfStock ? "Hết hàng" : t.buy_now}
        </button>
      </div>

      {/* CHECKOUT */}
      <CheckoutSheet
  open={openCheckout}
  onClose={() => setOpenCheckout(false)}
  product={{
    id: product.id,
    name: product.name,
    price: product.price,
    finalPrice: displayPrice,
    thumbnail: product.thumbnail,
    image: product.thumbnail || product.images?.[0] || "",
    images: product.images,
    variant: selectedVariant
      ? {
          option1: selectedVariant.option1,
          option2: selectedVariant.option2 ?? null,
          option3: selectedVariant.option3 ?? null,
          sku: selectedVariant.sku,
          price: selectedVariant.price,
          stock: selectedVariant.stock,
        }
      : null,
  }}
/>
    </div>
  );
}
