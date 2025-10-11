"use client";

import { useState } from "react";

export default function AddProductPage() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [message, setMessage] = useState("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const selected = Array.from(files).slice(0, 6);
    setImages(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !price) {
      alert("⚠️ Vui lòng nhập đủ tên và giá sản phẩm!");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("price", price);
      formData.append("description", description);
      images.forEach((img) => formData.append("images", img));

      const res = await fetch("/api/add-product", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Lỗi khi gửi sản phẩm");

      const data = await res.json();
      setMessage("✅ Đăng sản phẩm thành công!");

      // Reset form
      setName("");
      setPrice("");
      setDescription("");
      setImages([]);
      setTimeout(() => setMessage(""), 2500);

      console.log("Sản phẩm mới:", data.product);
    } catch (error) {
      console.error(error);
      setMessage("❌ Lỗi khi đăng sản phẩm!");
    }
  };

  return (
    <main className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center flex items-center justify-center gap-2">
        🛒 Đăng sản phẩm mới
      </h1>

      {message && (
        <p className="text-center mb-3 font-medium text-green-600">{message}</p>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 bg-white shadow p-4 rounded-lg"
        encType="multipart/form-data"
      >
        <div>
          <label className="block mb-1 font-medium">Tên sản phẩm</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nhập tên sản phẩm"
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Giá (Pi)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Nhập giá"
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Mô tả</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả ngắn gọn về sản phẩm"
            className="w-full border px-3 py-2 rounded h-24"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            Hình ảnh sản phẩm (tối đa 6)
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mt-3">
            {images.map((img, i) => (
              <img
                key={i}
                src={URL.createObjectURL(img)}
                alt={`Ảnh ${i + 1}`}
                className="w-full h-24 object-cover rounded border"
              />
            ))}
          </div>
        )}

        <button
          type="submit"
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 rounded mt-4"
        >
          Đăng sản phẩm
        </button>
      </form>
    </main>
  );
}
