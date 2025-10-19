"use client";

import Link from "next/link";
import { useLanguage } from "../context/LanguageContext";
import {
  PackagePlus,   // icon Đăng sản phẩm
  Package,       // icon Kho hàng
  ClipboardList, // icon Xử lý đơn
  RefreshCcw,    // icon Cập nhật trạng thái
  Truck,         // icon Giao hàng
} from "lucide-react";

export default function SellerDashboard() {
  return (
    <main className="p-6 max-w-6xl mx-auto">
      {/* ===== Thanh tiêu đề ===== */}
      <div className="bg-yellow-400 text-white text-xl font-bold p-3 rounded-t-lg mb-6 flex justify-center items-center shadow">
        <span>👑 Khu vực Quản lý Người Bán - TiTi Shop</span>
      </div>

      {/* ===== Các mục quản lý ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5 text-center">
        {/* Đăng sản phẩm */}
        <Link
          href="/seller/post"
          className="bg-amber-500 hover:bg-amber-600 text-white p-6 rounded-lg shadow flex flex-col items-center transition transform hover:scale-105"
        >
          <PackagePlus size={36} />
          <span className="mt-2 font-semibold">📦 Đăng sản phẩm</span>
        </Link>

        {/* Quản lý kho hàng */}
        <Link
          href="/seller/stock"
          className="bg-blue-500 hover:bg-blue-600 text-white p-6 rounded-lg shadow flex flex-col items-center transition transform hover:scale-105"
        >
          <Package size={36} />
          <span className="mt-2 font-semibold">🏬 Quản lý kho hàng</span>
        </Link>

        {/* Xử lý đơn hàng */}
        <Link
          href="/seller/orders"
          className="bg-green-500 hover:bg-green-600 text-white p-6 rounded-lg shadow flex flex-col items-center transition transform hover:scale-105"
        >
          <ClipboardList size={36} />
          <span className="mt-2 font-semibold">🧾 Xử lý đơn hàng</span>
        </Link>

        {/* Cập nhật trạng thái */}
        <Link
          href="/seller/status"
          className="bg-purple-500 hover:bg-purple-600 text-white p-6 rounded-lg shadow flex flex-col items-center transition transform hover:scale-105"
        >
          <RefreshCcw size={36} />
          <span className="mt-2 font-semibold">📊 Cập nhật trạng thái</span>
        </Link>

        {/* Giao hàng */}
        <Link
          href="/seller/delivery"
          className="bg-orange-500 hover:bg-orange-600 text-white p-6 rounded-lg shadow flex flex-col items-center transition transform hover:scale-105"
        >
          <Truck size={36} />
          <span className="mt-2 font-semibold">🚚 Giao hàng</span>
        </Link>
      </div>

      {/* ===== Thông tin phụ ===== */}
      <p className="text-center text-gray-500 mt-10">
        🔸 Chào mừng bạn đến khu vực quản lý của Người Bán TiTi Shop 🔸
      </p>
    </main>
  );
}
