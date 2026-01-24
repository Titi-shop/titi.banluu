"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

interface Order {
  orderId: string;
  total: number;
  status: string;
  createdAt: string;
}

export default function OrdersSummaryPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/seller/orders", {
        cache: "no-store",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Unauthorized");
      }

      const data = await res.json();

      const sorted = (data || []).sort(
        (a: Order, b: Order) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );

      setOrders(sorted);
    } catch {
      alert(t.error_load_orders || "❌ Không thể tải danh sách đơn hàng!");
    } finally {
      setLoading(false);
    }
  };

  const totalPi = orders.reduce(
    (sum, o) => sum + (Number(o.total) || 0),
    0
  );

  if (loading) {
    return (
      <p className="text-center mt-10 text-gray-500">
        ⏳ {t.loading_data || "Đang tải dữ liệu..."}
      </p>
    );
  }

  return (
    <main className="min-h-screen max-w-4xl mx-auto p-4 pb-24 bg-gray-50">
      {/* 🔙 Nút quay lại */}
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

      {/* 📊 Thống kê */}
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

      {/* 🧾 Danh sách đơn */}
      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.orderId}
            onClick={() => router.push(`/seller/orders/${order.orderId}`)}
            className="card cursor-pointer bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
          >
            <p>
              🧾 <b>{t.order_id || "Mã đơn"}:</b> #{order.orderId}
            </p>
            <p>
              💰 <b>{t.total || "Tổng"}:</b>{" "}
              {Number(order.total).toFixed(2)} Pi
            </p>
            <p>
              📅 <b>{t.created_at || "Ngày tạo"}:</b>{" "}
              {order.createdAt || "—"}
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

      <div className="h-20"></div>
    </main>
  );
}
