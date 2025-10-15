"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useCart } from "../../context/CartContext"; // ✅ dùng chung context giỏ hàng

export default function ProductDetail() {
  const { id } = useParams(); // ✅ Lấy id từ URL
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart, clearCart } = useCart(); // ✅ lấy hàm từ context

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch("/api/products");
        const products = await res.json();

        const found = products.find((p: any) => p.id.toString() === id.toString());
        setProduct(found);
      } catch (err) {
        console.error("Lỗi khi tải sản phẩm:", err);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      description: product.description,
      images: product.images,
    });
    alert("✅ Đã thêm vào giỏ hàng!");
  };

  const handleCheckout = () => {
    if (!product) return;
    clearCart(); // xoá giỏ cũ để chỉ thanh toán 1 sản phẩm
    addToCart({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      description: product.description,
      images: product.images,
    });
    window.location.href = "/checkout"; // điều hướng sang trang thanh toán
  };

  if (loading)
    return <p className="text-center mt-6">⏳ Đang tải sản phẩm...</p>;

  if (!product)
    return <p className="text-center mt-6 text-red-600 font-medium">
      ❌ Không tìm thấy sản phẩm.
    </p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
      <p className="text-lg text-yellow-600 font-semibold mb-1">
        Giá: {product.price} Pi
      </p>
      <p className="text-gray-700 mb-4">
        <b>Mô tả:</b> {product.description || "Không có mô tả."}
      </p>

      {product.images?.length > 0 && (
        <div className="flex gap-3 flex-wrap mb-6">
          {product.images.map((src: string, i: number) => (
            <img
              key={i}
              src={src.startsWith("/uploads/") ? src : `/uploads/${src.split("\\").pop()}`}
              alt={`Ảnh ${i + 1}`}
              className="w-40 h-40 object-cover rounded border"
            />
          ))}
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <button
          onClick={handleAddToCart}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow transition"
        >
          🛒 Thêm giỏ hàng
        </button>

        <button
          onClick={handleCheckout}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow transition"
        >
          💳 Thanh toán
        </button>
      </div>
    </div>
  );
}
