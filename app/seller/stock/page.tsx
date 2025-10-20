"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
}

export default function SellerStockPage() {
  const { translate } = useLanguage();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // 🧾 Lấy danh sách sản phẩm
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error(err);
        setMessage(translate("load_error") || "Không thể tải sản phẩm.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [translate]);

  // ❌ Xoá sản phẩm
  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      translate("confirm_delete") || "Bạn có chắc muốn xóa sản phẩm này?"
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setMessage(translate("delete_success") || "Đã xóa sản phẩm.");
    } catch (err) {
      console.error(err);
      setMessage(translate("delete_error") || "Lỗi khi xóa sản phẩm.");
    }
  };

  return (
    <main className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-4">
        📦 {translate("stock_manager_title") || "Quản lý kho hàng"}
      </h1>

      {message && (
        <p
          className={`text-center mb-3 font-medium ${
            message.includes("xóa") ? "text-red-600" : "text-green-600"
          }`}
        >
          {message}
        </p>
      )}

      {loading ? (
        <p className="text-center text-gray-500">
          {translate("loading_products") || "Đang tải sản phẩm..."}
        </p>
      ) : products.length === 0 ? (
        <p className="text-center text-gray-500">
          {translate("no_products") || "Không có sản phẩm nào."}
        </p>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white shadow-md rounded-lg p-4 border"
            >
              {product.images?.[0] && (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  width={400}
                  height={300}
                  className="w-full h-48 object-cover rounded-md mb-3"
                />
              )}

              <h2 className="text-lg font-semibold">{product.name}</h2>
              <p className="text-yellow-600 font-medium">
                💰 {product.price} Pi
              </p>
              <p className="text-gray-500">{product.description}</p>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() =>
                    router.push(`/seller/edit/${product.id}`)
                  }
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded"
                >
                  ✏️ {translate("edit") || "Sửa"}
                </button>

                <button
                  onClick={() => handleDelete(product.id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded"
                >
                  ❌ {translate("delete") || "Xóa"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
