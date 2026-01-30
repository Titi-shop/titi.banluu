"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

interface Order {
  id: number;
  total: number;
  status: string;
}

interface TabItem {
  label: string;
  count: number;
  href: string;
  active: boolean;
}

export default function CustomerShippingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { t, lang } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     LOAD ORDERS (ĐANG GIAO)
  ========================= */
  useEffect(() => {
    loadOrders();
  }, [lang]);

  const loadOrders = async () => {
    try {
      const res = await apiFetch("/api/orders");
      if (!res.ok) throw new Error("unauthorized");

      const data: Order[] = await res.json();

      const shippingStatusByLang: Record<string, string[]> = {
        vi: ["Đang giao", "Đang vận chuyển"],
        en: ["Shipping", "Delivering"],
        zh: ["配送中"],
      };

      const allowStatus =
        shippingStatusByLang[lang] || shippingStatusByLang.en;

      setOrders(data.filter((o) => allowStatus.includes(o.status)));
    } catch (err) {
      console.error(err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     TABS CONFIG
  ========================= */
  const tabs: TabItem[] = [
    {
      label: t.wait_confirm || "Chờ xác nhận",
      count: 0,
      href: "/customer/orders/pending",
      active: false,
    },
    {
      label: t.wait_pickup || "Chờ lấy hàng",
      count: 0,
      href: "/customer/orders/pickup",
      active: false,
    },
    {
      label: t.shipping || "Đang giao",
      count: orders.length,
      href: "/customer/shipping",
      active: pathname === "/customer/shipping",
    },
    {
      label: t.rating || "Đánh giá",
      count: 0,
      href: "/customer/orders/rating",
      active: false,
    },
    {
      label: t.received || "Đơn hàng nhận",
      count: 0,
      href: "/customer/orders/completed",
      active: false,
    },
  ];

  const totalPi = orders.reduce((s, o) => s + Number(o.total || 0), 0);

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
          <h1 className="font-semibold text-lg">1pi Mall — 派商城</h1>
        </div>

        {/* ===== ORDER INFO ===== */}
        <div className="mt-4 bg-orange-400 rounded-lg p-4">
          <p className="text-sm opacity-90">
            {t.order_info || "Thông tin đặt hàng"}
          </p>
          <p className="text-xs opacity-80 mt-1">
            {t.orders || "Đặt hàng"}: {orders.length} · π{totalPi.toFixed(0)}
          </p>
        </div>
      </div>

      {/* ===== STATUS TABS ===== */}
      <div className="bg-white shadow-sm">
        <div className="grid grid-cols-5 text-center text-sm">
          {tabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => router.push(tab.href)}
              className="py-3"
            >
              <p className="text-gray-700 leading-tight">{tab.label}</p>
              <p
                className={`mt-1 ${
                  tab.active
                    ? "text-orange-500 font-semibold"
                    : "text-gray-500"
                }`}
              >
                {tab.count}
              </p>
              {tab.active && (
                <div className="h-0.5 bg-orange-500 w-6 mx-auto mt-1 rounded" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
        {loading ? (
          <p>⏳ {t.loading_orders || "Đang tải đơn hàng..."}</p>
        ) : orders.length === 0 ? (
          <>
            <div className="w-32 h-32 bg-gray-200 rounded-full mb-4 opacity-40" />
            <p>{t.no_orders || "Chưa có đơn hàng"}</p>
          </>
        ) : (
          <div className="w-full px-4 space-y-3">
            {orders.map((o) => (
              <div
                key={o.id}
                className="bg-white rounded-lg p-4 shadow"
              >
                <div className="flex justify-between">
                  <span className="font-semibold">#{o.id}</span>
                  <span className="text-orange-500 text-sm">
                    {o.status}
                  </span>
                </div>
                <p className="mt-2 text-sm">
                  💰 {t.total || "Tổng"}: π{o.total}
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
