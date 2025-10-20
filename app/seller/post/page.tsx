"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLanguage } from "../../context/LanguageContext";

export default function SellerPostPage() {
  const router = useRouter();
  const { translate } = useLanguage();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  // ===============================
  // 🖼 Xử lý chọn ảnh
  // ===============================
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const selected = Array.from(files).slice(0, 6);
    setImages(selected);
    setPreviewUrls(selected.map((f) => URL.createObjectURL(f)));
  };

  // ===============================
  // ☁️ Upload ảnh lên Vercel Blob
  // ===============================
  const uploadToBlob = async (file: File): Promise<string> => {
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": file.type,
        "x-filename": file.name,
      },
      body: file,
    });

    if (!res.ok) throw new Error(translate("upload_failed") || "Upload thất bại");
    const data = await res.json();
    return data.url;
  };

  // ===============================
  // 🧾 Gửi dữ liệu sản phẩm
  // ===============================
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name || !price) {
      alert(translate("fill_name_price") || "⚠️ Nhập đủ tên và giá sản phẩm!");
      return;
    }

    try {
      setUploading(true);
      setMessage(translate("uploading_images") || "📤 Đang tải ảnh lên Vercel Blob...");

      const uploadedUrls = await Promise.all(images.map(uploadToBlob));

      setMessage(translate("saving_product") || "📦 Đang lưu sản phẩm...");

      const product = {
        name,
        price: Number(price),
        description,
        images: uploadedUrls,
        createdAt: new Date().toISOString(),
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });

      if (!res.ok) throw new Error("Error saving product");

      setMessage(translate("post_success") || "✅ Đăng sản phẩm thành công!");
      setName("");
      setPrice("");
      setDescription("");
      setImages([]);
      setPreviewUrls([]);

      setTimeout(() => {
        setMessage("");
        router.push("/seller/stock");
      }, 1500);
    } catch (err) {
      console.error(err);
      setMessage(translate("post_failed") || "❌ Đăng sản phẩm thất bại!");
    } finally {
      setUploading(false);
    }
  };

  // ===============================
  // 📱 Giao diện form
  // ===============================
  return (
    <main className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">
        🛒 {translate("post_product") || "Đăng sản phẩm mới"}
      </h1>

      {message && (
        <p
          className={`text-center mb-3 font-medium ${
            message.includes("✅")
              ? "text-green-600"
              : message.includes("❌")
              ? "text-red-600"
              : "text-orange-600"
          }`}
        >
          {message}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 bg-white shadow p-4 rounded-lg"
      >
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={translate("product_name") || "Tên sản phẩm"}
          className="border p-2 rounded"
          required
        />

        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder={translate("product_price") || "Giá (Pi)"}
          className="border p-2 rounded"
          required
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={translate("product_description") || "Mô tả sản phẩm"}
          className="border p-2 rounded h-24"
        />

        <label className="text-sm text-gray-600 font-medium">
          {translate("image") || "Ảnh"} (tối đa 6):
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          className="border p-2 rounded"
        />

        {previewUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mt-3">
            {previewUrls.map((url, i) => (
              <Image
                key={i}
                src={url}
                alt={`${translate("image") || "Ảnh"} ${i + 1}`}
                width={120}
                height={120}
                className="object-cover rounded border"
              />
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={uploading}
          className={`${
            uploading
              ? "bg-gray-400"
              : "bg-yellow-500 hover:bg-yellow-600"
          } text-white py-2 rounded mt-4`}
        >
          {uploading
            ? `⏳ ${translate("posting") || "Đang đăng..."}`
            : `📦 ${translate("post_product") || "Đăng sản phẩm"}`}
        </button>

        <button
          type="button"
          onClick={() => router.push("/seller")}
          className="bg-gray-300 hover:bg-gray-400 text-black py-2 rounded mt-2"
        >
          ↩️ {translate("back_seller_area") || "Quay lại khu vực Người Bán"}
        </button>
      </form>
    </main>
  );
}
