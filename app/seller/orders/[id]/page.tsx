"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";
import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

/* =========================
   TYPES (NO any)
========================= */
interface Order {
  id: string;
  status: string;
  total: number | null;
  created_at: string;
  buyer: {
    username: string;
    email?: string;
    phone?: string;
    address?: string;
    country?: string;
    province?: string;
  };
}

/* =========================
   PAGE
========================= */
export default function SellerOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const { loading: authLoading } = useAuth();
  const { id } = params;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  /* =========================
     LOAD ORDER (AUTH–CENTRIC)
  ========================= */
  const loadOrder = async () => {
    try {
      const res = await apiAuthFetch(
        `/api/seller/orders/${id}`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        throw new Error("NOT_FOUND");
      }

      const data: unknown = await res.json();
      setOrder(data as Order);
    } catch (err) {
      console.error("❌ Load order failed:", err);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     EFFECT
  ========================= */
  useEffect(() => {
    if (authLoading) return;
    loadOrder();
  }, [authLoading]);

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
     NOT FOUND
  ========================= */
  if (!order) {
    return (
      <p className="text-center mt-10 text-red-500">
        ❌ {t.order_not_found || "Không tìm thấy đơn hàng"}
      </p>
    );
  }

  /* =========================
     UI
  ========================= */
  return (
    <main className="min-h-screen p-5 max-w-2xl mx-auto bg-white">
      {/* BACK */}
      <button
        onClick={() => router.back()}
        className="text-orange-500 text-lg mb-4"
      >
        ← {t.back}
      </button>

      {/* TITLE */}
      <h1 className="text-2xl font-bold text-gray-800 mb-3">
        🧾 {t.order_details || "Chi tiết đơn"} #{order.id}
      </h1>

      {/* ORDER INFO */}
      <div className="border p-4 rounded-lg shadow-sm space-y-2">
        <p>
          <b>👤 {t.buyer || "Người mua"}:</b>{" "}
          {order.buyer.username}
        </p>

        {order.buyer.email && (
          <p>
            <b>📧 {t.email}:</b> {order.buyer.email}
          </p>
        )}

        {order.buyer.phone && (
          <p>
            <b>📞 {t.phone_number}:</b>{" "}
            {order.buyer.phone}
          </p>
        )}

        {order.buyer.address && (
          <p>
            <b>🏠 {t.address}:</b>{" "}
            {order.buyer.address}
          </p>
        )}

        {order.buyer.country && (
          <p>
            <b>🌍 {t.country}:</b>{" "}
            {order.buyer.country}
          </p>
        )}

        {order.buyer.province && (
          <p>
            <b>🏙 {t.province}:</b>{" "}
            {order.buyer.province}
          </p>
        )}

        <hr className="my-3" />

        <p>
          <b>💰 {t.total_pi || "Tổng"}:</b>{" "}
          {Number(order.total || 0).toFixed(2)} Pi
        </p>

        <p>
          <b>📦 {t.status || "Trạng thái"}:</b>{" "}
          {order.status}
        </p>

        <p className="text-sm text-gray-500">
          📅 {new Date(order.created_at).toLocaleString()}
        </p>
      </div>

      {/* ACTIONS */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={() =>
            navigator.clipboard.writeText(
              JSON.stringify(order, null, 2)
            )
          }
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          ⬇ {t.download || "Tải JSON"}
        </button>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          🖨 {t.print || "In"}
        </button>
      </div>
    </main>
  );
}
