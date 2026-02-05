"use client";
export const dynamic = "force-dynamic";

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
  createdAt: string;
  status: string;
}

interface TabItem {
  key: string;
  label: string;
  href: string;
  count?: number;
}

/* =========================
   PAGE
========================= */
export default function CustomerOrdersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     LOAD COMPLETED ORDERS
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

      // ✅ CHỈ ĐƠN ĐÃ NHẬN / HOÀN TẤT
      setOrders(
        list.filter(
          (o) =>
            o.status === "completed" ||
            o.status === "received"
        )
      );
    } catch (err) {
      console.error("❌ Load completed orders error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     TABS
  ========================= */
  const tabs: TabItem[] = [
    {
      key: "pending",
      label: t.order_pending,
      href: "/customer/pending",
    },
    {
      key: "pickup",
      label: t.order_pickup,
      href: "/customer/pickup",
    },
    {
      key: "shipping",
      label: t.order_shipping,
      href: "/customer/shipping",
    },
    {
      key: "review",
      label: t.order_review,
      href: "/customer/review",
    },
    {
      key: "received",
      label: t.order_received,
      href: "/customer/orders",
      count: orders.length,
    },
  ];

  const totalPi = orders.reduce(
    (sum, o) => sum + Number(o.total || 0),
    0
  );

  /* =========================
     UI
  ========================= */
  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      {/* ===== HEADER ===== */}
      <header className="bg-orange-500 text-white px-4 py-4">
  <div className="bg-orange-400 rounded-lg p-4">
    <p className="text-sm opacity-90">
      {t.order_info}
    </p>
    <p className="text-xs opacity-80 mt-1">
      {t.orders}: {orders.length} · π{totalPi}
    </p>
  </div>
</header>

      {/* ===== TABS ===== */}
      <nav className="bg-white shadow-sm">
        <div className="grid grid-cols-5 text-center text-xs">
          {tabs.map((tab) => {
            const active = pathname === tab.href;

            return (
              <button
                key={tab.key}
                onClick={() => router.push(tab.href)}
                className="flex flex-col items-center justify-center py-3"
              >
                <div className="h-8 flex items-center justify-center px-1">
                  <span className="leading-tight text-gray-700">
                    {tab.label}
                  </span>
                </div>

                <div
                  className={`h-5 flex items-center justify-center mt-1 ${
                    active
                      ? "text-orange-500 font-semibold"
                      : "text-gray-400"
                  }`}
                >
                  {tab.count ?? 0}
                </div>

                {active && (
                  <div className="h-0.5 w-6 bg-orange-500 mt-1 rounded" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ===== CONTENT ===== */}
      <section className="mt-10 px-4">
        {loading ? (
          <p className="text-center text-gray-500">
            ⏳ {t.loading_orders}
          </p>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center text-gray-400 mt-16">
            <div className="w-32 h-32 bg-gray-200 rounded-full mb-4 opacity-40" />
            <p>{t.no_completed_orders}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div
                key={o.id}
                className="bg-white rounded-lg p-4 shadow"
              >
                <div className="flex justify-between">
                  <span className="font-semibold">
                    #{o.id}
                  </span>
                  <span className="text-green-600 text-sm">
                    {t.status_completed}
                  </span>
                </div>

                <p className="mt-2 text-sm">
                  {t.total}: π{o.total}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  📅{" "}
                  {new Date(o.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FLOAT BUTTON */}
      <button className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-orange-500 shadow-lg" />
    </main>
  );
}
