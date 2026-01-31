"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";

/* =========================
   TYPES (NO any)
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
export default function OrdersSummaryPage() {
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
      const res = await apiAuthFetch("/api/seller/orders", {
        cache: "no-store",
      });

      if (!res.ok) {
        const raw: unknown = await res.json().catch(() => null);
        throw new Error(
          typeof raw === "object" && raw && "error" in raw
            ? String((raw as { error?: unknown }).error)
            : "FAILED_TO_LOAD_ORDERS"
        );
      }

      const data: unknown = await res.json();
      const list = Array.isArray(data) ? (data as Order[]) : [];

      const sorted = list.sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );

      setOrders(sorted);
    } catch (err) {
      console.error("❌ Load orders summary failed:", err);
      alert(
        t.error_load_orders ||
          "❌ Không thể tải danh sách đơn hàng"
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
        ⏳ {t.loading_data || "Đang tải dữ liệu..."}
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
          {t.orders_summary || "📦 Tổng đơn hàng"}
        </h1>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-3 mb-6">
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
          {t.no_orders || "Chưa có đơn hàng"}
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              onClick={() =>
                router.push(`/seller/orders/${order.id}`)
              }
              className="cursor-pointer bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
            >
              <p>
                🧾 <b>{t.order_id || "Mã đơn"}:</b> #{order.id}
              </p>

              <p>
                💰 <b>{t.total || "Tổng"}:</b>{" "}
                {Number(order.total || 0).toFixed(2)} Pi
              </p>

              <p>
                📅 <b>{t.created_at || "Ngày tạo"}:</b>{" "}
                {new Date(order.created_at).toLocaleString()}
              </p>

              <p>
                📊 <b>{t.status || "Trạng thái"}:</b>{" "}
                <span className="font-semibold text-orange-500">
                  {order.status}
                </span>
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="h-20" />
    </main>
  );
}
