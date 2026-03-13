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
   PAGE
========================= */
export default function SellerPostPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  /* =========================
     STATE
  ========================= */
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [detailImages, setDetailImages] = useState<string[]>([]);
  const [detail, setDetail] = useState("");

  const [salePrice, setSalePrice] = useState<number | "">("");
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

    if (images.length + files.length > 6) {
      setMessage({
        text: t.max_6_images || "⚠️ Tối đa 6 ảnh cho mỗi sản phẩm",
        type: "error",
      });
      return;
    }

    setUploadingImage(true);

    try {
      for (const file of files) {
        const form = new FormData();
        form.append("file", file);

        const res = await apiAuthFetch("/api/upload", {
  method: "POST",
  body: form,
});

if (!res.ok) {
  console.error("UPLOAD ERROR:", await res.text());
  throw new Error("UPLOAD_FAILED");
}

const data = (await res.json()) as { url?: string };

if (!data.url) {
  throw new Error("NO_URL_RETURNED");
}

setter((prev) => [...prev, data.url]);
      }
    } catch {
      setMessage({
        text: t.upload_failed || "❌ Upload ảnh thất bại",
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
  return new Date(local).toISOString();
}

  /* =========================
     SUBMIT
  ========================= */
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user || user.role !== "seller") return;

    if (!images.length) {
      setMessage({
        text: t.need_image || "⚠️ Cần ít nhất 1 ảnh sản phẩm",
        type: "error",
      });
      return;
    }

    if (salePrice) {
      if (!saleStart || !saleEnd) {
        setMessage({
          text: t.need_sale_date || "⚠️ Sale cần ngày bắt đầu và kết thúc",
          type: "error",
        });
        return;
      }

      if (new Date(saleEnd) <= new Date(saleStart)) {
        setMessage({
          text:
            t.invalid_sale_range ||
            "⚠️ Ngày kết thúc phải sau ngày bắt đầu",
          type: "error",
        });
        return;
      }
    }

    const form = e.currentTarget;

    const payload = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value.trim(),
      price: Number(
        (form.elements.namedItem("price") as HTMLInputElement).value
      ),
      salePrice: salePrice || null,
      saleStart: salePrice && saleStart ? localToUTC(saleStart) : null,
saleEnd: salePrice && saleEnd ? localToUTC(saleEnd) : null,
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

    if (!payload.name || payload.price <= 0 || !payload.categoryId) {
      setMessage({
        text:
          t.enter_valid_name_price ||
          "⚠️ Nhập đầy đủ danh mục, tên và giá",
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

      if (!res.ok) throw new Error();

      setMessage({
        text: t.post_success || "🎉 Đăng sản phẩm thành công",
        type: "success",
      });

      setTimeout(() => router.push("/seller/stock"), 800);
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
        <select
  name="categoryId"
  className="w-full border p-2 rounded"
  required
>
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
                  uploadImages(
                    Array.from(e.target.files || []),
                    setImages
                  )
                }
              />
            </label>
          )}
        </div>

        {/* PRICE */}
        <input
          name="price"
          type="number"
          step="0.00001"
          placeholder={t.price_pi}
          className="w-full border p-2 rounded"
          required
        />

        {/* SALE */}
        <input
          type="number"
          step="0.00001"
          placeholder={t.sale_price_optional}
          value={salePrice}
          onChange={(e) =>
            setSalePrice(e.target.value ? Number(e.target.value) : "")
          }
          className="w-full border p-2 rounded"
        />
         {salePrice && (
  <div className="space-y-2">
    <p className="text-sm text-gray-600 font-medium">
      📅 {t.sale_time || "Thời gian khuyến mãi"}
    </p>

    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">
          {t.start_date || "Bắt đầu"}
        </label>
        <input
          type="datetime-local"
          value={saleStart}
          onChange={(e) => setSaleStart(e.target.value)}
          className="border p-2 rounded"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">
          {t.end_date || "Kết thúc"}
        </label>
        <input
          type="datetime-local"
          value={saleEnd}
          onChange={(e) => setSaleEnd(e.target.value)}
          className="border p-2 rounded"
        />
      </div>
    </div>
  </div>
)}

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

        {/* DETAIL IMAGES */}
        <div className="grid grid-cols-3 gap-3">
          {detailImages.map((url) => (
            <div key={url} className="relative h-28">
              <Image src={url} alt="" fill className="object-cover rounded" />
            </div>
          ))}
          <label className="flex items-center justify-center border-2 border-dashed rounded cursor-pointer h-28">
            ＋
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) =>
                uploadImages(
                  Array.from(e.target.files || []),
                  setDetailImages
                )
              }
            />
          </label>
        </div>

        {/* SUBMIT */}
        <button
          disabled={saving}
          className="w-full bg-[#ff6600] text-white py-3 rounded-lg font-semibold"
        >
          {saving ? t.posting : "" + t.post_product}
        </button>
      </form>
    </main>
  );
}
