"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { getPiAccessToken } from "@/lib/piAuth";
import { formatPi } from "@/lib/pi";

/* =========================
TYPES (MATCH API)
========================= */

interface OrderItem {
  product_name: string;
  thumbnail: string;
  images?: string[];

  unit_price: number;
  quantity: number;
  total_price: number;

  seller_message?: string | null;
  seller_cancel_reason?: string | null;
}

interface Order {
  id: string;
  order_number: string;

  total: number;
  status: string;

  created_at: string;

  order_items?: OrderItem[];
}

type OrderTab =
  | "all"
  | "pending"
  | "pickup"
  | "shipping"
  | "completed"
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
  LOAD ORDERS
  ========================= */

  useEffect(() => {
    void loadOrders();
  }, []);

  async function loadOrders(): Promise<void> {

    try {

      const token = await getPiAccessToken();

      const res = await fetch("/api/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!res.ok) throw new Error("UNAUTHORIZED");

      const data = await res.json();

      const rawOrders: Order[] = data.orders ?? [];

      setOrders(Array.isArray(rawOrders) ? rawOrders : []);

    } catch (e) {

      console.error("Load orders error:", e);
      setOrders([]);

    } finally {

      setLoading(false);

    }

  }

  /* =========================
  FILTER
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

      {/* HEADER */}

      <header className="bg-orange-500 text-white px-4 py-4">

        <div className="bg-orange-400 rounded-lg p-4">

          <p className="text-sm opacity-90">
            {t.orders}
          </p>

          <p className="text-xs opacity-80 mt-1">
            {filteredOrders.length}
          </p>

        </div>

      </header>

      {/* TABS */}

      <div className="bg-white border-b">

        <div className="grid grid-cols-6 text-xs text-center">

          {([
            ["all", t.all],
            ["pending", t.order_pending],
            ["pickup", t.order_pickup],
            ["shipping", t.order_shipping],
            ["completed", t.order_received],
            ["cancelled", t.order_cancelled],
          ] as [OrderTab, string][]).map(([key, label]) => (

            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`py-3 border-b-2 truncate ${
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

      {/* CONTENT */}

      <section className="px-4 mt-4 space-y-4">

        {loading ? (

          <p className="text-center text-gray-500">
            {t.loading}
          </p>

        ) : filteredOrders.length === 0 ? (

          <p className="text-center text-gray-400">
            {t.no_orders}
          </p>

        ) : (

          filteredOrders.map((o) => (

            <div
              key={o.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            >

              {/* HEADER */}

              <div className="flex justify-between px-4 py-3 border-b text-sm">

                <span className="font-semibold">
                  #{o.order_number}
                </span>
                <span className="text-orange-500 text-right max-w-[120px] leading-tight line-clamp-2">
  {t[`order_${o.status}`] ?? o.status}
</span>

              </div>

              {/* PRODUCTS */}

              {o.order_items?.map((item, idx) => (

                <div
                  key={idx}
                  className="flex gap-3 items-center px-4 py-3 border-b"
                >

                  <div className="w-14 h-14 bg-gray-100 rounded overflow-hidden flex-shrink-0">

                    <img
                      src={item.thumbnail || "/placeholder.png"}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                    />

                  </div>

                  <div className="flex-1 min-w-0">

                    <p className="text-sm font-medium line-clamp-2 min-h-[40px]">
                      {item.product_name}
                    </p>

                     <p className="text-xs text-gray-500">
                          x{item.quantity} · π
                          {formatPi(
                            Number(item.total_price) /
                            Number(item.quantity || 1)
                          )}
                        </p>

                    {item.seller_message && (
                      <p className="text-xs text-blue-600 mt-1">
                        {t.seller_message ?? "Seller message"}:{" "}
                        {item.seller_message}
                      </p>
                    )}

                    {item.seller_cancel_reason && (
                      <p className="text-xs text-red-500 mt-1">
                        {t.seller_cancel_reason ?? "Seller reason"}:{" "}
                        {item.seller_cancel_reason}
                      </p>
                    )}

                  </div>

                </div>

              ))}

              {/* FOOTER */}

              <div className="flex justify-between items-center px-4 py-3 text-sm">

                <span>

                  {t.total}:{" "}
                  <b>π{formatPi(o.total)}</b>

                </span>

                <button className="px-4 py-1 border border-orange-500 text-orange-500 rounded">

                  {t.buy_now}

                </button>

              </div>

            </div>

          ))

        )}

      </section>

    </main>
  );
}
