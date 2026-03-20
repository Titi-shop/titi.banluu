"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";
import ProductForm from "@/components/ProductForm";

interface Category {
  id: string;
  key: string;
}

interface ProductPayload {
  id?: string;
  name: string;
  price: number;
  salePrice?: number | null;
  saleStart?: string | null;
  saleEnd?: string | null;
  description: string;
  detail: string;
  images: string[];
  thumbnail: string;
  categoryId: string;
  stock: number;
  is_active: boolean;
}

export default function SellerPostPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/categories", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: unknown) =>
        setCategories(Array.isArray(d) ? (d as Category[]) : [])
      )
      .catch(() => setCategories([]));
  }, []);

  const createProduct = async (payload: ProductPayload) => {
    const res = await apiAuthFetch("/api/products", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error("POST_FAILED");
    }

    router.push("/seller/stock");
  };

  if (loading || !user) {
    return <div className="p-8 text-center">{t.loading}</div>;
  }

  return (
    <main className="max-w-2xl mx-auto p-4 pb-28">
      <h1 className="text-xl font-bold text-center mb-4 text-[#ff6600]">
        ➕ {t.post_product}
      </h1>

      <ProductForm
        categories={categories}
        onSubmit={createProduct}
      />
    </main>
  );
}
