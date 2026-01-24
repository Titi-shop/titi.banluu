"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";

/* =========================
   TYPES
========================= */
interface Order {
  orderId: string;
  total: number;
  status: string;
}

/* =========================
   PAGE
========================= */
export default function OrdersTabs() {
  const router = useRouter();
  const { t } = useTranslation();
  const { piToken, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  /* =========================
     LOAD ORDERS (AUTH-CENTRIC)
  ========================= */
  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/seller/orders", {
        cache: "no-store",
        credentials: "include", // fallback cookie
        headers: piToken
          ? {
              Authorization: `Bearer ${piToken}`, // ⭐ BẮT BUỘC
            }
          : undefined,
      });

      if (!res.ok) {
        throw new Error("forbidden");
      }

      const data = await res.json();
      setOrders(data || []);
    } catch {
      alert(t.error_load_orders || "❌ Không thể tải dữ liệu đơn hàng!");
    } finally {
      setLoadingOrders(false);
    }
  };

  /* =========================
     EFFECT
  ========================= */
  useEffect(() => {
    // ⛔ chờ AuthContext load xong
    if (authLoading) return;

    fetchOrders();
  }, [authLoading]);

  /* =========================
     STATS
  ========================= */
  const calcStats = (status?: string) => {
    const filtered = status
      ? orders.filter((o) => o.status === status)
      : orders;

    const totalPi = filtered.reduce(
      (sum, o) => sum + (Number(o.total) || 0),
      0
    );

    return {
      count: filtered.length,
      totalPi: totalPi.toFixed(2),
    };
  };

  /* =========================
     LOADING
  ========================= */
  if (loadingOrders || authLoading) {
    return (
      <p className="text-center mt-10 text-gray-500">
        ⏳ {t.loading}
      </p>
    );
  }

  /* =========================
     UI
  ========================= */
  return (
    <main className="max-w-md mx-auto p-4 pb-24 bg-gray-50 min-h-screen">
      {/* ===== HEADER ===== */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => router.back()}
          className="text-orange-500 font-semibold text-lg mr-2"
        >
          ←
        </button>
        <h1 className="text-xl font-semibold text-gray-800">
          {t.orders_list || "📋 Danh sách đơn hàng"}
        </h1>
      </div>

      {/* ===== BUTTONS ===== */}
      <div className="flex flex-col gap-3 mt-4">
        <OrderButton
          label={t.all_orders || "📦 Tất cả"}
          onClick={() => router.push("/seller/orders/summary")}
          stats={calcStats()}
        />

        <OrderButton
          label={t.pending_orders || "⏳ Chờ xác nhận"}
          onClick={() => router.push("/seller/orders/pending")}
          stats={calcStats("Chờ xác nhận")}
        />

        <OrderButton
          label={t.shipping_orders || "🚚 Đang giao"}
          onClick={() => router.push("/seller/orders/shipping")}
          stats={calcStats("Đang giao")}
        />

        <OrderButton
          label={t.completed_orders || "✅ Hoàn tất"}
          onClick={() => router.push("/seller/orders/completed")}
          stats={calcStats("Hoàn tất")}
        />

        <OrderButton
          label={t.cancelled_orders || "❌ Đã hủy"}
          onClick={() => router.push("/seller/orders/cancelled")}
          stats={calcStats("Đã hủy")}
        />

        <OrderButton
          label={t.returned_orders || "↩️ Hoàn lại"}
          onClick={() => router.push("/seller/orders/returned")}
          stats={calcStats("Hoàn lại")}
        />
      </div>

      <div className="h-20" />
    </main>
  );
}

/* =========================
   COMPONENT
========================= */
function OrderButton({
  label,
  onClick,
  stats,
}: {
  label: string;
  onClick: () => void;
  stats: { count: number; totalPi: string };
}) {
  return (
    <button
      onClick={onClick}
      className="btn-gray flex justify-between items-center"
    >
      <span>{label}</span>
      <span className="text-sm text-gray-200">
        {stats.count} đơn · {stats.totalPi} Pi
      </span>
    </button>
  );
}
