"use client";

import {
  useEffect,
  useState,
  useRef,
  ChangeEvent,
  FormEvent,
} from "react";
import { useRouter, useParams } from "next/navigation";
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
  seller: string;
  images: string[];
}

interface Category {
  id: number;
  name: string;
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

  const [message, setMessage] = useState<{ text: string; type: string }>({
    text: "",
    type: "",
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  /* =========================
     🔐 AUTH GUARD (SELLER ONLY)
     - AUTH-CENTRIC
     - NO COOKIE
     - NO /api/users/me
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
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data || []));
  }, []);

  /* =========================
     LOAD PRODUCT
  ========================= */
  useEffect(() => {
    if (!id) {
      setMessage({
        text: t.product_not_found,
        type: "error",
      });
      setLoadingPage(false);
      return;
    }

    fetch("/api/products", { cache: "no-store" })
      .then((r) => r.json())
      .then((list: ProductData[]) => {
        const p = list.find((x) => x.id == id);

        if (!p) {
          setMessage({
            text: t.product_not_found,
            type: "error",
          });
          setTimeout(() => router.push("/seller/stock"), 1500);
          return;
        }

        setProduct(p);
        setPreviews(p.images || []);
      })
      .finally(() => setLoadingPage(false));
  }, [id, t, router]);

  /* =========================
     UPLOAD FILE
  ========================= */
  async function handleFileUpload(file: File): Promise<string | null> {
    try {
      const arr = await file.arrayBuffer();
      const upload = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "x-filename": encodeURIComponent(file.name),
          "Content-Type": file.type,
        },
        body: arr,
      });
      const data = await upload.json();
      return data.url;
    } catch {
      return null;
    }
  }

  /* =========================
     IMAGE HANDLERS
  ========================= */
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages((prev) => [...prev, ...files]);
    setPreviews((prev) => [
      ...prev,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const removeImage = (i: number) => {
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
    setProduct((prev) =>
      prev
        ? {
            ...prev,
            images: prev.images.filter((_, idx) => idx !== i),
          }
        : prev
    );
  };

  /* =========================
     SAVE PRODUCT
  ========================= */
  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!product) return;

    setSaving(true);

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
      categoryId: Number(
        (form.elements.namedItem("categoryId") as HTMLSelectElement).value
      ),
      salePrice:
        Number(
          (form.elements.namedItem("salePrice") as HTMLInputElement).value
        ) || null,
      saleStart:
        (form.elements.namedItem("saleStart") as HTMLInputElement).value || null,
      saleEnd:
        (form.elements.namedItem("saleEnd") as HTMLInputElement).value || null,
      images: [],
      seller: "",
    };

    const newUrls: string[] = [];
    for (const f of images) {
      const url = await handleFileUpload(f);
      if (url) newUrls.push(url);
    }

    payload.images = [...(product.images || []), ...newUrls];

    const res = await fetch("/api/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (res.ok) {
      setMessage({ text: t.save_success, type: "success" });
      setTimeout(() => router.push("/seller/stock"), 1000);
    } else {
      setMessage({
        text: result.error || t.save_failed,
        type: "error",
      });
    }

    setSaving(false);
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
        <div>
          <label>{t.product_name}</label>
          <input
            name="name"
            defaultValue={product.name}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label>{t.price_pi}</label>
          <input
            name="price"
            type="number"
            defaultValue={product.price}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label>{t.category}</label>
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
        </div>

        {/* SALE */}
        <div className="p-3 bg-orange-50 border rounded">
          <h3 className="font-bold text-orange-600 mb-2">
            🔥 {t.sale}
          </h3>

          <label>{t.sale_price}</label>
          <input
            name="salePrice"
            type="number"
            defaultValue={product.salePrice || ""}
            className="w-full border p-2 rounded mb-2"
          />

          <label>{t.start_date}</label>
          <input
            name="saleStart"
            type="date"
            defaultValue={formatDateToInput(product.saleStart)}
            className="w-full border p-2 rounded mb-2"
          />

          <label>{t.end_date}</label>
          <input
            name="saleEnd"
            type="date"
            defaultValue={formatDateToInput(product.saleEnd)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label>{t.description}</label>
          <textarea
            name="description"
            defaultValue={product.description}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* IMAGES */}
        <div>
          <label>{t.product_images}</label>
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          <div className="mt-3 space-y-2">
            {previews.map((url, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-gray-50 p-2 border rounded"
              >
                <img
                  src={url}
                  className="w-16 h-16 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="text-red-600 font-bold"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          disabled={saving}
          className="w-full bg-[#ff6600] text-white p-3 rounded-lg mt-3"
        >
          {saving ? t.saving : "💾 " + t.save_changes}
        </button>
      </form>
    </main>
  );
}
