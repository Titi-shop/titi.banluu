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

/* ================= PAGE ================= */

export default function EditProductPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [product, setProduct] = useState<ProductData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [detailImages, setDetailImages] = useState<string[]>([]);
  const [detail, setDetail] = useState("");

  const [salePrice, setSalePrice] = useState<number | "">("");
  const [saleStart, setSaleStart] = useState("");
  const [saleEnd, setSaleEnd] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<MessageState>({
    text: "",
    type: "",
  });

  /* ================= AUTH GUARD ================= */

  useEffect(() => {
    if (authLoading) return;
    if (!user || (user.role !== "seller" && user.role !== "admin")) {
      router.replace("/account");
    }
  }, [authLoading, user, router]);

  /* ================= LOAD CATEGORIES ================= */

  useEffect(() => {
    apiAuthFetch("/api/categories")
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
        setSaleStart(found.saleStart ? utcToLocalInput(found.saleStart) : "");
setSaleEnd(found.saleEnd ? utcToLocalInput(found.saleEnd) : "");
      });
  }, [id, t]);

  /* ================= IMAGE UPLOAD ================= */

  async function uploadImages(
    files: File[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) {
    for (const file of files) {
      const form = new FormData();
      form.append("file", file);

      const res = await apiAuthFetch("/api/upload", {
        method: "POST",
        body: form,
      });

      const data = (await res.json()) as { url?: string };
      if (data?.url) {
        setter((prev) => [...prev, data.url as string]);
      }
    }
  }

  function removeImage(
    index: number,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) {
    setter((prev) => prev.filter((_, i) => i !== index));
  }

  /* ================= SAVE ================= */

  function localToUTC(local: string): string {
  return new Date(local).toISOString();
}

function utcToLocalInput(utc: string): string {
  const date = new Date(utc);
  const local = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
  
  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!product) return;

    if (salePrice && (!saleStart || !saleEnd)) {
      setMessage({
        text: t.need_sale_date || "Need sale start & end date",
        type: "error",
      });
      return;
    }

    const form = e.currentTarget;

    const payload = {
      id: product.id,
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

    setSaving(true);

    await apiAuthFetch("/api/products", {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    router.push("/seller/stock");
  }

  if (!product) {
    return (
      <main className="p-8 text-center">
        {t.loading || "Loading..."}
      </main>
    );
  }

  /* ================= UI ================= */

  return (
    <main className="max-w-2xl mx-auto p-4 pb-28">
      <h1 className="text-xl font-bold text-center mb-4 text-[#ff6600]">
        ✏️ {t.edit_product || "Edit Product"}
      </h1>

      {message.text && (
        <p className="text-center text-red-600 mb-3">
          {message.text}
        </p>
      )}

      <form onSubmit={handleSave} className="space-y-4">

        {/* CATEGORY */}
        <select
          name="categoryId"
          defaultValue={product.categoryId || ""}
          className="w-full border p-2 rounded"
          required
        >
          <option value="">
            {t.select_category || "Select category"}
          </option>

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
          placeholder={t.product_name || "Product name"}
          className="w-full border p-2 rounded"
          required
        />

        {/* IMAGES GRID */}
        <div className="grid grid-cols-3 gap-3">
          {images.map((url, i) => (
            <div key={url} className="relative h-28">
              <Image
                src={url}
                alt=""
                fill
                className="object-cover rounded"
              />
              <button
                type="button"
                onClick={() => removeImage(i, setImages)}
                className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 rounded"
              >
                ✕
              </button>
            </div>
          ))}

          {images.length < 6 && (
            <label className="flex items-center justify-center border-2 border-dashed rounded cursor-pointer h-28 text-gray-400">
              ＋
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  uploadImages(files, setImages);
                  e.target.value = "";
                }}
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
          placeholder={t.price_pi || "Price (Pi)"}
          className="w-full border p-2 rounded"
          required
        />

        {/* SALE PRICE */}
        <input
          type="number"
          step="0.00001"
          placeholder={
            t.sale_price_optional || "Sale price (optional)"
          }
          value={salePrice}
          onChange={(e) =>
            setSalePrice(e.target.value ? Number(e.target.value) : "")
          }
          className="w-full border p-2 rounded"
        />

        {salePrice && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 font-medium">
              📅 {t.sale_time || "Sale time"}
            </p>

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
          </div>
        )}

        {/* DESCRIPTION */}
        <textarea
          name="description"
          defaultValue={product.description}
          placeholder={t.description || "Description"}
          className="w-full border p-2 rounded min-h-[80px]"
        />

        {/* DETAIL */}
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder={t.product_detail || "Product detail"}
          className="w-full border p-2 rounded min-h-[120px]"
        />

        {/* DETAIL IMAGES */}
        <div className="grid grid-cols-3 gap-3">
          {detailImages.map((url, i) => (
            <div key={url} className="relative h-28">
              <Image
                src={url}
                alt=""
                fill
                className="object-cover rounded"
              />
              <button
                type="button"
                onClick={() =>
                  removeImage(i, setDetailImages)
                }
                className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 rounded"
              >
                ✕
              </button>
            </div>
          ))}

          <label className="flex items-center justify-center border-2 border-dashed rounded cursor-pointer h-28 text-gray-400">
            ＋
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                uploadImages(files, setDetailImages);
                e.target.value = "";
              }}
            />
          </label>
        </div>

        {/* SAVE BUTTON */}
        <button
          disabled={saving}
          className="w-full bg-[#ff6600] text-white py-3 rounded-lg font-semibold"
        >
          {saving
            ? t.saving || "Saving..."
            : t.save_changes || "Save changes"}
        </button>
      </form>
    </main>
  );
}
