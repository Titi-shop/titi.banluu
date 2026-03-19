"use client";

import { useState, FormEvent, useEffect } from "react";
import Image from "next/image";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";

/* =========================
   TYPES
========================= */
interface Category {
  id: number;
  key: string;
  icon?: string;
}

interface ProductPayload {
  id?: number; // Có khi edit
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

interface ProductFormProps {
  categories: Category[];
  initialData?: ProductPayload; // Khi edit
  onSubmit: (payload: ProductPayload) => Promise<void>;
}

/* =========================
   COMPONENT
========================= */
export default function ProductForm({
  categories,
  initialData,
  onSubmit,
}: ProductFormProps) {
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [salePrice, setSalePrice] = useState<number | "">(
    initialData?.salePrice || ""
  );
  const [saleStart, setSaleStart] = useState(initialData?.saleStart || "");
  const [saleEnd, setSaleEnd] = useState(initialData?.saleEnd || "");
  const [stock, setStock] = useState<number | "">(initialData?.stock || 1);
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "" }>({
    text: "",
    type: "",
  });

  if (loading || !user) {
    return <div className="text-center p-8">{t.loading}</div>;
  }

  const localToUTC = (local: string) => new Date(local).toISOString();

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (
    files: File[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
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

        const res = await apiAuthFetch("/api/upload", { method: "POST", body: form });
        if (!res.ok) throw new Error("UPLOAD_FAILED");

        const data = (await res.json()) as { url?: string };
        if (!data.url) throw new Error("NO_URL_RETURNED");

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
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;

    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const price = Number((form.elements.namedItem("price") as HTMLInputElement).value);
    const categoryId = Number(
      (form.elements.namedItem("categoryId") as HTMLSelectElement).value
    );
    const description = (form.elements.namedItem("description") as HTMLTextAreaElement).value;
    const detail = (form.elements.namedItem("detail") as HTMLTextAreaElement).value;

    if (!images.length) {
      setMessage({ text: t.need_image || "⚠️ Cần ít nhất 1 ảnh sản phẩm", type: "error" });
      return;
    }

    if (!name || price <= 0 || !categoryId) {
      setMessage({
        text: t.enter_valid_name_price || "⚠️ Nhập đầy đủ danh mục, tên và giá",
        type: "error",
      });
      return;
    }

    if (salePrice) {
      if (!saleStart || !saleEnd) {
        setMessage({ text: t.need_sale_date || "⚠️ Sale cần ngày bắt đầu và kết thúc", type: "error" });
        return;
      }
      if (new Date(saleEnd) <= new Date(saleStart)) {
        setMessage({ text: t.invalid_sale_range || "⚠️ Ngày kết thúc phải sau ngày bắt đầu", type: "error" });
        return;
      }
    }

    const payload: ProductPayload = {
      id: initialData?.id,
      name,
      price,
      salePrice: salePrice || null,
      saleStart: salePrice && saleStart ? localToUTC(saleStart) : null,
      saleEnd: salePrice && saleEnd ? localToUTC(saleEnd) : null,
      description,
      detail,
      images,
      thumbnail: images[0],
      categoryId,
      stock: Number(stock),
      is_active: isActive,
    };

    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      await onSubmit(payload);
      setMessage({ text: t.post_success || "🎉 Đăng sản phẩm thành công", type: "success" });
    } catch {
      setMessage({ text: t.post_failed || "❌ Đăng thất bại", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* CATEGORY */}
      <select name="categoryId" className="w-full border p-2 rounded" required defaultValue={initialData?.categoryId || ""}>
        <option value="">{t.select_category}</option>
        {categories.map((c) => {
          const key = c.key as keyof typeof t;
          return <option key={c.id} value={c.id}>{t[key] ?? c.key}</option>;
        })}
      </select>

      {/* NAME */}
      <input name="name" defaultValue={initialData?.name || ""} placeholder={t.product_name} className="w-full border p-2 rounded" required />

      {/* IMAGES */}
      <div className="grid grid-cols-3 gap-3">
        {images.map((url, i) => (
          <div key={url} className="relative h-28">
            <Image src={url} alt="" fill className="object-cover rounded" />
            <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 rounded">✕</button>
          </div>
        ))}
        {images.length < 6 && (
          <label className="flex items-center justify-center border-2 border-dashed rounded cursor-pointer h-28">
            ＋
            <input type="file" accept="image/*" multiple hidden onChange={(e) => uploadImages(Array.from(e.target.files || []), setImages)} />
          </label>
        )}
      </div>

      {/* PRICE */}
      <input name="price" type="number" step="0.00001" defaultValue={initialData?.price} placeholder={t.price_pi} className="w-full border p-2 rounded" required />

      {/* STOCK */}
      <input type="number" min={0} placeholder="Stock" value={stock} onChange={(e) => setStock(e.target.value ? Number(e.target.value) : "")} className="w-full border p-2 rounded" />

      {/* ACTIVE */}
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        <span>{t.active || "Hiển thị sản phẩm"}</span>
      </label>

      {/* SALE */}
      <input type="number" step="0.00001" placeholder={t.sale_price_optional} value={salePrice} onChange={(e) => setSalePrice(e.target.value ? Number(e.target.value) : "")} className="w-full border p-2 rounded" />
      {salePrice && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 font-medium">📅 {t.sale_time || "Thời gian khuyến mãi"}</p>
          <div className="grid grid-cols-2 gap-3">
            <input type="datetime-local" value={saleStart} onChange={(e) => setSaleStart(e.target.value)} className="border p-2 rounded" />
            <input type="datetime-local" value={saleEnd} onChange={(e) => setSaleEnd(e.target.value)} className="border p-2 rounded" />
          </div>
        </div>
      )}

      {/* DESCRIPTION */}
      <textarea name="description" defaultValue={initialData?.description || ""} placeholder={t.description} required className="w-full border p-2 rounded min-h-[70px]" />

      {/* DETAIL */}
      <textarea name="detail" defaultValue={initialData?.detail || ""} placeholder="Chi tiết sản phẩm (HTML + ảnh)" className="w-full border p-2 rounded min-h-[120px]" />

      {/* SUBMIT */}
      <button disabled={saving} className="w-full bg-[#ff6600] text-white py-3 rounded-lg font-semibold">
        {saving ? t.posting : initialData ? t.update_product || "Cập nhật sản phẩm" : t.post_product}
      </button>

      {/* MESSAGE */}
      {message.text && <p className={`text-sm ${message.type === "error" ? "text-red-500" : "text-green-500"}`}>{message.text}</p>}
    </form>
  );
}
