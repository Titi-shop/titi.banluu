"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";
import { apiFetchForm } from "@/lib/apiFetchForm";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";

/* =========================
   HELPERS
========================= */
function formatDateToInput(dateString: string | null) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

/* =========================
   TYPES
========================= */
interface ProductData {
  id: string | number;
  name: string;
  price: number;
  description: string;
  categoryId: number | null;
  salePrice?: number | null;
  saleStart?: string | null;
  saleEnd?: string | null;
  images: string[];
}

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
export default function EditProductPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [product, setProduct] = useState<ProductData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // 🔥 giống page post
  const [images, setImages] = useState<string[]>([]);

  const [message, setMessage] = useState<MessageState>({
    text: "",
    type: "",
  });

  /* =========================
     🔐 AUTH GUARD (SELLER)
  ========================= */
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/pilogin");
      return;
    }

    if (user.role !== "seller") {
      router.replace("/account");
    }
  }, [authLoading, user, router]);

  /* =========================
     LOAD CATEGORIES
  ========================= */
  useEffect(() => {
    apiFetch("/api/categories")
      .then((r) => r.json())
      .then((data: Category[]) => setCategories(data || []))
      .catch(() => setCategories([]));
  }, []);

  /* =========================
     LOAD PRODUCT
  ========================= */
  useEffect(() => {
    if (!id) {
      setMessage({ text: t.product_not_found, type: "error" });
      setLoadingPage(false);
      return;
    }

    apiFetch("/api/products")
      .then((r) => r.json())
      .then((list: ProductData[]) => {
        const p = list.find((x) => x.id == id);
        if (!p) {
          setMessage({ text: t.product_not_found, type: "error" });
          setTimeout(() => router.push("/seller/stock"), 1200);
          return;
        }
        setProduct(p);
        setImages(p.images || []);
      })
      .finally(() => setLoadingPage(false));
  }, [id, router, t]);

  /* =========================
     IMAGE UPLOAD (MAX 6)
  ========================= */
  async function handleImageChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (images.length + files.length > 6) {
      setMessage({
        text: "⚠️ Tối đa 6 ảnh cho mỗi sản phẩm",
        type: "error",
      });
      return;
    }

    setUploadingImage(true);
    setMessage({ text: "", type: "" });

    try {
      for (const file of files) {
        const form = new FormData();
        form.append("file", file);

        const res = await apiFetchForm("/api/upload", {
          method: "POST",
          body: form,
        });

        const data: { success: boolean; url?: string } =
          await res.json();

        if (!res.ok || !data.success || !data.url) {
          throw new Error("UPLOAD_FAILED");
        }

        setImages((prev) => [...prev, data.url]);
      }
    } catch (err) {
      console.error(err);
      setMessage({
        text: "❌ Upload ảnh thất bại",
        type: "error",
      });
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  /* =========================
     SAVE PRODUCT
  ========================= */
  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!product) return;

    if (images.length === 0) {
      setMessage({
        text: "⚠️ Sản phẩm cần ít nhất 1 ảnh",
        type: "error",
      });
      return;
    }

    setSaving(true);
    setMessage({ text: "", type: "" });

    const form = e.currentTarget;

    const payload: ProductData = {
      id: product.id,
      name: (form.elements.namedItem("name") as HTMLInputElement).value.trim(),
      price: Number(
        (form.elements.namedItem("price") as HTMLInputElement).value
      ),
      description: (
        form.elements.namedItem("description") as HTMLTextAreaElement
      ).value,
      categoryId:
        Number(
          (form.elements.namedItem(
            "categoryId"
          ) as HTMLSelectElement).value
        ) || null,
      salePrice:
        Number(
          (form.elements.namedItem(
            "salePrice"
          ) as HTMLInputElement).value
        ) || null,
      saleStart:
        (form.elements.namedItem(
          "saleStart"
        ) as HTMLInputElement).value || null,
      saleEnd:
        (form.elements.namedItem(
          "saleEnd"
        ) as HTMLInputElement).value || null,
      images,
    };

    try {
      const res = await apiFetch("/api/products", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const result: { error?: string } = await res.json();

      if (res.ok) {
        setMessage({
          text: t.save_success || "✅ Lưu thành công",
          type: "success",
        });
        setTimeout(() => router.push("/seller/stock"), 900);
      } else {
        setMessage({
          text: result.error || t.save_failed,
          type: "error",
        });
      }
    } catch (err) {
      console.error(err);
      setMessage({
        text: t.save_failed,
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  /* =========================
     UI STATES
  ========================= */
  if (authLoading || loadingPage) {
    return <p className="text-center mt-10">⏳ {t.loading}...</p>;
  }

  if (!product) {
    return (
      <p className="text-center mt-10 text-red-500">
        ❌ {t.product_not_found}
      </p>
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
        ✏️ {t.edit_product}
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

      <form onSubmit={handleSave} className="space-y-4">
        <input
          name="name"
          defaultValue={product.name}
          className="w-full border p-2 rounded"
        />

        <input
          name="price"
          type="number"
          defaultValue={product.price}
          className="w-full border p-2 rounded"
        />

        <select
          name="categoryId"
          defaultValue={product.categoryId || ""}
          className="w-full border p-2 rounded"
        >
          <option value="">{t.select_category}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* IMAGES */}
        <div className="space-y-2">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="w-full border p-2 rounded"
          />

          <p className="text-sm text-gray-500">
            {images.length}/6 ảnh
          </p>

          {uploadingImage && (
            <p className="text-sm text-gray-500">
              ⏳ Đang upload ảnh...
            </p>
          )}

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {images.map((url, i) => (
                <div key={url} className="relative">
                  <img
                    src={url}
                    className="w-full h-24 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <textarea
          name="description"
          defaultValue={product.description}
          className="w-full border p-2 rounded"
        />

        {/* SALE */}
        <div className="p-3 bg-orange-50 border rounded">
          <input
            name="salePrice"
            type="number"
            defaultValue={product.salePrice || ""}
            className="w-full border p-2 rounded mb-2"
          />
          <input
            name="saleStart"
            type="date"
            defaultValue={formatDateToInput(product.saleStart || null)}
            className="w-full border p-2 rounded mb-2"
          />
          <input
            name="saleEnd"
            type="date"
            defaultValue={formatDateToInput(product.saleEnd || null)}
            className="w-full border p-2 rounded"
          />
        </div>

        <button
          disabled={saving}
          className="w-full bg-[#ff6600] text-white p-3 rounded-lg"
        >
          {saving ? t.saving : "💾 " + t.save_changes}
        </button>
      </form>
    </main>
  );
}
