"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";

/* =========================
   TYPES (NO any)
========================= */
interface Product {
  id: string;
  name: string;
  price: number;
  salePrice?: number | null;
  saleStart?: string | null;
  saleEnd?: string | null;
  images?: string[];
}

interface Message {
  text: string;
  type: "success" | "error" | "";
}

/* =========================
   PAGE
========================= */
export default function SellerStockPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { loading: authLoading } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState<Message>({
    text: "",
    type: "",
  });

  /* =========================
     📦 LOAD PRODUCTS (AUTH-CENTRIC)
  ========================= */
  async function loadProducts() {
    try {
      const res = await apiAuthFetch("/api/seller/products", {
        cache: "no-store",
      });

      if (!res.ok) {
        const err: unknown = await res.json();
        setMessage({
          text:
            typeof err === "object" && err && "error" in err
              ? String((err as { error?: unknown }).error)
              : t.load_products_error,
          type: "error",
        });
        return;
      }

      const data: unknown = await res.json();
      setProducts(Array.isArray(data) ? (data as Product[]) : []);
    } catch {
      setMessage({
        text: t.load_products_error,
        type: "error",
      });
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading) {
      loadProducts();
    }
  }, [authLoading]);

  /* =========================
     ❌ DELETE PRODUCT
  ========================= */
  const handleDelete = async (id: string) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    if (!confirm(`${t.confirm_delete} "${product.name}"?`)) return;

    try {
      const res = await apiAuthFetch(`/api/products?id=${id}`, {
        method: "DELETE",
      });

      const data: unknown = await res.json();

      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setMessage({ text: t.delete_success, type: "success" });
      } else {
        setMessage({
          text:
            typeof data === "object" && data && "error" in data
              ? String((data as { error?: unknown }).error)
              : t.delete_failed,
          type: "error",
        });
      }
    } catch {
      setMessage({
        text: t.delete_failed,
        type: "error",
      });
    }
  };

  /* =========================
     LOADING
  ========================= */
  if (pageLoading || authLoading) {
    return (
      <main className="text-center p-8">
        ⏳ {t.loading}
      </main>
    );
  }

  /* =========================
     UI
  ========================= */
  return (
    <main className="p-4 max-w-2xl mx-auto pb-28">
      <button
        className="mb-4 text-blue-600 underline"
        onClick={() => router.push("/seller")}
      >
        ← {t.back}
      </button>

      <h1 className="text-2xl font-bold text-center mb-2 text-[#ff6600]">
        📦 {t.my_stock}
      </h1>

      {message.text && (
        <p
          className={`text-center mb-3 ${
            message.type === "success"
              ? "text-green-600"
              : "text-red-600 font-medium"
          }`}
        >
          {message.text}
        </p>
      )}

      {products.length === 0 ? (
        <p className="text-center text-gray-400">
          {t.no_products}
        </p>
      ) : (
        <div className="space-y-4">
          {products.map((product) => {
            const now = new Date();
            const start = product.saleStart
              ? new Date(product.saleStart)
              : null;
            const end = product.saleEnd
              ? new Date(product.saleEnd)
              : null;

            const isSale =
              !!product.salePrice &&
              !!start &&
              !!end &&
              now >= start &&
              now <= end;

            return (
              <div
                key={product.id}
                className="flex gap-3 p-3 bg-white rounded-lg shadow border"
              >
                <div className="w-24 h-24 relative rounded overflow-hidden">
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                      {t.no_image}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold truncate">
                    {product.name}
                  </h3>

                  <p className="text-[#ff6600] font-bold">
                    {isSale ? product.salePrice : product.price} π
                  </p>

                  <div className="flex gap-4 mt-2">
                    <button
                      onClick={() =>
                        router.push(`/seller/edit/${product.id}`)
                      }
                      className="text-green-600 underline"
                    >
                      {t.edit}
                    </button>

                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 underline"
                    >
                      {t.delete}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
