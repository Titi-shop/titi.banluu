"use client";
import { useEffect, useState } from "react";

export default function StockManager() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    images: [] as File[],
    previews: [] as string[],
  });

  // 🧾 Lấy danh sách sản phẩm
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Không thể tải danh sách sản phẩm");
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("❌ Lỗi tải sản phẩm:", err);
    } finally {
      setLoading(false);
    }
  };

  // ❌ Xóa sản phẩm
  const deleteProduct = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này không?")) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert("Lỗi khi xóa sản phẩm!");
      }
    } catch (err) {
      console.error("❌ Lỗi khi xóa:", err);
    }
  };

  // ✏️ Mở popup sửa
  const startEdit = (product: any) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      price: product.price,
      description: product.description,
      images: [],
      previews: product.images || [],
    });
  };

  // 💾 Lưu cập nhật sản phẩm (cho phép nhiều ảnh)
  const saveEdit = async () => {
    if (!editingProduct) return;

    try {
      const formData = new FormData();
      formData.append("id", editingProduct.id);
      formData.append("name", form.name);
      formData.append("price", form.price);
      formData.append("description", form.description);

      form.images.forEach((img) => formData.append("images", img));

      const res = await fetch("/api/products", {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error("Cập nhật thất bại");

      alert("✅ Đã cập nhật sản phẩm thành công!");
      setEditingProduct(null);
      setProducts((prev) =>
        prev.map((p) => (p.id === data.product.id ? data.product : p))
      );
    } catch (err) {
      console.error("❌ Lỗi khi lưu:", err);
      alert("Không thể cập nhật sản phẩm!");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const selected = Array.from(files).slice(0, 6);
    const previews = selected.map((f) => URL.createObjectURL(f));
    setForm({ ...form, images: selected, previews });
  };

  if (loading) {
    return <p className="text-center mt-6">⏳ Đang tải kho hàng...</p>;
  }

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">
        📦 Quản lý Kho hàng
      </h1>

      {!products.length ? (
        <p className="text-center text-gray-500">
          ❗ Chưa có sản phẩm nào trong kho.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((p) => (
            <div
              key={p.id}
              className="border rounded-lg p-4 shadow bg-white flex flex-col justify-between hover:shadow-lg"
            >
              <div>
                {/* ✅ Hiển thị tất cả ảnh */}
                <div className="flex gap-2 overflow-x-auto mb-2">
                  {p.images?.length > 0 ? (
                    p.images.map((img: string, idx: number) => (
                      <img
                        key={idx}
                        src={img}
                        alt={p.name}
                        className="w-20 h-20 object-cover rounded border"
                      />
                    ))
                  ) : (
                    <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                      Không có ảnh
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
                  ✏️ Sửa
                </button>
                <button
                  onClick={() => deleteProduct(p.id)}
                  className="bg-red-500 hover:bg-red-600 text-white py-1 rounded w-1/2"
                >
                  ❌ Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✏️ Popup chỉnh sửa */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-center">
              ✏️ Chỉnh sửa sản phẩm
            </h2>

            <label className="block mb-2">
              Tên sản phẩm:
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border px-2 py-1 rounded mt-1"
              />
            </label>

            <label className="block mb-2">
              Giá (Pi):
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full border px-2 py-1 rounded mt-1"
              />
            </label>

            <label className="block mb-2">
              Mô tả:
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full border px-2 py-1 rounded mt-1 h-20"
              />
            </label>

            <label className="block mb-3">
              Ảnh sản phẩm (tối đa 6):
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
                  <img
                    key={i}
                    src={src}
                    alt="preview"
                    className="w-full h-20 object-cover rounded border"
                  />
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingProduct(null)}
                className="bg-gray-300 px-3 py-1 rounded hover:bg-gray-400"
              >
                ❌ Hủy
              </button>
              <button
                onClick={saveEdit}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded"
              >
                💾 Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
