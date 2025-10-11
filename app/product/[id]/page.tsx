"use client";
import { useEffect, useState } from "react";

export default function ProductDetail({ params }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const resolvedParams = await params;
        const productId = resolvedParams.id;

        const res = await fetch("/api/add-product");
        const products = await res.json();

        const found = products.find((p) => p.id === Number(productId));
        setProduct(found);
      } catch (err) {
        console.error("Lỗi khi tải sản phẩm:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [params]);

  const handleAddToCart = () => {
    if (!product) return;
    let cart = JSON.parse(localStorage.getItem("cart") || "[]");
    cart.push(product);
    localStorage.setItem("cart", JSON.stringify(cart));
    alert("✅ Đã thêm vào giỏ hàng!");
  };

  const handleCheckout = () => {
  if (!product) return;
  localStorage.setItem("cart", JSON.stringify([product]));
  window.location.href = "/checkout"; // ✅ điều hướng sang trang thanh toán
};


  if (loading)
    return <p className="text-center mt-6">⏳ Đang tải sản phẩm...</p>;
  if (!product)
    return <p className="text-center mt-6">❌ Không tìm thấy sản phẩm.</p>;

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
          {product.images.map((src, i) => (
            <img
              key={i}
              src={src}
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
