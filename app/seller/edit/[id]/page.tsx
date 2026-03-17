"use client";

import { useEffect, useState, FormEvent } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";

/* ================= TYPES ================= */

interface ProductData {
  id: string | number;
  name: string;
  price: number;
  description: string;
  detail?: string | null;
  categoryId: number | null;
  salePrice?: number | null;
  saleStart?: string | null;
  saleEnd?: string | null;
  images: string[];
  detailImages?: string[];
}

interface Category {
  id: number;
  key: string;
}

interface MessageState {
  text: string;
  type: "success" | "error" | "";
}

interface AuthUser {
  role?: string;
}

/* ================= PAGE ================= */

export default function EditProductPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();

  const authUser = user as AuthUser | null;

  /* ================= STATE ================= */

  const [product, setProduct] = useState<ProductData | null>(null);
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

  /* ================= SELLER GUARD ================= */

  useEffect(() => {
    if (!loading && (!authUser || authUser.role !== "seller")) {
      router.replace("/account");
    }
  }, [loading, authUser, router]);

  /* ================= LOAD CATEGORIES ================= */

  useEffect(() => {
    fetch("/api/categories", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: unknown) =>
        setCategories(Array.isArray(d) ? (d as Category[]) : [])
      )
      .catch(() => setCategories([]));
  }, []);

  /* ================= LOAD PRODUCT ================= */

  useEffect(() => {
    if (!id) return;

    apiAuthFetch("/api/products")
      .then((r) => r.json())
      .then((list: ProductData[]) => {
        const found = list.find((p) => String(p.id) === String(id));

        if (!found) {
          setMessage({
            text: t.product_not_found || "Product not found",
            type: "error",
          });
          return;
        }

        setProduct(found);
        setImages(found.images || []);
        setDetailImages(found.detailImages || []);
        setDetail(found.detail || "");

        setSalePrice(found.salePrice ?? "");
        setSaleStart(found.saleStart ? utcToLocal(found.saleStart) : "");
        setSaleEnd(found.saleEnd ? utcToLocal(found.saleEnd) : "");
      });
  }, [id, t]);

  /* ================= IMAGE UPLOAD ================= */

  async function uploadImages(
    files: File[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) {
    if (!files.length) return;

    if (images.length + files.length > 6) {
      setMessage({
        text: t.max_6_images || "⚠️ Max 6 images",
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

        if (!res.ok) throw new Error();

        const data = await res.json();

        if (!data.url) throw new Error();

        setter((prev) => [...prev, data.url]);
      }
    } catch {
      setMessage({
        text: t.upload_failed || "Upload failed",
        type: "error",
      });
    } finally {
      setUploadingImage(false);
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function localToUTC(local: string) {
    return new Date(local).toISOString();
  }

  function utcToLocal(utc: string) {
    const d = new Date(utc);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  }

  /* ================= SUBMIT ================= */

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!product) return;

    if (!images.length) {
      setMessage({
        text: t.need_image || "Need at least 1 image",
        type: "error",
      });
      return;
    }

    if (salePrice) {
      if (!saleStart || !saleEnd) {
        setMessage({
          text: t.need_sale_date || "Need sale date",
          type: "error",
        });
        return;
      }

      if (new Date(saleEnd) <= new Date(saleStart)) {
        setMessage({
          text: t.invalid_sale_range || "Invalid date range",
          type: "error",
        });
        return;
      }
    }

    const form = e.currentTarget;

    const payload = {
      id: product.id,
      name: (form.elements.namedItem("name") as HTMLInputElement).value.trim(),
      price: Number(
        (form.elements.namedItem("price") as HTMLInputElement).value
      ),
      salePrice: salePrice || null,
      saleStart: salePrice ? localToUTC(saleStart) : null,
      saleEnd: salePrice ? localToUTC(saleEnd) : null,
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
    setMessage({ text: "", type: "" });

    try {
      const res = await apiAuthFetch("/api/products", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      setMessage({
        text: t.update_success || "Updated successfully",
        type: "success",
      });

      setTimeout(() => router.push("/seller/stock"), 800);
    } catch {
      setMessage({
        text: t.update_failed || "Update failed",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading || !authUser || !product) {
    return <main className="p-8 text-center">⏳ {t.loading}</main>;
  }

  /* ================= UI ================= */

  return (
    <main className="max-w-2xl mx-auto p-4 pb-28">
      <h1 className="text-xl font-bold text-center mb-4 text-[#ff6600]">
        ✏️ {t.edit_product}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* CATEGORY */}
        <select
          name="categoryId"
          defaultValue={product.categoryId || ""}
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
          defaultValue={product.name}
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
            <label className="flex items-center justify-center border-2 border-dashed rounded h-28 cursor-pointer">
              ＋
              <input
                type="file"
                hidden
                multiple
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
          defaultValue={product.price}
          className="w-full border p-2 rounded"
          required
        />

        {/* SALE */}
        <input
          type="number"
          step="0.00001"
          value={salePrice}
          onChange={(e) =>
            setSalePrice(e.target.value ? Number(e.target.value) : "")
          }
          className="w-full border p-2 rounded"
        />

        {/* SALE TIME */}
        {salePrice && (
          <div className="grid grid-cols-2 gap-3">
            <input
              type="datetime-local"
              value={saleStart}
              onChange={(e) => setSaleStart(e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="datetime-local"
              value={saleEnd}
              onChange={(e) => setSaleEnd(e.target.value)}
              className="border p-2 rounded"
            />
          </div>
        )}

        {/* DESCRIPTION */}
        <textarea
          name="description"
          defaultValue={product.description}
          className="w-full border p-2 rounded"
          required
        />

        {/* DETAIL */}
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          className="w-full border p-2 rounded"
        />

        {/* DETAIL IMAGES */}
        <div className="grid grid-cols-3 gap-3">
          {detailImages.map((url) => (
            <div key={url} className="relative h-28">
              <Image src={url} alt="" fill className="object-cover rounded" />
            </div>
          ))}
          <label className="flex items-center justify-center border-2 border-dashed rounded h-28 cursor-pointer">
            ＋
            <input
              type="file"
              hidden
              multiple
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
          className="w-full bg-[#ff6600] text-white py-3 rounded-lg"
        >
          {saving ? t.saving : t.save_changes}
        </button>
      </form>
    </main>
  );
}
