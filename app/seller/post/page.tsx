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

interface AuthUser {
  role?: string;
}

/* =========================
   PAGE
========================= */
export default function SellerPostPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  const authUser = user as AuthUser | null;

  /* =========================
     STATE
  ========================= */
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [thumbnail, setThumbnail] = useState<string>(""); // ✅ NEW

  const [salePrice, setSalePrice] = useState<number | "">("");
  const [saleStart, setSaleStart] = useState("");
  const [saleEnd, setSaleEnd] = useState("");

  const [stock, setStock] = useState<number | "">(1);
  const [isActive, setIsActive] = useState(true);
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
    if (!loading && (!authUser || authUser.role !== "seller")) {
      router.replace("/account");
    }
  }, [loading, authUser, router]);

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
  async function uploadSingle(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);

    const res = await apiAuthFetch("/api/upload", {
      method: "POST",
      body: form,
    });

    if (!res.ok) throw new Error();

    const data: { url?: string } = await res.json();
    if (!data.url) throw new Error();

    return data.url;
  }

  async function uploadImages(files: File[]) {
    if (!files.length) return;

    if (images.length + files.length > 6) {
      setMessage({
        text: t.max_6_images || "⚠️ Tối đa 6 ảnh",
        type: "error",
      });
      return;
    }

    setUploadingImage(true);

    try {
      for (const file of files) {
        const url = await uploadSingle(file);
        setImages((prev) => [...prev, url]);
      }
    } catch {
      setMessage({
        text: t.upload_failed || "❌ Upload thất bại",
        type: "error",
      });
    } finally {
      setUploadingImage(false);
    }
  }

  async function uploadThumbnail(file: File) {
    setUploadingImage(true);
    try {
      const url = await uploadSingle(file);
      setThumbnail(url);
    } catch {
      setMessage({
        text: "❌ Upload thumbnail thất bại",
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

    if (!authUser || authUser.role !== "seller") return;

    if (!thumbnail) {
      setMessage({
        text: "⚠️ Cần ảnh thumbnail",
        type: "error",
      });
      return;
    }

    const form = e.currentTarget;

    const description = (
      form.elements.namedItem("description") as HTMLTextAreaElement
    ).value;

    const detail = (
      form.elements.namedItem("detail") as HTMLTextAreaElement
    ).value;

    const payload = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value.trim(),
      price: Number(
        (form.elements.namedItem("price") as HTMLInputElement).value
      ),

      salePrice: salePrice || null,
      saleStart: salePrice && saleStart ? localToUTC(saleStart) : null,
      saleEnd: salePrice && saleEnd ? localToUTC(saleEnd) : null,

      description,
      detail: detail || description, // ✅ fallback an toàn

      images,
      thumbnail,

      categoryId: Number(
        (form.elements.namedItem("categoryId") as HTMLSelectElement).value
      ),

      stock: Number(stock),
      is_active: isActive,
    };

    if (!payload.name || payload.price <= 0 || !payload.categoryId) {
      setMessage({
        text: "⚠️ Thiếu dữ liệu",
        type: "error",
      });
      return;
    }

    setSaving(true);

    try {
      const res = await apiAuthFetch("/api/products", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      setMessage({
        text: "🎉 Thành công",
        type: "success",
      });

      setTimeout(() => router.push("/seller/stock"), 800);
    } catch {
      setMessage({
        text: "❌ Lỗi",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading || !authUser) {
    return <main className="p-8 text-center">{t.loading}</main>;
  }

  return (
    <main className="max-w-2xl mx-auto p-4 space-y-4">

      {/* THUMBNAIL */}
      <div>
        <p className="text-sm font-medium">🖼️ Thumbnail</p>
        {thumbnail && (
          <Image src={thumbnail} alt="" width={100} height={100} />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            e.target.files?.[0] && uploadThumbnail(e.target.files[0])
          }
        />
      </div>

      {/* IMAGES */}
      <div>
        <p className="text-sm font-medium">📸 Images</p>
        <input
          type="file"
          multiple
          onChange={(e) =>
            uploadImages(Array.from(e.target.files || []))
          }
        />
      </div>

      {/* DETAIL */}
      <textarea
        name="detail"
        placeholder="Chi tiết sản phẩm"
        className="w-full border p-2"
      />

    </main>
  );
}
