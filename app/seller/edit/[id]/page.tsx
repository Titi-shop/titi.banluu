"use client";

import { useEffect, useState, FormEvent } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";

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
  const [images, setImages] = useState<string[]>([]);
  const [detailImages, setDetailImages] = useState<string[]>([]);
  const [detail, setDetail] = useState("");

  const [salePrice, setSalePrice] = useState<number | "">("");
  const [saleStart, setSaleStart] = useState("");
  const [saleEnd, setSaleEnd] = useState("");

  const [loadingPage, setLoadingPage] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [message, setMessage] = useState<MessageState>({
    text: "",
    type: "",
  });

  /* =========================
     AUTH GUARD
  ========================= */
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/pilogin");
      return;
    }

    if (user.role !== "seller" && user.role !== "admin") {
      router.replace("/account");
    }
  }, [authLoading, user, router]);

  /* =========================
     LOAD CATEGORIES
  ========================= */
  useEffect(() => {
    apiAuthFetch("/api/categories")
      .then((r) => r.json())
      .then((d: Category[]) => setCategories(d || []))
      .catch(() => setCategories([]));
  }, []);

  /* =========================
     LOAD PRODUCT
  ========================= */
  useEffect(() => {
    if (!id) {
      setLoadingPage(false);
      return;
    }

    apiAuthFetch("/api/products")
      .then((r) => r.json())
      .then((list: ProductData[]) => {
        const p = list.find((x) => String(x.id) === String(id));
        if (!p) {
          setMessage({ text: t.product_not_found, type: "error" });
          setTimeout(() => router.push("/seller/stock"), 1000);
          return;
        }

        setProduct(p);
        setImages(p.images || []);
        setDetailImages(p.detailImages || []);
        setDetail(p.detail || "");
        setSalePrice(p.salePrice ?? "");
        setSaleStart(formatDateToInput(p.saleStart || null));
        setSaleEnd(formatDateToInput(p.saleEnd || null));
      })
      .finally(() => setLoadingPage(false));
  }, [id, router, t]);

  /* =========================
     IMAGE UPLOAD (REUSE)
  ========================= */
  async function uploadImages(
    files: File[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) {
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

        setter((prev) => [...prev, data.url!]);
      }
    } catch {
      setMessage({ text: "❌ Upload ảnh thất bại", type: "error" });
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleMainImageChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (images.length + files.length > 6) {
      setMessage({
        text: "⚠️ Tối đa 6 ảnh cho mỗi sản phẩm",
        type: "error",
      });
      return;
    }

    await uploadImages(files, setImages);
    e.target.value = "";
  }

  async function handleDetailImageChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    await uploadImages(files, setDetailImages);
    e.target.value = "";
  }

  function removeImage(
    index: number,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) {
    setter((prev) => prev.filter((_, i) => i !== index));
  }

  /* =========================
     SAVE
  ========================= */
  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!product) return;

    if (!images.length) {
      setMessage({
        text: "⚠️ Sản phẩm cần ít nhất 1 ảnh",
        type: "error",
      });
      return;
    }

    if (salePrice && (!saleStart || !saleEnd)) {
      setMessage({
        text: "⚠️ Sale cần có ngày bắt đầu và kết thúc",
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
      saleStart: salePrice ? saleStart || null : null,
      saleEnd: salePrice ? saleEnd || null : null,

      description: (
        form.elements.namedItem("description") as HTMLTextAreaElement
      ).value,
      detail,
      images,
      detailImages,

      categoryId:
        Number(
          (form.elements.namedItem("categoryId") as HTMLSelectElement).value
        ) || null,
    };

    if (!payload.name || payload.price <= 0) {
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
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      setMessage({
        text: t.save_success || "✅ Lưu thành công",
        type: "success",
      });

      setTimeout(() => router.push("/seller/stock"), 900);
    } catch {
      setMessage({
        text: t.save_failed || "❌ Lưu thất bại",
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
    <main className="max-w-2xl mx-auto p-4 pb-32">
      <button
        onClick={() => router.back()}
        className="mb-4 text-blue-600 underline"
      >
        ← {t.back}
      </button>

      <h1 className="text-2xl font-bold text-center mb-4 text-[#ff6600]">
        ✏️ {t.edit_product}
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

      {/* MAIN IMAGES */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {images.map((url, i) => (
          <div key={url} className="relative h-28 rounded overflow-hidden">
            <Image src={url} alt="" fill className="object-cover" />
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
          <label className="flex items-center justify-center border-2 border-dashed rounded cursor-pointer text-gray-400 h-28">
            {uploadingImage ? "⏳" : "＋"}
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={handleMainImageChange}
            />
          </label>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-3">
        <input
          name="name"
          defaultValue={product.name}
          className="w-full border p-2 rounded"
        />

        <input
          name="price"
          type="number"
          step="any"
          inputMode="decimal"
          defaultValue={product.price}
          placeholder="Giá Pi (vd: 0.00000001)"
          className="w-full border p-2 rounded"
        />

        <input
          type="number"
          step="any"
          inputMode="decimal"
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

        <textarea
          name="description"
          defaultValue={product.description}
          className="w-full border p-2 rounded"
        />

        <textarea
          placeholder="Mô tả chi tiết sản phẩm"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          className="w-full border p-2 rounded min-h-[120px]"
        />

        {/* DETAIL IMAGES */}
        <div className="grid grid-cols-3 gap-3">
          {detailImages.map((url, i) => (
            <div key={url} className="relative h-28">
              <Image src={url} alt="" fill className="object-cover rounded" />
              <button
                type="button"
                onClick={() => removeImage(i, setDetailImages)}
                className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 rounded"
              >
                ✕
              </button>
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
          {saving ? t.saving : "💾 " + t.save_changes}
        </button>
      </form>
    </main>
  );
}
