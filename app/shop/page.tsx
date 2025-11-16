"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import HorizontalProductSlider from "@/app/components/HorizontalProductSlider";

export default function ShopPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // 🟢 Load danh mục
  useEffect(() => {
    const loadCategories = async () => {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data);
      setLoadingCategories(false);
    };
    loadCategories();
  }, []);

  return (
    <main className="pb-20 bg-white min-h-screen">

      {/* ⭐ BANNER */}
      <img
        src="/banners/Messenger_creation_9F1CAD64-6ACE-4FF9-9EFF-E68A79A745AD.jpeg"
        alt="banner"
        className="w-full h-40 object-cover"
      />

      <div className="mt-3">

        {/* ⭐ DANH MỤC */}
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Danh mục</h2>

        {loadingCategories ? (
          <p className="text-gray-500">Đang tải...</p>
        ) : (
          <div className="flex overflow-x-auto space-x-6 pb-3 scrollbar-hide">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.id}`}
                className="flex flex-col items-center min-w-[70px]"
              >
                <img
                  src={c.icon}
                  className="w-14 h-14 rounded-full object-cover border"
                />
                <span className="text-sm mt-1 text-center">{c.name}</span>
              </Link>
            ))}
          </div>
        )}

        {/* ⭐⭐⭐ 6 THANH NGANG SẢN PHẨM ⭐⭐⭐ */}

        {/* 1️⃣ Giá cao nhất */}
        <HorizontalProductSlider title="💎 Giá cao nhất" type="highest" />

        {/* 2️⃣ Mới nhất */}
        <HorizontalProductSlider title="🆕 Sản phẩm mới nhất" type="newest" />

        {/* 3️⃣ Sale */}
        <HorizontalProductSlider title="⚡ Đang giảm giá" type="sale" />

        {/* 4️⃣ Thời trang */}
        <HorizontalProductSlider title="👕 Thời trang" type="fashion" />

        {/* 5️⃣ Điện thoại */}
        <HorizontalProductSlider title="📱 Điện thoại & Laptop" type="phone" />

        {/* 6️⃣ Thiết bị điện tử */}
        <HorizontalProductSlider title="🔌 Thiết bị điện tử" type="electronic" />

      </div>
    </main>
  );
}
