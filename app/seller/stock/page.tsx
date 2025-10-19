"use client";

import { useEffect, useState, ChangeEvent } from "react";
import Image from "next/image";
import { useLanguage } from "../../context/LanguageContext";

interface Product {
  id: number;
  name: string;
  price: string;
  description: string;
  images?: string[];
}

export default function StockManager() {
  const { translate } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    images: [] as File[],
    previews: [] as string[],
  });

  // ✅ Lấy danh sách sản phẩm khi load trang
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error(translate("no_stock"));
      const data: Product[] = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("❌", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Xóa sản phẩm
  const deleteProduct = async (id: number) => {
    if (!confirm(translate("confirm_delete"))) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        alert(translate("deleted_success"));
      } else {
        alert(data.message || translate("delete_error"));
      }
    } catch (err) {
      console.error("❌", err);
      alert(translate("delete_error"));
    }
  };

  // ✅ Mở form chỉnh sửa
  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      price: product.price,
      description: product.description,
      images: [],
      previews: product.images || [],
    });
  };

  // ✅ Lưu chỉnh sửa (upload ảnh nếu có)
  const saveEdit = async () => {
    if (!editingProduct) return;

    try {
      let uploadedUrls: string[] = [];
      if (form.images.length > 0) {
        const uploadToBlob = async (file: File): Promise<string> => {
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: {
              "Content-Type": file.type,
              "x-filename": file.name,
            },
            body: file,
          });
          if (!res.ok) throw new Error(translate("upload_failed"));
          const data = await res.json();
          return data.url;
        };
        uploadedUrls = await Promise.all(form.images.map(uploadToBlob));
      }

      const formData = new FormData();
      formData.append("id", editingProduct.id.toString());
      formData.append("name", form.name);
      formData.append("price", form.price);
      formData.append("description", form.description);

      if (uploadedUrls.length > 0) {
        uploadedUrls.forEach((url) => formData.append("images", url));
      } else if (form.previews.length > 0) {
        form.previews.forEach((url) => formData.append("images", url));
      }

      const res = await fetch("/api/products", { method: "PUT", body: formData });
      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(translate("update_failed"));

      alert(translate("update_success"));
      setEditingProduct(null);
      setProducts((prev) =>
        prev.map((p) => (p.id === data.product.id ? data.product : p))
      );
    } catch (err) {
      console.error("❌", err);
      alert(translate("update_failed"));
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const selected = Array.from(files).slice(0, 6);
    const previews = selected.map((f) => URL.createObjectURL(f));
    setForm({ ...form, images: selected, previews });
  };

  // ✅ Giao diện
  if (loading)
    return <p className="text-center mt-6">⏳ {translate("loading_stock")}</p>;

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">
        📦 {translate("stock_manager_title")}
      </h1>

      {!products.length ? (
        <p className="text-center text-gray-500">❗ {translate("no_stock")}</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((p) => (
            <div
              key={p.id}
              className="border rounded-lg p-4 shadow bg-white flex flex-col justify-between hover:shadow-lg"
            >
              <div>
                <div className="flex gap-2 overflow-x-auto mb-2">
                  {p.images?.length ? (
                    p.images.map((img, idx) => (
                      <Image
                        key={idx}
                        src={
                          img.startsWith("http")
                            ? img
                            : `/uploads/${img.split("\\").pop()}`
                        }
                        alt={p.name}
                        width={100}
                        height={100}
                        className="object-cover rounded border"
                      />
                    ))
                  ) : (
                    <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                      {translate("no_image")}
                    </div>
                  )}
                </div>

                <h2 className="font-semibold text-lg truncate">{p.name}</h2>
                <p className="text-sm text-gray-600">💰 {p.price} Pi</p>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {p.description}
                </p>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => startEdit(p)}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-1 rounded w-1/2"
                >
                  ✏️ {translate("edit")}
                </button>
                <button
                  onClick={() => deleteProduct(p.id)}
                  className="bg-red-500 hover:bg-red-600 text-white py-1 rounded w-1/2"
                >
                  ❌ {translate("delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-center">
              ✏️ {translate("edit_product")}
            </h2>

            <label className="block mb-2">
              {translate("product_name")}:
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border px-2 py-1 rounded mt-1"
              />
            </label>

            <label className="block mb-2">
              {translate("product_price")} (Pi):
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full border px-2 py-1 rounded mt-1"
              />
            </label>

            <label className="block mb-2">
              {translate("product_description")}:
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full border px-2 py-1 rounded mt-1 h-20"
              />
            </label>

            <label className="block mb-3">
              {translate("image")} (tối đa 6):
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="mt-1"
              />
            </label>

            {form.previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {form.previews.map((src, i) => (
                  <Image
                    key={i}
                    src={src}
                    alt="preview"
                    width={100}
                    height={100}
                    className="object-cover rounded border"
                  />
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingProduct(null)}
                className="bg-gray-300 px-3 py-1 rounded hover:bg-gray-400"
              >
                ❌ {translate("cancel")}
              </button>
              <button
                onClick={saveEdit}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded"
              >
                💾 {translate("save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
