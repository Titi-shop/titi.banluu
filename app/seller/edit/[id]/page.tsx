"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useLanguage } from "../../../context/LanguageContext";

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const { translate } = useLanguage();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "" }>({
    text: "",
    type: "",
  });
  const [sellerUser, setSellerUser] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);

  // ============================
  // 📌 XÁC THỰC USER PI
  // ============================
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pi_user");
      const logged = localStorage.getItem("titi_is_logged_in");

      if (stored && logged === "true") {
        const parsed = JSON.parse(stored);
        const username = (parsed?.user?.username || parsed?.username || "")
          .trim()
          .toLowerCase();
        setSellerUser(username);
      } else {
        router.push("/pilogin");
      }
    } catch {
      router.push("/pilogin");
    }
  }, [router]);

  // ============================
  // 📌 LẤY THÔNG TIN SẢN PHẨM
  // ============================
  useEffect(() => {
    if (!id) return;

    fetch("/api/products", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const found = data.find((p: any) => String(p.id) === String(id));
        if (found) {
          setProduct(found);
          setPreviews(found.images || []);
        }
        setLoading(false);
      })
      .catch(() => {
        setMessage({ text: "Không thể tải thông tin sản phẩm.", type: "error" });
        setLoading(false);
      });
  }, [id]);

  // ============================
  // 📌 UPLOAD ẢNH
  // ============================
  async function handleFileUpload(file: File): Promise<string | null> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "x-filename": encodeURIComponent(file.name),
          "Content-Type": file.type || "application/octet-stream",
        },
        body: arrayBuffer,
      });

      const data = await res.json();
      return data.url || null;
    } catch {
      setMessage({ text: "Không thể tải ảnh lên.", type: "error" });
      return null;
    }
  }

  // ============================
  // 📌 CHỌN ẢNH
  // ============================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    setImages((prev) => [...prev, ...files]);

    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...urls]);
  };

  // ============================
  // 📌 XOÁ ẢNH
  // ============================
  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setProduct((prev: any) => ({
      ...prev,
      images: prev.images?.filter((_: any, i: number) => i !== index),
    }));
  };

  // ============================
  // 📌 LƯU SẢN PHẨM
  // ============================
  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const form = e.currentTarget;

    const name = (form.name as any).value.trim();
    const rawPrice = (form.price as any).value;
    const price = parseFloat(rawPrice.replace(",", "."));

    const salePrice = parseFloat((form.salePrice as any).value || "0");
    const saleStart = (form.saleStart as any).value || "";
    const saleEnd = (form.saleEnd as any).value || "";

    const description = (form.description as any).value;

    if (isNaN(price) || price <= 0) {
      setMessage({ text: "⚠️ Giá không hợp lệ.", type: "error" });
      setSaving(false);
      return;
    }

    // Upload ảnh mới
    const newUrls: string[] = [];
    for (const img of images) {
      const url = await handleFileUpload(img);
      if (url) newUrls.push(url);
    }

    // Hợp nhất ảnh
    const allImages = [...(product.images || []), ...newUrls];

    const res = await fetch("/api/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: product.id,
        name,
        price,
        salePrice: salePrice > 0 ? salePrice : null,
        saleStart,
        saleEnd,
        description,
        images: allImages,
        seller: sellerUser,
      }),
    });

    const result = await res.json();

    if (result.success) {
      setMessage({ text: "✅ Cập nhật thành công!", type: "success" });
      setTimeout(() => router.push("/seller/stock"), 1000);
    } else {
      setMessage({ text: result.message || "❌ Không thể lưu.", type: "error" });
    }

    setSaving(false);
  }

  if (loading)
    return <p className="text-center mt-10 text-gray-600">⏳ Đang tải dữ liệu...</p>;

  if (!product)
    return <p className="text-center mt-10 text-red-500">Không tìm thấy sản phẩm!</p>;

  return (
    <main className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow mt-10 pb-32">
      <h1 className="text-2xl font-bold text-center text-[#ff6600] mb-4">
        ✏️ {translate("edit_product") || "Chỉnh sửa sản phẩm"}
      </h1>

      <p className="text-center text-gray-500 mb-3">
        👤 Người bán: <b>{sellerUser}</b>
      </p>

      {message.text && (
        <p
          className={`text-center mb-2 font-medium ${
            message.type === "success" ? "text-green-600" : "text-red-500"
          }`}
        >
          {message.text}
        </p>
      )}

      <form onSubmit={handleSave} className="space-y-4">

        {/* TÊN */}
        <div>
          <label className="block font-medium mb-1">Tên sản phẩm</label>
          <input
            name="name"
            defaultValue={product.name}
            required
            className="w-full border rounded-md p-2"
          />
        </div>

        {/* GIÁ */}
        <div>
          <label className="block font-medium mb-1">Giá (Pi)</label>
          <input
            name="price"
            type="number"
            defaultValue={product.price}
            step="any"
            min="0.000001"
            className="w-full border rounded-md p-2"
          />
        </div>

        {/* 🎉 SALE */}
        <div className="p-4 border rounded-md bg-orange-50">
          <h2 className="font-semibold text-orange-600 mb-2">
            🔥 Thiết lập giá SALE (không bắt buộc)
          </h2>

          <label className="block text-sm mb-1">Giá sale</label>
          <input
            name="salePrice"
            type="number"
            step="any"
            min="0"
            defaultValue={product.salePrice || ""}
            className="w-full border rounded-md p-2 mb-3"
          />

          <label className="block text-sm mb-1">Ngày bắt đầu</label>
          <input
            name="saleStart"
            type="date"
            defaultValue={product.saleStart || ""}
            className="w-full border rounded-md p-2 mb-3"
          />

          <label className="block text-sm mb-1">Ngày kết thúc</label>
          <input
            name="saleEnd"
            type="date"
            defaultValue={product.saleEnd || ""}
            className="w-full border rounded-md p-2"
          />
        </div>

        {/* MÔ TẢ */}
        <div>
          <label className="block font-medium mb-1">Mô tả</label>
          <textarea
            name="description"
            defaultValue={product.description}
            rows={3}
            className="w-full border rounded-md p-2"
          ></textarea>
        </div>

        {/* ẢNH */}
        <div>
          <label className="block font-medium mb-2">Ảnh sản phẩm</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="w-full"
          />

          <div className="mt-3 space-y-2">
            {previews.map((url, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-gray-50 p-2 border rounded-md"
              >
                <div className="flex items-center gap-2 cursor-pointer"
                     onClick={() => setSelectedPreview(url)}>
                  <img
                    src={url}
                    className="w-16 h-16 object-cover rounded-md border"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="text-red-500 text-lg font-bold px-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* FULL IMAGE VIEW */}
        {selectedPreview && (
          <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center"
            onClick={() => setSelectedPreview(null)}
          >
            <img
              src={selectedPreview}
              className="max-w-[90%] max-h-[80%] rounded-lg shadow-lg"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-[#ff6600] hover:bg-[#e65600] text-white p-3 rounded-lg font-semibold"
        >
          {saving ? "💾 Đang lưu..." : "💾 Lưu thay đổi"}
        </button>
      </form>
    </main>
  );
}
