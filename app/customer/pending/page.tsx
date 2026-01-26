"use client";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { useRouter } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

export default function PendingOrdersPage() {
  const router = useRouter();
  const { t, lang } = useTranslation();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
  try {
    const res = await apiFetch("/api/orders");

    if (!res.ok) {
      throw new Error("unauthorized");
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      setOrders([]);
      return;
    }

    const statusMap: Record<string, string[]> = {
      vi: ["Chờ xác nhận", "Đã thanh toán", "Chờ xác minh"],
      en: ["Pending", "Paid", "Waiting for verification"],
      zh: ["待确认", "已付款", "待核实"],
    };

    const allowed = statusMap[lang] || statusMap.vi;
    setOrders(data.filter(o => allowed.includes(o.status)));
  } catch (err) {
    console.error("❌ Load pending orders error:", err);
    setOrders([]);
  } finally {
    setLoading(false);
  }
};

    fetchOrders();
  }, [lang]);

  if (loading) return <p className="text-center mt-10">{t.loading_orders}</p>;

  return (
    <main className="p-4 max-w-4xl mx-auto bg-gray-50 min-h-screen pb-24">
      <div className="flex items-center mb-4">
        <button onClick={() => router.back()} className="text-orange-500 text-lg mr-2">
          ←
        </button>
        <h1 className="text-2xl font-bold text-yellow-600">
          ⏳ {t.pending_orders}
        </h1>
      </div>

      {!orders.length ? (
        <p className="text-center text-gray-500">{t.no_pending_orders}</p>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white p-4 rounded shadow border">
              <h2 className="font-semibold text-lg">🧾 #{order.id}</h2>
              <p>💰 {t.total}: <b>{order.total}</b> Pi</p>
              <p>📅 {t.created_at}: {new Date(order.createdAt).toLocaleString()}</p>
              <p className="mt-2 text-yellow-600">
                {t.status}: {order.status}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
