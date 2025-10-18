"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SellerPostPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const selected = Array.from(files).slice(0, 6);
    setImages(selected);
    setPreviewUrls(selected.map((f) => URL.createObjectURL(f)));
  };

  // 🧩 Hàm upload ảnh lên Vercel Blob
  const uploadToBlob = async (file: File): Promise<string> => {
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": file.type,
        "x-filename": file.name,
      },
      body: file,
    });
    if (!res.ok) throw new Error("Upload thất bại");
    const data = await res.json();
    return data.url;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !price) return alert("⚠️ Nhập đủ tên và giá sản phẩm!");

    try {
      setUploading(true);
      setMessage("Đang tải ảnh lên Vercel Blob...");

      // ✅ Upload ảnh lên Blob song song
      const uploadedUrls = await Promise.all(images.map(uploadToBlob));

      // ✅ Gửi dữ liệu sản phẩm lên server
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

      if (!res.ok) throw new Error("Lỗi khi đăng sản phẩm");

      setMessage("✅ Đăng sản phẩm thành công!");
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
      setMessage("❌ Đăng sản phẩm thất bại!");
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">🛒 Đăng sản phẩm mới</h1>

      {message && (
        <p
          className={`text-center mb-3 font-medium ${
            message.includes("✅") ? "text-green-600" : "text-orange-600"
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
          placeholder="Tên sản phẩm"
          className="border p-2 rounded"
          required
        />

        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Giá (Pi)"
          className="border p-2 rounded"
          required
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả sản phẩm"
          className="border p-2 rounded h-24"
        />

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
                alt={`Ảnh ${i + 1}`}
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
            uploading ? "bg-gray-400" : "bg-yellow-500 hover:bg-yellow-600"
          } text-white py-2 rounded mt-4`}
        >
          {uploading ? "⏳ Đang đăng..." : "📦 Đăng sản phẩm"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/seller")}
          className="bg-gray-300 hover:bg-gray-400 text-black py-2 rounded mt-2"
        >
          ↩️ Quay lại khu vực Người Bán
        </button>
      </form>
    </main>
  );
}
