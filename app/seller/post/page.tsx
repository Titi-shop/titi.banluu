"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/apiFetch";

/* =========================
   TYPES
========================= */
interface Category {
  id: number;
  name: string;
}

interface MessageState {
  text: string;
  type: "success" | "error" | "";
}

/* =========================
   PAGE
========================= */
export default function SellerPostPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, piToken, loading } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<MessageState>({
    text: "",
    type: "",
  });

  /* =========================
     🔒 CLIENT GUARD
  ========================= */
  useEffect(() => {
    if (!loading && user && user.role !== "seller") {
      router.replace("/account");
    }
  }, [loading, user, router]);

  /* =========================
     LOAD CATEGORIES (PUBLIC)
  ========================= */
  useEffect(() => {
    fetch("/api/categories", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setCategories(data || []))
      .catch(() => setCategories([]));
  }, []);

  /* =========================
     SUBMIT
  ========================= */
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!user) {
  setMessage({
    text: "⚠️ Bạn chưa đăng nhập Pi Network",
    type: "error",
  });
  return;
}

if (user.role !== "seller") {
  setMessage({
    text: "⛔ Chỉ seller mới được đăng sản phẩm",
    type: "error",
  });
  return;
}

    setSaving(true);
    setMessage({ text: "", type: "" });

    const form = e.currentTarget;

    const payload = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value.trim(),
      price: Number(
        (form.elements.namedItem("price") as HTMLInputElement).value
      ),
      description: (
        form.elements.namedItem("description") as HTMLTextAreaElement
      ).value,
      categoryId:
        Number(
          (form.elements.namedItem("categoryId") as HTMLSelectElement).value
        ) || null,
      images: (
        (form.elements.namedItem("imageUrl") as HTMLInputElement).value.trim()
          ? [
              (form.elements.namedItem("imageUrl") as HTMLInputElement).value.trim(),
            ]
          : []
      ),
      salePrice:
        Number(
          (form.elements.namedItem("salePrice") as HTMLInputElement).value
        ) || null,
      saleStart:
        (form.elements.namedItem("saleStart") as HTMLInputElement).value || null,
      saleEnd:
        (form.elements.namedItem("saleEnd") as HTMLInputElement).value || null,
    };

    if (!user.accessToken) {
  setMessage({
    text: "❌ Mất Pi accessToken, vui lòng đăng nhập lại",
    type: "error",
  });
  setSaving(false);
  return;
}

const res = await fetch("/api/products", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user.accessToken}`,
  },
  body: JSON.stringify(payload),
});
      const result = await res.json();

      if (res.ok) {
        setMessage({
          text: t.post_success || "🎉 Đăng sản phẩm thành công!",
          type: "success",
        });

        setTimeout(() => {
          router.push("/seller/stock");
        }, 800);
      } else {
        setMessage({
          text: result.error || t.post_failed || "❌ Đăng thất bại",
          type: "error",
        });
      }
    } catch {
      setMessage({
        text: t.post_failed || "❌ Đăng thất bại",
        type: "error",
      });
    }

    setSaving(false);
  }

  /* =========================
     LOADING STATE
  ========================= */
  if (loading || !user || user.role !== "seller") {
    return (
      <main className="p-6 text-center text-gray-500">
        ⏳ {t.loading}
      </main>
    );
  }

  /* =========================
     UI
  ========================= */
  return (
    <main className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow mt-10 pb-32">
      <button
        className="mb-3 text-orange-600 font-bold text-lg"
        onClick={() => router.back()}
      >
        ← {t.back}
      </button>

      <h1 className="text-2xl font-bold text-center text-[#ff6600] mb-3">
        ➕ {t.post_product || "Đăng sản phẩm"}
      </h1>

      {message.text && (
        <p
          className={`text-center mb-2 ${
            message.type === "success"
              ? "text-green-600"
              : "text-red-500"
          }`}
        >
          {message.text}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          placeholder={t.product_name}
          className="w-full border p-2 rounded"
        />

        <input
          name="price"
          type="number"
          placeholder={t.price_pi}
          className="w-full border p-2 rounded"
        />

        <select
          name="categoryId"
          className="w-full border p-2 rounded"
        >
          <option value="">{t.select_category}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          name="imageUrl"
          placeholder="Image URL (https://...)"
          className="w-full border p-2 rounded"
        />

        <textarea
          name="description"
          placeholder={t.description}
          className="w-full border p-2 rounded"
        />

        {/* SALE */}
        <div className="p-3 bg-orange-50 border rounded">
          <input
            name="salePrice"
            type="number"
            placeholder={t.sale_price}
            className="w-full border p-2 rounded mb-2"
          />
          <input
            name="saleStart"
            type="date"
            className="w-full border p-2 rounded mb-2"
          />
          <input
            name="saleEnd"
            type="date"
            className="w-full border p-2 rounded"
          />
        </div>

        <button
          disabled={saving}
          className="w-full bg-[#ff6600] text-white p-3 rounded-lg font-semibold"
        >
          {saving ? t.posting : "💾 " + t.post_product}
        </button>
      </form>
    </main>
  );
}
