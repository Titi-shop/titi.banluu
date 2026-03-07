"use client";

import { useState, useEffect, FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";
import { formatPi } from "@/lib/pi";

/* =========================
   TYPES
========================= */

interface Category {
  id: number;
  key: string;
  icon?: string;
}

interface MessageState {
  text: string;
  type: "success" | "error" | "";
}

/* =========================
   FORMAT NUMBER
========================= */

function formatInputPi(value: string) {
  const num = Number(value.replace(/,/g, ""));
  if (Number.isNaN(num)) return "";

  const parts = num.toFixed(5).split(".");
  parts[0] = Number(parts[0]).toLocaleString("en-US");

  return parts.join(".");
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
  const [detailImages, setDetailImages] = useState<string[]>([]);
  const [detail, setDetail] = useState("");

  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");

  const [saleStart, setSaleStart] = useState("");
  const [saleEnd, setSaleEnd] = useState("");

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [message, setMessage] = useState<MessageState>({
    text: "",
    type: "",
  });

  /* =========================
     SELLER GUARD
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
     IMAGE UPLOAD
  ========================= */

  async function uploadImages(
    files: File[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) {
    if (!files.length) return;

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

        if (!res.ok || !data.url) throw new Error();

        setter((prev) => [...prev, data.url]);
      }
    } catch {
      setMessage({
        text: "❌ Upload ảnh thất bại",
        type: "error",
      });
    } finally {
      setUploadingImage(false);
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function localToUTC(local: string): string {
    const date = new Date(local);
    return new Date(
      date.getTime() - date.getTimezoneOffset() * 60000
    ).toISOString();
  }

  /* =========================
     SUBMIT
  ========================= */

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!images.length) {
      setMessage({
        text: "⚠️ Cần ít nhất 1 ảnh sản phẩm",
        type: "error",
      });
      return;
    }

    const numericPrice = Number(price.replace(/,/g, ""));
    const numericSale = salePrice
      ? Number(salePrice.replace(/,/g, ""))
      : null;

    if (numericPrice < 0.00001) {
      setMessage({
        text: "⚠️ Giá tối thiểu 0.00001 PI",
        type: "error",
      });
      return;
    }

    if (numericSale && numericSale >= numericPrice) {
      setMessage({
        text: "⚠️ Giá sale phải nhỏ hơn giá gốc",
        type: "error",
      });
      return;
    }

    const form = e.currentTarget;

    const payload = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value.trim(),

      price: numericPrice,

      salePrice: numericSale,

      saleStart: numericSale && saleStart ? localToUTC(saleStart) : null,
      saleEnd: numericSale && saleEnd ? localToUTC(saleEnd) : null,

      description: (
        form.elements.namedItem("description") as HTMLTextAreaElement
      ).value,

      detail,

      images,
      detailImages,

      categoryId: Number(
        (form.elements.namedItem("categoryId") as HTMLSelectElement).value
      ),
    };

    setSaving(true);

    try {
      const res = await apiAuthFetch("/api/products", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      setMessage({
        text: "🎉 Đăng sản phẩm thành công",
        type: "success",
      });

      setTimeout(() => router.push("/seller/stock"), 800);
    } catch {
      setMessage({
        text: "❌ Đăng thất bại",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user) {
    return <main className="p-8 text-center">⏳ {t.loading}</main>;
  }

  /* =========================
     UI
  ========================= */

  return (
    <main className="max-w-2xl mx-auto p-4 pb-28">
      <h1 className="text-xl font-bold text-center mb-4 text-[#ff6600]">
        ➕ {t.post_product}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* CATEGORY */}

        <select name="categoryId" className="w-full border p-2 rounded" required>
          <option value="">{t.select_category}</option>

          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {t[c.key] ?? c.key}
            </option>
          ))}
        </select>

        {/* NAME */}

        <input
          name="name"
          placeholder={t.product_name}
          className="w-full border p-2 rounded"
          required
        />

        {/* IMAGES */}

        <div className="grid grid-cols-3 gap-3">
          {images.map((url, i) => (
            <div key={url} className="relative h-28">
              <Image src={url} alt="" fill className="object-cover rounded" />
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
            <label className="flex items-center justify-center border-2 border-dashed rounded cursor-pointer h-28">
              ＋
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) =>
                  uploadImages(Array.from(e.target.files || []), setImages)
                }
              />
            </label>
          )}
        </div>

        {/* PRICE */}

        <input
          value={price}
          onChange={(e) => setPrice(formatInputPi(e.target.value))}
          placeholder="Price (PI)"
          className="w-full border p-2 rounded"
          required
        />

        {/* SALE PRICE */}

        <input
          value={salePrice}
          onChange={(e) => setSalePrice(formatInputPi(e.target.value))}
          placeholder="Sale price"
          className="w-full border p-2 rounded"
        />

        {/* DESCRIPTION */}

        <textarea
          name="description"
          placeholder={t.description}
          required
          className="w-full border p-2 rounded min-h-[70px]"
        />

        {/* DETAIL */}

        <textarea
          placeholder={t.product_detail}
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          className="w-full border p-2 rounded min-h-[120px]"
        />

        {/* SUBMIT */}

        <button
          disabled={saving}
          className="w-full bg-[#ff6600] text-white py-3 rounded-lg font-semibold"
        >
          {saving ? "Posting..." : t.post_product}
        </button>
      </form>
    </main>
  );
}
