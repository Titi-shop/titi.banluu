"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { useLanguage } from "../../context/LanguageContext";
import { ArrowLeft, ShoppingCart, X } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { addToCart, clearCart } = useCart();
  const { translate } = useLanguage();

  // 🧠 Hàm chuyển ảnh khi vuốt
  const handleSwipe = (direction: string) => {
    if (direction === "left") handleNext();
    else handlePrev();
  };

  // 🧠 Load sản phẩm từ API
  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch("/api/products");
        const products = await res.json();
        const found = products.find((p: any) => p.id.toString() === id.toString());
        if (found) setProduct(found);
      } catch (err) {
        console.error("❌ Lỗi khi tải sản phẩm:", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchProduct();
  }, [id]);

  if (loading)
    return <p className="text-center mt-6">⏳ {translate("loading")}</p>;
  if (!product)
    return (
      <p className="text-center mt-6 text-red-600 font-medium">
        ❌ {translate("no_products")}
      </p>
    );

  // 🧩 Xử lý đường dẫn ảnh
  const validImages =
    product.images?.map((src: string) =>
      src.startsWith("http") ? src : `/uploads/${src.split("\\").pop()}`
    ) || [];

  // 🖼️ Chuyển ảnh
  const handleNext = () =>
    setCurrentIndex((prev) => (prev + 1) % validImages.length);
  const handlePrev = () =>
    setCurrentIndex((prev) =>
      prev === 0 ? validImages.length - 1 : prev - 1
    );

  // 🛒 Giỏ hàng & Thanh toán
  const handleAddToCart = () => {
    addToCart({ ...product, quantity });
    alert("✅ " + translate("added_to_cart"));
  };
  const handleCheckout = () => {
    clearCart();
    addToCart({ ...product, quantity });
    router.push("/checkout");
  };

  return (
    <div className="pb-36 bg-gray-50 min-h-screen">
      {/* 🔝 Header */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow z-50 flex items-center justify-between px-4 py-3 border-b">
        <button
          onClick={() => router.back()}
          className="text-gray-700 hover:text-orange-500 flex items-center gap-1"
        >
          <ArrowLeft size={22} />
          <span className="font-medium">{translate("back")}</span>
        </button>
        <h1 className="text-base font-semibold text-gray-800 truncate max-w-[60%]">
          {product.name}
        </h1>
        <button
          onClick={() => router.push("/cart")}
          className="text-gray-700 hover:text-orange-500"
        >
          <ShoppingCart size={22} />
        </button>
      </div>

      {/* 🖼️ Slider ảnh */}
      <div
        className="relative w-full h-80 bg-white flex justify-center items-center overflow-hidden mt-14"
        onDoubleClick={() => setShowLightbox(true)}
        onTouchStart={(e) =>
          (e.currentTarget.dataset.x = e.touches[0].clientX.toString())
        }
        onTouchEnd={(e) => {
          const startX = parseFloat(e.currentTarget.dataset.x || "0");
          const diff = e.changedTouches[0].clientX - startX;
          if (Math.abs(diff) > 50)
            handleSwipe(diff > 0 ? "right" : "left");
        }}
      >
        {validImages.length > 0 ? (
          <img
            src={validImages[currentIndex]}
            alt={product.name}
            className="w-full h-full object-cover transition-all duration-500"
          />
        ) : (
          <div className="text-gray-400">Không có ảnh</div>
        )}

        {/* 🔘 Chấm tròn chỉ báo */}
        <div className="absolute bottom-3 flex justify-center w-full gap-2">
          {validImages.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full ${
                i === currentIndex ? "bg-orange-500" : "bg-gray-300"
              }`}
            ></span>
          ))}
        </div>
      </div>

      {/* 🧾 Tên + Giá Pi cùng hàng */}
      <div className="bg-white p-4 mt-2 shadow-sm flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">{product.name}</h2>
        <p className="text-xl font-bold text-orange-600">π {product.price}</p>
      </div>

      {/* 👁 Thông tin thêm */}
      <div className="bg-white px-4 pb-3 flex items-center gap-4 text-gray-500 text-sm border-b">
        <span>👁 {product.views ?? 11}</span>
        <span>🛒 {product.sold ?? 0} đã bán</span>
        <span>⭐ 5.0</span>
      </div>

      {/* 📦 Mô tả */}
<div className="bg-white p-4 text-gray-700 text-sm leading-relaxed whitespace-pre-line">
  {product.description}
</div>

      {/* 🛍️ Nút hành động - nằm trên thanh điều hướng */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t shadow-md flex justify-between px-3 py-2 z-50">
        <button
          onClick={handleAddToCart}
          className="flex-1 mx-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 rounded-md"
        >
          Giỏ hàng
        </button>
        <button
          onClick={handleCheckout}
          className="flex-1 mx-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-md"
        >
          Thanh toán
        </button>
      </div>

      {showLightbox && (
  <div
    className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
    onClick={() => setShowLightbox(false)}
    // 👇 Thêm 2 sự kiện này để xử lý vuốt ảnh
    onTouchStart={(e) =>
      (e.currentTarget.dataset.x = e.touches[0].clientX.toString())
    }
    onTouchEnd={(e) => {
      const startX = parseFloat(e.currentTarget.dataset.x || "0");
      const diff = e.changedTouches[0].clientX - startX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) handlePrev(); // Vuốt sang phải => ảnh trước
        else handleNext();          // Vuốt sang trái => ảnh kế tiếp
      }
    }}
  >
    {/* Nút đóng */}
    <button
      onClick={() => setShowLightbox(false)}
      className="absolute top-5 right-5 text-white text-3xl z-50"
    >
      <X />
    </button>

    {/* Ảnh có thể zoom */}
    <div className="w-[450px] h-[450px] bg-black rounded-lg flex items-center justify-center overflow-hidden">
      <img
        src={validImages[currentIndex]}
        alt="Zoomed"
        className="object-contain w-[100vw] h-[100vh] transition-transform duration-300 ease-in-out"
        style={{
          transformOrigin: "center center",
          transform: showZoom ? "scale(2)" : "scale(1)",
        }}
        onClick={(e) => {
          e.stopPropagation();
          setShowZoom((prev) => !prev); // 👈 Chạm 1 lần để phóng to/thu nhỏ
        }}
      />
    </div>

    {/* Nút chuyển ảnh */}
    {validImages.length > 1 && (
      <>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          className="absolute left-4 text-white text-4xl select-none"
        >
          ‹
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="absolute right-4 text-white text-4xl select-none"
        >
          ›
        </button>
      </>
    )}
  </div>
)}
  </div>
  );
    }
