"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

interface OrderItem {
  orderId: string;
  total: number;
  createdAt: string;
  status: string;
}

export default function OrdersSummaryPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     LOAD SELLER ORDERS
  ========================= */
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const res = await apiFetch("/api/seller/orders");
      if (!res.ok) throw new Error("unauthorized");

      const data: OrderItem[] = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Load orders error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const totalOrders = orders.length;
  const totalPi = orders.reduce(
    (sum, o) => sum + Number(o.total || 0),
    0
  );

  /* =========================
     UI
  ========================= */
  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      {/* ===== HEADER ===== */}
      <div className="bg-orange-500 text-white px-4 py-4">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="text-xl">
            ←
          </button>
          <h1 className="font-semibold text-lg">
            📦 {t.order_summary || "Tổng quan đơn hàng"}
          </h1>
        </div>

        <div className="mt-4 bg-orange-400 rounded-lg p-4">
          <p className="text-sm opacity-90">
            {t.order_info || "Thông tin đơn hàng"}
          </p>
          <p className="text-xs opacity-80 mt-1">
            {t.total_orders || "Tổng đơn"}: {totalOrders} · π
            {totalPi.toFixed(0)}
          </p>
        </div>
      </div>

      {/* ===== SUMMARY CARDS ===== */}
      <div className="grid grid-cols-2 gap-4 px-4 mt-4">
        <div className="bg-white rounded-lg p-4 text-center shadow">
          <p className="text-gray-500 text-sm">
            {t.total_orders || "Tổng đơn"}
          </p>
          <p className="text-2xl font-bold">{totalOrders}</p>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow">
          <p className="text-gray-500 text-sm">
            {t.total_pi || "Tổng Pi"}
          </p>
          <p className="text-2xl font-bold">
            π{totalPi.toFixed(2)}
          </p>
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="mt-10 px-4">
        {loading ? (
          <p className="text-center text-gray-500">
            ⏳ {t.loading || "Đang tải"}...
          </p>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center text-gray-400 mt-16">
            <div className="w-32 h-32 bg-gray-200 rounded-full mb-4 opacity-40" />
            <p>{t.no_orders || "Chưa có đơn hàng"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div
                key={o.orderId}
                className="bg-white rounded-lg p-4 shadow"
              >
                <div className="flex justify-between">
                  <span className="font-semibold">
                    #{o.orderId}
                  </span>
                  <span className="text-orange-500 text-sm">
                    {o.status}
                  </span>
                </div>

                <p className="mt-2 text-sm">
                  💰 {t.total || "Tổng"}: π{o.total.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  📅 {new Date(o.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== FLOAT BUTTON ===== */}
      <button className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-orange-500 shadow-lg" />
    </main>
  );
}
