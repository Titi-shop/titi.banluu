"use client";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { getPiAccessToken } from "@/lib/piAuth";

/* =========================
   TYPES
========================= */
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

/* =========================
   PAGE
========================= */
export default function PendingOrdersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     LOAD ORDERS (PENDING)
  ========================= */
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const token = await getPiAccessToken();

      const res = await fetch("/api/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!res.ok) throw new Error("UNAUTHORIZED");

      const data: unknown = await res.json();
      const list = Array.isArray(data) ? (data as Order[]) : [];

      // ✅ FILTER BẰNG STATUS KỸ THUẬT
      setOrders(list.filter(o => o.status === "pending"));
    } catch (err) {
      console.error("❌ Load pending orders error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     TABS (I18N)
  ========================= */
  const tabs: TabItem[] = [
    {
      label: t.pending_orders,
      count: orders.length,
      href: "/customer/pending",
      active: pathname === "/customer/pending",
    },
    {
      label: t.pickup_orders,
      count: 0,
      href: "/customer/pickup",
      active: false,
    },
    {
      label: t.shipping_orders,
      count: 0,
      href: "/customer/shipping",
      active: false,
    },
    {
      label: t.review_orders,
      count: 0,
      href: "/customer/review",
      active: false,
    },
    {
      label: t.orders_received,
      count: 0,
      href: "/customer/orders",
      active: false,
    },
  ];

  const totalPi = orders.reduce(
    (s, o) => s + Number(o.total || 0),
    0
  );

  /* =========================
     UI
  ========================= */
  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      {/* HEADER */}
      <div className="bg-orange-500 text-white px-4 py-4">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()}>←</button>
          <h1 className="font-semibold text-lg">
            1Pi Mall
          </h1>
        </div>

        <div className="mt-4 bg-orange-400 rounded-lg p-4">
          <p className="text-sm opacity-90">
            {t.order_info}
          </p>
          <p className="text-xs opacity-80 mt-1">
            {t.orders}: {orders.length} · π{totalPi}
          </p>
        </div>
      </div>

      {/* TABS */}
      <div className="bg-white shadow-sm">
        <div className="grid grid-cols-5 text-center text-sm">
          {tabs.map(tab => (
            <button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              className="py-3"
            >
              <p>{tab.label}</p>
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

      {/* CONTENT */}
      <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
        {loading ? (
          <p>{t.loading_orders}</p>
        ) : orders.length === 0 ? (
          <>
            <div className="w-32 h-32 bg-gray-200 rounded-full mb-4 opacity-40" />
            <p>{t.no_pending_orders}</p>
          </>
        ) : (
          <div className="w-full px-4 space-y-3">
            {orders.map(o => (
              <div
                key={o.id}
                className="bg-white rounded-lg p-4 shadow"
              >
                <div className="flex justify-between">
                  <span className="font-semibold">
                    #{o.id}
                  </span>
                  <span className="text-orange-500 text-sm">
                    {t[`status_${o.status}`] || o.status}
                  </span>
                </div>
                <p className="mt-2 text-sm">
                  {t.total}: π{o.total}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
