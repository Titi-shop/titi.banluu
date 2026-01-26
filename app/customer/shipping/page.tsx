"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { useRouter } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  total: number;
  status: string;
  createdAt: string;
  items?: OrderItem[];
}

export default function CustomerShippingPage() {
  const router = useRouter();
  const { t, lang } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     LOAD ORDERS (COOKIE AUTH)
  ========================= */
  useEffect(() => {
    fetchOrders();
  }, [lang]);

  const fetchOrders = async () => {
    try {
      const res = await apiFetch("/api/orders");

      if (!res.ok) throw new Error("unauthorized");

      const data: Order[] = await res.json();

      const statusByLang: Record<string, string[]> = {
        vi: ["Đang giao", "Đang vận chuyển"],
        en: ["Delivering", "Shipping"],
        zh: ["配送中", "运输中"],
        ja: ["配送中"],
        ko: ["배송 중"],
        fr: ["En livraison"],
      };

      const allowStatus = statusByLang[lang] || statusByLang.en;

      setOrders(data.filter((o) => allowStatus.includes(o.status)));
    } catch (err) {
      console.error("❌ Load shipping orders error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     CONFIRM RECEIVED
  ========================= */
  const confirmReceived = async (id: number) => {
    if (!confirm(t.confirm_received_message || "Xác nhận đã nhận hàng?")) return;

    try {
      const res = await apiFetch("/api/orders", {
   method: "PUT",
   body: JSON.stringify({
    id,
    status: t.status_completed || "Hoàn tất",
    }),
  });

      if (!res.ok) throw new Error("update_failed");

      alert(t.thanks_receive || "Cảm ơn bạn đã xác nhận!");
      fetchOrders();
    } catch {
      alert(t.error_confirm || "Không thể xác nhận đơn hàng");
    }
  };

  /* =========================
     UI
  ========================= */
  if (loading)
    return (
      <p className="text-center mt-6 text-gray-500">
        ⏳ {t.loading_orders || "Đang tải đơn hàng..."}
      </p>
    );

  const totalOrders = orders.length;
  const totalPi = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  return (
    <main className="p-4 max-w-4xl mx-auto bg-gray-50 min-h-screen pb-24">
      {/* ===== Header ===== */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => router.back()}
          className="text-orange-500 font-semibold text-lg mr-2"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          🚚 {t.shipping_orders || "Đơn hàng đang giao"}
        </h1>
      </div>

      {/* ===== Summary ===== */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4 text-center shadow">
          <p className="text-gray-500 text-sm">{t.total_orders}</p>
          <p className="text-2xl font-bold">{totalOrders}</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center shadow">
          <p className="text-gray-500 text-sm">{t.total_pi}</p>
          <p className="text-2xl font-bold">{totalPi.toFixed(2)} Pi</p>
        </div>
      </div>

      {/* ===== Orders ===== */}
      {orders.length === 0 ? (
        <p className="text-center text-gray-500">
          {t.no_shipping_orders || "Không có đơn đang giao."}
        </p>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border rounded-lg p-4 shadow-sm"
            >
              <div className="flex justify-between mb-2">
                <h2 className="font-semibold text-lg">🧾 #{order.id}</h2>
                <span className="px-3 py-1 rounded bg-blue-100 text-blue-700 text-sm">
                  {order.status}
                </span>
              </div>

              <p>💰 <b>{t.total}:</b> {order.total} Pi</p>
              <p>📅 <b>{t.created_at}:</b> {new Date(order.createdAt).toLocaleString()}</p>

              <button
                onClick={() => confirmReceived(order.id)}
                className="mt-3 w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded"
              >
                {t.confirm_received || "Đã nhận hàng"}
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
