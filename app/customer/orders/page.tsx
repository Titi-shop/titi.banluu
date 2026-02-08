"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { getPiAccessToken } from "@/lib/piAuth";

/* =========================
   TYPES
========================= */
interface Order {
  id: number;
  total: number;
  createdAt: string;
  status: string;
}

type OrderTab =
  | "all"
  | "pending"
  | "pickup"
  | "shipping"
  | "received"
  | "completed"
  | "returned"
  | "cancelled";

/* =========================
   PAGE
========================= */
export default function CustomerOrdersPage() {
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderTab>("all");

  /* =========================
     LOAD ORDERS (1 LẦN)
  ========================= */
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const token = await getPiAccessToken();
      const res = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!res.ok) throw new Error("UNAUTHORIZED");

      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("❌ Load orders error:", e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     FILTER THEO TAB
  ========================= */
  const filteredOrders = useMemo(() => {
    if (activeTab === "all") return orders;

    return orders.filter((o) => o.status === activeTab);
  }, [orders, activeTab]);

  /* =========================
     UI
  ========================= */
  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      {/* ===== HEADER ===== */}
      <header className="bg-orange-500 text-white px-4 py-4">
        <div className="bg-orange-400 rounded-lg p-4">
          <p className="text-sm opacity-90">{t.order_info}</p>
          <p className="text-xs opacity-80 mt-1">
            {t.orders}: {filteredOrders.length}
          </p>
        </div>
      </header>

      {/* ===== STATUS TABS (GIỐNG SHOPEE) ===== */}
      <div className="bg-white border-b">
        <div className="flex gap-6 px-4 py-3 text-sm overflow-x-auto whitespace-nowrap">
          {[
            ["all", "Tất cả"],
            ["pending", "Chờ xác nhận"],
            ["pickup", "Chờ lấy hàng"],
            ["shipping", "Chờ giao hàng"],
            ["received", "Đã giao"],
            ["returned", "Trả hàng"],
            ["cancelled", "Huỷ"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as OrderTab)}
              className={`pb-2 border-b-2 transition ${
                activeTab === key
                  ? "border-orange-500 text-orange-500 font-semibold"
                  : "border-transparent text-gray-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <section className="px-4 mt-4">
        {loading ? (
          <p className="text-center text-gray-500">
            ⏳ {t.loading_orders}
          </p>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center text-gray-400 mt-16">
            <div className="w-28 h-28 bg-gray-200 rounded-full mb-4 opacity-40" />
            <p>{t.no_orders}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((o) => (
              <div
                key={o.id}
                className="bg-white rounded-lg p-4 shadow"
              >
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">#{o.id}</span>
                  <span className="text-orange-500">
                    {t[`status_${o.status}`] ?? o.status}
                  </span>
                </div>

                <p className="mt-2 text-sm">
                  {t.total}: π{o.total}
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  {new Date(o.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
