"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { ArrowLeft, ShoppingCart, X } from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  salePrice?: number;
  saleStart?: string;
  saleEnd?: string;
  finalPrice?: number;
  isSale?: boolean;
  description?: string;
  views?: number;
  sold?: number;
  images?: string[];
}

export default function ProductDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const router = useRouter();
  const { addToCart, clearCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [loading, setLoading] = useState(true);
  const quantity = 1;

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch("/api/products");
        const allProducts: Product[] = await res.json();
        const found = allProducts.find((p) => p.id.toString() === id.toString());

        if (found) {
          const now = new Date();
          const start = found.saleStart ? new Date(found.saleStart) : null;
          const end = found.saleEnd ? new Date(found.saleEnd) : null;

          found.isSale = start && end && found.salePrice
            ? now >= start && now <= end
            : false;

          found.finalPrice = found.isSale ? found.salePrice || found.price : found.price;
          setProduct(found);

          setRelated(
            allProducts
              .filter((p) => p.id !== found.id)
              .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
              .slice(0, 10)
          );
        }
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  if (loading) return <p>{t.loading}</p>;
  if (!product) return <p>{t.no_products}</p>;

  const validImages =
    product.images?.map((src) => (src.startsWith("http") ? src : `/uploads/${src}`)) || [];

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % validImages.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));

  const handleAddToCart = () => {
    addToCart({ ...product, quantity });
    router.push("/cart");
  };

  const handleCheckout = () => {
    clearCart();
    addToCart({ ...product, quantity });
    router.push("/checkout");
  };

  return (
    <div className="pb-32 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow z-50 flex items-center justify-between px-4 py-3">
        <button onClick={() => router.back()} className="flex items-center">
          <ArrowLeft size={22} />
          <span>{t.back}</span>
        </button>
        <h1 className="text-base font-semibold">{product.name}</h1>
        <button onClick={() => router.push("/cart")}>
          <ShoppingCart size={22} />
        </button>
      </div>

      {/* Image Slider */}
      <div className="mt-14 relative w-full h-80 bg-white flex justify-center items-center">
        <img src={validImages[currentIndex]} alt={product.name} className="w-full h-full object-cover" />
        <div className="absolute bottom-3 flex gap-2">
          {validImages.map((_, i) => (
            <span key={i} className={`w-2 h-2 rounded-full ${i === currentIndex ? "bg-orange-500" : "bg-gray-300"}`} />
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="bg-white p-4 flex justify-between items-center">
        <h2 className="text-lg">{product.name}</h2>
        <div>
          <p className="text-xl font-bold text-orange-600">π {product.finalPrice}</p>
          {product.isSale && (
            <p className="text-sm line-through">π {product.price}</p>
          )}
        </div>
      </div>

      <div className="bg-white px-4 pb-4 flex gap-4 text-gray-600">
        <span>👁 {product.views}</span>
        <span>🛒 {product.sold} {t.orders}</span>
      </div>

      {/* Description */}
      <div className="bg-white p-4">{product.description || t.no_description}</div>

      {/* Actions */}
      <div className="fixed bottom-16 left-0 right-0 bg-white p-3 shadow flex gap-2 z-50">
        <button onClick={handleAddToCart} className="flex-1 bg-yellow-500 text-white py-2 rounded-md">
          {t.add_to_cart}
        </button>
        <button onClick={handleCheckout} className="flex-1 bg-red-500 text-white py-2 rounded-md">
          {t.buy_now}
        </button>
      </div>
    </div>
  );
}
