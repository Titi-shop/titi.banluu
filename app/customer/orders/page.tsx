"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

interface OrderItem {
  orderId: string;
  total: number;
  createdAt: string;
  status: string;
}

export default function OrdersSummaryPage() {
  const { t } = useTranslation();

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
  try {
    const res = await apiFetch("/api/seller/orders");

    if (!res.ok) {
      throw new Error("unauthorized");
    }

    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("❌ Load orders error:", err);
  } finally {
    setLoading(false);
  }
};
  if (loading)
    return (
      <p className="text-center mt-10 text-gray-500">
        ⏳ {t.loading}...
      </p>
    );

  const totalOrders = orders.length;
  const totalPi = orders.reduce(
    (sum, o) => sum + (parseFloat(String(o.total)) || 0),
    0
  );

  return (
    <main className="max-w-4xl mx-auto p-4 pb-24 bg-gray-50 min-h-screen">
      {/* ===== Tiêu đề ===== */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => history.back()}
          className="text-orange-500 font-semibold text-lg mr-2"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          📦 {t.order_summary}
        </h1>
      </div>

      {/* ===== Tổng hợp ===== */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4 text-center shadow">
          <p className="text-gray-500 text-sm">{t.total_orders}</p>
          <p className="text-2xl font-bold">{totalOrders}</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center shadow">
          <p className="text-gray-500 text-sm">{t.total_pi}</p>
          <p className="text-2xl font-bold">
            {totalPi.toFixed(2)} Pi
          </p>
        </div>
      </div>

      {/* ===== Danh sách ===== */}
      {orders.length === 0 ? (
        <p className="text-center text-gray-500">{t.no_orders}</p>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div
              key={o.orderId}
              className="bg-white border rounded-lg p-4 shadow-sm"
            >
              <p>🧾 <b>{t.order_code}:</b> #{o.orderId}</p>
              <p>💰 <b>{t.total}:</b> {o.total.toFixed(2)} Pi</p>
              <p>📅 <b>{t.created_at}:</b> {o.createdAt}</p>
              <p>📊 <b>{t.status}:</b> {o.status}</p>
            </div>
          ))}
        </div>
      )}

      <div className="h-20"></div>
    </main>
  );
}
