"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";
import ProductForm from "@/components/ProductForm";

interface Category {
  id: number;
  key: string;
}

interface ProductPayload {
  id: number;
  name: string;
  price: number;
  salePrice?: number | null;
  saleStart?: string | null;
  saleEnd?: string | null;
  description: string;
  detail: string;
  images: string[];
  thumbnail: string;
  categoryId: number;
  stock: number;
  is_active: boolean;
}

export default function SellerEditPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useParams(); // id sản phẩm cần edit
  const { user, loading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<ProductPayload | null>(null);

  useEffect(() => {
    fetch("/api/categories", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: unknown) => setCategories(Array.isArray(d) ? (d as Category[]) : []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!id) return;
    apiAuthFetch(`/api/products/${id}`, { method: "GET" })
      .then((r) => r.json())
      .then((data) => setProduct(data))
      .catch(() => setProduct(null));
  }, [id]);

  if (loading || !user || !product) return <div className="p-8 text-center">{t.loading}</div>;

  const updateProduct = async (payload: ProductPayload) => {
    const res = await apiAuthFetch(`/api/products/${payload.id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("PATCH_FAILED");
    router.push("/seller/stock");
  };

  return (
    <main className="max-w-2xl mx-auto p-4 pb-28">
      <h1 className="text-xl font-bold text-center mb-4 text-[#ff6600]">✏️ {t.edit_product}</h1>
      <ProductForm categories={categories} initialData={product} onSubmit={updateProduct} />
    </main>
  );
}
