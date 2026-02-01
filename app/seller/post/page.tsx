"use client";

import { useState, useEffect, FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";

/* =========================
   TYPES (NO any)
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
  const { user, loading } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
   // SALE
const [salePrice, setSalePrice] = useState<number | "">("");
const [saleStart, setSaleStart] = useState<string>("");
const [saleEnd, setSaleEnd] = useState<string>("");

// DETAIL CONTENT
const [detail, setDetail] = useState("");
const [detailImages, setDetailImages] = useState<string[]>([]);

  const [message, setMessage] = useState<MessageState>({
    text: "",
    type: "",
  });

  /* =========================
     🔒 SELLER GUARD
  ========================= */
  useEffect(() => {
    if (!loading && (!user || user.role !== "seller")) {
      router.replace("/account");
    }
  }, [loading, user, router]);

  /* =========================
     LOAD CATEGORIES
  ========================= */
  useEffect(() => {
    fetch("/api/categories", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: unknown) =>
        setCategories(Array.isArray(d) ? (d as Category[]) : [])
      )
      .catch(() => setCategories([]));
  }, []);

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

        const res = await apiAuthFetch("/api/upload", {
          method: "POST",
          body: form,
        });

        const data: unknown = await res.json();
        if (!res.ok || typeof data !== "object" || !data || !("url" in data)) {
          throw new Error("UPLOAD_FAILED");
        }

        setImages((prev) => [...prev, (data as { url: string }).url]);
      }
    } catch {
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
   async function handleDetailImageChange(
  e: React.ChangeEvent<HTMLInputElement>
) {
  const files = Array.from(e.target.files || []);
  if (files.length === 0) return;

  setUploadingImage(true);

  try {
    for (const file of files) {
      const form = new FormData();
      form.append("file", file);

      const res = await apiAuthFetch("/api/upload", {
        method: "POST",
        body: form,
      });

      const data = (await res.json()) as { url?: string };
      if (!res.ok || !data.url) {
        throw new Error("UPLOAD_FAILED");
      }

      setDetailImages((prev) => [...prev, data.url]);
    }
  } catch {
    setMessage({
      text: "❌ Upload ảnh mô tả thất bại",
      type: "error",
    });
  } finally {
    setUploadingImage(false);
    e.target.value = "";
  }
}

  /* =========================
     SUBMIT PRODUCT
  ========================= */
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user || user.role !== "seller") return;

    if (images.length === 0) {
      setMessage({
        text: "⚠️ Cần ít nhất 1 ảnh sản phẩm",
        type: "error",
      });
      return;
    }

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
      images,
    };

    if (!payload.name || !payload.price) {
      setMessage({
        text: t.enter_valid_name_price || "⚠️ Nhập tên & giá hợp lệ",
        type: "error",
      });
      return;
    }

    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await apiAuthFetch("/api/products", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("POST_FAILED");

      setMessage({
        text: t.post_success || "🎉 Đăng sản phẩm thành công",
        type: "success",
      });

      setTimeout(() => router.push("/seller/stock"), 700);
    } catch {
      setMessage({
        text: t.post_failed || "❌ Đăng thất bại",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user) {
    return (
      <main className="p-8 text-center text-gray-500">
        ⏳ {t.loading}
      </main>
    );
  }

  /* =========================
     UI – STOCK STYLE
  ========================= */
  return (
    <main className="max-w-2xl mx-auto p-4 pb-28">
      {/* HEADER */}
      <button
        onClick={() => router.back()}
        className="mb-4 text-blue-600 underline"
      >
        ← {t.back}
      </button>

      <h1 className="text-2xl font-bold text-center mb-4 text-[#ff6600]">
        ➕ {t.post_product || "Thêm sản phẩm mới"}
      </h1>

      {message.text && (
        <p
          className={`text-center mb-4 ${
            message.type === "success"
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}

      {/* IMAGE GRID (LIKE STOCK) */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {images.map((url, i) => (
          <div key={url} className="relative h-28 rounded overflow-hidden">
            <Image src={url} alt="" fill className="object-cover" />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 rounded"
            >
              ✕
            </button>
          </div>
        ))}

        {images.length < 6 && (
          <label className="flex items-center justify-center border-2 border-dashed rounded cursor-pointer text-gray-400 h-28">
            {uploadingImage ? "⏳" : "＋"}
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={handleImageChange}
            />
          </label>
        )}
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-3">
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

         <input
  type="number"
  placeholder="Giá sale (không bắt buộc)"
  value={salePrice}
  onChange={(e) =>
    setSalePrice(e.target.value ? Number(e.target.value) : "")
  }
  className="w-full border p-2 rounded"
/>

<div className="grid grid-cols-2 gap-3">
  <input
    type="date"
    value={saleStart}
    onChange={(e) => setSaleStart(e.target.value)}
    className="border p-2 rounded"
  />
  <input
    type="date"
    value={saleEnd}
    onChange={(e) => setSaleEnd(e.target.value)}
    className="border p-2 rounded"
  />
</div>
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

        <textarea
          name="description"
          placeholder={t.description}
          className="w-full border p-2 rounded"
        />
<textarea
  placeholder="Mô tả chi tiết sản phẩm"
  value={detail}
  onChange={(e) => setDetail(e.target.value)}
  className="w-full border p-2 rounded min-h-[120px]"
/>
         <div className="grid grid-cols-3 gap-3">
  {detailImages.map((url) => (
    <div key={url} className="relative h-28">
      <Image src={url} alt="" fill className="object-cover rounded" />
    </div>
  ))}

  <label className="flex items-center justify-center border-2 border-dashed rounded cursor-pointer text-gray-400 h-28">
    {uploadingImage ? "⏳" : "＋"}
    <input
      type="file"
      accept="image/*"
      multiple
      hidden
      onChange={handleDetailImageChange}
    />
  </label>
</div>
        <button
          disabled={saving}
          className="w-full bg-[#ff6600] text-white py-3 rounded-lg font-semibold"
        >
          {saving ? t.posting : "💾 " + t.post_product}
        </button>
      </form>
    </main>
  );
}
