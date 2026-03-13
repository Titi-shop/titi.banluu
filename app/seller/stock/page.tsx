"use client";
import { Plus } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";
import { formatPi } from "@/lib/pi";


/* =========================
   TYPES
========================= */
interface Product {
  id: string;
  name: string;
  price: number;
  salePrice: number | null;
  saleStart: string | null;
  saleEnd: string | null;
  images: string[];
}

interface RawProduct {
  id: unknown;
  name: unknown;
  price: unknown;
  sale_price?: unknown;
  sale_start?: unknown;
  sale_end?: unknown;
  images?: unknown;
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
  const [pageLoading, setPageLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<Message>({
    text: "",
    type: "",
  });

  /* =========================
     LOAD PRODUCTS
  ========================= */
  const loadProducts = useCallback(async () => {
    try {
      const res = await apiAuthFetch("/api/seller/products", {
        cache: "no-store",
      });

      if (!res.ok) {
        let errorText = t.load_products_error;

        try {
          const err: unknown = await res.json();
          if (
            typeof err === "object" &&
            err !== null &&
            "error" in err
          ) {
            errorText = String(
              (err as { error?: unknown }).error
            );
          }
        } catch {
          // ignore JSON parse error
        }

        setMessage({
          text: errorText,
          type: "error",
        });

        return;
      }

      const raw: unknown = await res.json();

      if (!Array.isArray(raw)) {
        setProducts([]);
        return;
      }

      const mapped: Product[] = raw.map((item) => {
        const p = item as RawProduct;

        return {
          id: typeof p.id === "string" ? p.id : String(p.id ?? ""),
          name:
            typeof p.name === "string" ? p.name : "Unnamed",
          price:
            typeof p.price === "number" &&
            !Number.isNaN(p.price)
              ? p.price
              : 0,
          salePrice:
            typeof p.sale_price === "number" &&
            !Number.isNaN(p.sale_price)
              ? p.sale_price
              : null,
          saleStart:
            typeof p.sale_start === "string"
              ? p.sale_start
              : null,
          saleEnd:
            typeof p.sale_end === "string"
              ? p.sale_end
              : null,
          images: Array.isArray(p.images)
            ? p.images.filter(
                (i): i is string =>
                  typeof i === "string"
              )
            : [],
        };
      });

      setProducts(mapped);
    } catch {
      setMessage({
        text: t.load_products_error,
        type: "error",
      });
    } finally {
      setPageLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!authLoading) {
      loadProducts();
    }
  }, [authLoading, loadProducts]);

  /* =========================
     DELETE PRODUCT
  ========================= */
  const handleDelete = async (id: string) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    const confirmed = confirm(
      `${t.confirm_delete} "${product.name}"?`
    );
    if (!confirmed) return;

    try {
      const res = await apiAuthFetch(
        `/api/products?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );

      let errorText = t.delete_failed;

      try {
        const data: unknown = await res.json();
        if (
          typeof data === "object" &&
          data !== null &&
          "error" in data
        ) {
          errorText = String(
            (data as { error?: unknown }).error
          );
        }
      } catch {
        // ignore parse error
      }

      if (res.ok) {
        setProducts((prev) =>
          prev.filter((p) => p.id !== id)
        );
        setMessage({
          text: t.delete_success,
          type: "success",
        });
      } else {
        setMessage({
          text: errorText,
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
     LOADING STATE
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

       {/* STORE BANNER */}
<div className="relative w-full h-32 rounded-xl overflow-hidden mb-4">
  <Image
    src="/store-banner.jpg"
    alt="Store"
    fill
    className="object-cover"
  />

  <div className="absolute inset-0 bg-black/40 flex items-center justify-between px-4">
    <h2 className="text-white font-bold text-lg">
      {t.my_store}
    </h2>

    <button
      onClick={() => router.push("/seller/create")}
      className="bg-orange-500 hover:bg-orange-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
    >
      <Plus size={18} />
    </button>
  </div>
</div>
{/* STORE BANNER */}
<div className="relative w-full h-32 rounded-xl overflow-hidden mb-4">
  <Image
    src="/store-banner.jpg"
    alt="Store"
    fill
    className="object-cover"
  />

  <div className="absolute inset-0 bg-black/40 flex items-center justify-between px-4">
    <h2 className="text-white font-bold text-lg">
      {t.my_store}
    </h2>

    <button
      onClick={() => router.push("/seller/create")}
      className="bg-orange-500 hover:bg-orange-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
    >
      <Plus size={18}/>
    </button>
  </div>
</div>
      <h1 className="text-2xl font-bold text-center mb-4 text-[#ff6600]">
        {t.my_stock}
      </h1>

      {message.text && (
        <p
          className={`text-center mb-4 ${
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
              product.salePrice !== null &&
              start !== null &&
              end !== null &&
              now >= start &&
              now <= end;

            return (
              <div
                key={product.id}
                onClick={() =>
                  router.push(`/product/${product.id}`)
                }
                className="flex gap-3 p-3 bg-white rounded-lg shadow border cursor-pointer hover:bg-gray-50"
              >
                <div className="w-24 h-24 min-w-[96px] relative rounded overflow-hidden flex-shrink-0">
                  {isSale && (
                    <span className="absolute top-1 left-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded z-10">
                      SALE
                    </span>
                  )}

                  {product.images.length > 0 ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                      {t.no_image}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm leading-snug line-clamp-2">
                    {product.name}
                  </h3>

                  <div className="mt-1">
                     {product.saleStart && (
  <p className="text-xs text-gray-500">
    {t.sale_start}:{" "}
    {new Date(product.saleStart).toLocaleDateString()}
  </p>
)}

{product.saleEnd && (
  <p className="text-xs text-gray-500">
    {t.sale_end}:{" "}
    {new Date(product.saleEnd).toLocaleDateString()}
  </p>
)}
                    {isSale ? (
                      <>
                        <p className="text-sm text-gray-400 line-through">
                          {formatPi(product.price)} π
                        </p>
                        <p className="text-[#ff6600] font-bold">
                          {formatPi(product.salePrice)} π
                        </p>
                      </>
                    ) : (
                      <p className="text-[#ff6600] font-bold">
                        {formatPi(product.price)} π
                      </p>
                    )}
                  </div>

                  <div className="flex gap-4 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(
                          `/seller/edit/${product.id}`
                        );
                      }}
                      className="text-green-600 underline"
                    >
                      {t.edit}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(product.id);
                      }}
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
