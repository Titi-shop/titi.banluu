"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";
import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

/* =========================
   TYPES
========================= */
interface Order {
  id: string;
  total: number | null;
  status: string;
  created_at: string;
}

/* =========================
   PAGE
========================= */
export default function CancelledOrdersPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { loading: authLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     LOAD ORDERS (NETWORK–FIRST)
  ========================= */
  const fetchOrders = async () => {
    try {
      const res = await apiFetch(
        "/api/seller/orders?status=Đã hủy"
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || "FAILED_TO_LOAD_ORDERS");
      }

      const data: Order[] = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
      alert(
        t.error_load_orders ||
          "❌ Không thể tải đơn hàng đã hủy"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     EFFECT
  ========================= */
  useEffect(() => {
    if (authLoading) return;
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  /* =========================
     STATS
  ========================= */
  const totalPi = orders.reduce(
    (sum, o) => sum + (Number(o.total) || 0),
    0
  );

  /* =========================
     LOADING
  ========================= */
  if (loading || authLoading) {
    return (
      <p className="text-center mt-10 text-gray-500">
        ⏳ {t.loading || "Đang tải..."}
      </p>
    );
  }

  /* =========================
     UI
  ========================= */
  return (
    <main className="min-h-screen max-w-4xl mx-auto p-4 pb-24 bg-gray-50">
      {/* HEADER */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => router.back()}
          className="text-orange-500 font-semibold text-lg mr-2"
        >
          ←
        </button>
        <h1 className="text-xl font-semibold text-gray-800">
          ❌ {t.cancelled_orders || "Đơn hàng đã hủy"}
        </h1>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card text-center">
          <p className="text-gray-500 text-sm">
            {t.total_orders || "Tổng đơn"}
          </p>
          <p className="text-xl font-bold">{orders.length}</p>
        </div>

        <div className="card text-center">
          <p className="text-gray-500 text-sm">
            {t.total_pi || "Tổng Pi"}
          </p>
          <p className="text-xl font-bold">
            {totalPi.toFixed(2)} Pi
          </p>
        </div>
      </div>

      {/* ORDERS LIST */}
      {orders.length === 0 ? (
        <p className="text-center text-gray-500">
          {t.no_cancelled_orders ||
            "Không có đơn hàng đã hủy."}
        </p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition"
            >
              <p>
                🧾 <b>{t.order_id || "Mã đơn"}:</b> #
                {order.id}
              </p>

              <p>
                💰 <b>{t.total || "Tổng"}:</b>{" "}
                {Number(order.total || 0).toFixed(2)} Pi
              </p>

              <p className="text-sm text-gray-500">
                📅{" "}
                {new Date(order.created_at).toLocaleString()}
              </p>

              <p className="font-semibold text-red-600">
                ❌ {t.cancelled_orders || "Đã hủy"}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="h-20" />
    </main>
  );
}
