"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
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

/* =========================
   PAGE
========================= */
export default function CustomerPickupPage() {
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  /* =========================
     LOAD ORDERS (PICKUP)
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

      // ✅ chỉ lấy đơn pickup
      setOrders(list.filter((o) => o.status === "pickup"));
    } catch (err) {
      console.error("❌ Load pickup orders error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     SUMMARY
  ========================= */
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

      {/* ===== CONTENT ===== */}
      <section className="mt-6 px-4">
        {loading ? (
          <p className="text-center text-gray-400">
            ⏳ {t.loading_orders}
          </p>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
            <div className="w-32 h-32 bg-gray-200 rounded-full mb-4 opacity-40" />
            <p>{t.no_pickup_orders}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div
                key={o.id}
                className="bg-white rounded-lg p-4 shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold">
                    #{o.id}
                  </span>
                  <span className="text-orange-500 text-sm font-medium">
                    {t.status_pickup}
                  </span>
                </div>

                <p className="mt-2 text-sm text-gray-700">
                  {t.total}: π{o.total}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
