"use client";

import Link from "next/link";
import { useLanguage } from "../context/LanguageContext";
import {
  PackagePlus,
  Package,
  ClipboardList,
  RefreshCcw,
  Truck,
} from "lucide-react";

export default function SellerDashboard() {
  const { translate } = useLanguage();

  return (
    <main className="p-6 max-w-6xl mx-auto">
      {/* ===== Tiêu đề ===== */}
      <div className="bg-yellow-400 text-white text-xl font-bold p-3 rounded-t-lg mb-6 flex justify-center items-center shadow">
        <span>👑 {translate("seller_dashboard")}</span>
      </div>

      {/* ===== Các mục quản lý ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5 text-center">
        <Link
          href="/seller/post"
          className="bg-amber-500 hover:bg-amber-600 text-white p-6 rounded-lg shadow flex flex-col items-center transition transform hover:scale-105"
        >
          <PackagePlus size={36} />
          <span className="mt-2 font-semibold">📦 {translate("post_product")}</span>
        </Link>

        <Link
          href="/seller/stock"
          className="bg-blue-500 hover:bg-blue-600 text-white p-6 rounded-lg shadow flex flex-col items-center transition transform hover:scale-105"
        >
          <Package size={36} />
          <span className="mt-2 font-semibold">🏬 {translate("manage_stock")}</span>
        </Link>

        <Link
          href="/seller/orders"
          className="bg-green-500 hover:bg-green-600 text-white p-6 rounded-lg shadow flex flex-col items-center transition transform hover:scale-105"
        >
          <ClipboardList size={36} />
          <span className="mt-2 font-semibold">🧾 {translate("process_orders")}</span>
        </Link>

        <Link
          href="/seller/status"
          className="bg-purple-500 hover:bg-purple-600 text-white p-6 rounded-lg shadow flex flex-col items-center transition transform hover:scale-105"
        >
          <RefreshCcw size={36} />
          <span className="mt-2 font-semibold">📊 {translate("update_status")}</span>
        </Link>

        <Link
          href="/seller/delivery"
          className="bg-orange-500 hover:bg-orange-600 text-white p-6 rounded-lg shadow flex flex-col items-center transition transform hover:scale-105"
        >
          <Truck size={36} />
          <span className="mt-2 font-semibold">🚚 {translate("delivery")}</span>
        </Link>
      </div>
    </main>
  );
}
