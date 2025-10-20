"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { useLanguage } from "../../context/LanguageContext";

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart, clearCart } = useCart();
  const { translate } = useLanguage();

  // ✅ Lấy sản phẩm theo ID
  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch("/api/products");
        const products = await res.json();
        const found = products.find((p: any) => p.id.toString() === id.toString());
        setProduct(found);
      } catch (err) {
        console.error("❌ Lỗi khi tải sản phẩm:", err);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchProduct();
  }, [id]);

  // ✅ Thêm sản phẩm vào giỏ + tự chuyển đến trang giỏ hàng
  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      description: product.description,
      images: product.images,
    });
    alert("✅ " + translate("added_to_cart"));
    router.push("/cart");
  };

  // ✅ Thanh toán nhanh (chuyển sang checkout)
  const handleCheckout = () => {
    if (!product) return;
    clearCart();
    addToCart({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      description: product.description,
      images: product.images,
    });
    router.push("/checkout");
  };

  if (loading)
    return <p className="text-center mt-6">⏳ {translate("loading")}</p>;

  if (!product)
    return (
      <p className="text-center mt-6 text-red-600 font-medium">
        ❌ {translate("no_products")}
      </p>
    );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* 🏷️ Thông tin sản phẩm */}
      <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
      <p className="text-lg text-yellow-600 font-semibold mb-1">
        {translate("product_price")}: {product.price} Pi
      </p>
      <p className="text-gray-700 mb-4">
        <b>{translate("product_description")}:</b>{" "}
        {product.description || translate("no_description")}
      </p>

      {/* 🖼️ Hiển thị ảnh sản phẩm */}
      {product.images?.length > 0 ? (
        <div className="flex gap-3 flex-wrap mb-6">
          {product.images.map((src: string, i: number) => {
            const validSrc =
              src.startsWith("http") || src.startsWith("https")
                ? src
                : `/uploads/${src.split("\\").pop()}`;
            return (
              <img
                key={i}
                src={validSrc}
                alt={`${translate("image")} ${i + 1}`}
                className="w-40 h-40 object-cover rounded border"
              />
            );
          })}
        </div>
      ) : (
        <div className="w-full aspect-square bg-gray-100 flex items-center justify-center text-gray-400 rounded-lg mb-6">
          {translate("no_image")}
        </div>
      )}

      {/* 🛒 Nút hành động */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleAddToCart}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow transition"
        >
          🛒 {translate("add_to_cart")}
        </button>

        <button
          onClick={handleCheckout}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow transition"
        >
          💳 {translate("checkout_now")}
        </button>
      </div>
    </div>
  );
}
