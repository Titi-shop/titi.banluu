"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { formatPi } from "@/lib/pi";

/* ================= TYPES ================= */

type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipping"
  | "completed"
  | "returned"
  | "cancelled";

interface OrderItem {

  id: string;

  product_id: string;
  product_name: string;

  thumbnail: string;
  images?: string[];

  quantity: number;

  unit_price: number;
  total_price: number;

  status: OrderStatus;
}

interface Order {

  id: string;
  order_number: string;

  created_at: string;

  shipping_name?: string;
  shipping_phone?: string;
  shipping_address?: string;
  shipping_provider?: string;
  shipping_country?: string;
  shipping_postal_code?: string;

  total: number;

  order_items?: OrderItem[];
}

type OrderTab = "all" | OrderStatus;

/* ================= PAGE ================= */

export default function SellerOrdersPage() {

  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<OrderTab>("all");

  /* ================= LOAD ================= */

  useEffect(() => {

    const load = async () => {

      try {

        const res = await apiAuthFetch(
          "/api/seller/orders",
          { cache: "no-store" }
        );

        if (!res.ok) {
          setOrders([]);
          return;
        }

        const data = await res.json();

        if (Array.isArray(data)) {
          setOrders(data);
        } else {
          setOrders([]);
        }

      } catch {

        setOrders([]);

      } finally {

        setLoading(false);

      }

    };

    load();

  }, []);

  /* ================= FILTER ================= */

  const filteredOrders = useMemo(() => {

    if (activeTab === "all") return orders;

    return orders.filter((o) =>
      o.order_items?.some(
        (i) => i.status === activeTab
      )
    );

  }, [orders, activeTab]);

  /* ================= COUNT ================= */

  const countByStatus = (status: OrderTab): number => {

    if (status === "all") return orders.length;

    return orders.filter((o) =>
      o.order_items?.some(
        (i) => i.status === status
      )
    ).length;

  };

  /* ================= UI ================= */

  return (
    <main className="min-h-screen bg-gray-100 pb-24">

      {/* HEADER */}

      <header className="bg-gray-700 text-white px-4 py-4">

        <div className="bg-gray-600 rounded-lg p-4">

          <p className="text-sm opacity-90">
            {t.shop_orders ?? "Shop Orders"}
          </p>

          <p className="text-xs opacity-80 mt-1">
            {filteredOrders.length} {t.orders ?? "orders"}
          </p>

        </div>

      </header>

      {/* TABS */}

      <div className="bg-white border-b">

        <div className="flex gap-6 px-4 py-3 text-sm overflow-x-auto whitespace-nowrap">

          {([
            ["all", t.all ?? "All"],
            ["pending", t.pending_orders ?? "Pending"],
            ["confirmed", t.confirmed_orders ?? "Confirmed"],
            ["shipping", t.shipping_orders ?? "Shipping"],
            ["completed", t.completed_orders ?? "Completed"],
            ["returned", t.returned_orders ?? "Returned"],
            ["cancelled", t.cancelled_orders ?? "Cancelled"],
          ] as [OrderTab, string][])

          .map(([key, label]) => (

            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`pb-2 border-b-2 ${
                activeTab === key
                  ? "border-gray-700 text-gray-700 font-semibold"
                  : "border-transparent text-gray-500"
              }`}
            >

              {label}

              <div className="text-xs mt-1 text-center">
                {countByStatus(key)}
              </div>

            </button>

          ))}

        </div>

      </div>

      {/* CONTENT */}

      <section className="px-4 mt-4 space-y-4">

        {loading ? (

          <p className="text-center text-gray-500">
            {t.loading ?? "Loading..."}
          </p>

        ) : filteredOrders.length === 0 ? (

          <p className="text-center text-gray-400">
            {t.no_orders ?? "No orders"}
          </p>

        ) : (

          filteredOrders.map((o) => (

            <div
              key={o.id}
              className="bg-white rounded-lg shadow-sm"
            >

              {/* HEADER */}

              <div className="flex justify-between px-4 py-2 border-b text-sm">

                <span className="font-semibold break-all">
                  #{o.order_number}
                </span>

                <span className="text-gray-600 text-xs">
                  {new Date(o.created_at).toLocaleDateString()}
                </span>

              </div>

              {/* BUYER INFO */}

              {(o.shipping_name ||
                o.shipping_phone ||
                o.shipping_address) && (

                <div className="px-4 py-3 text-sm border-b bg-gray-50 space-y-1">

                  <p>
                    <span className="text-gray-500">
                      {t.customer ?? "Customer"}:
                    </span>{" "}
                    {o.shipping_name ?? "—"}
                  </p>

                  <p>
                    <span className="text-gray-500">
                      {t.phone ?? "Phone"}:
                    </span>{" "}
                    {o.shipping_phone ?? "—"}
                  </p>

                  <p className="text-xs text-gray-600">
                    {o.shipping_address ?? "—"}
                  </p>

                </div>

              )}

              {/* ORDER ITEMS */}

              {o.order_items?.map((item) => (

                <div
                  key={item.id}
                  className="flex gap-3 items-center p-4 border-t"
                >

                  <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">

                    <img
                      src={
                        item.thumbnail ||
                        "/placeholder.png"
                      }
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                    />

                  </div>

                  <div className="flex-1 min-w-0">

                    <p className="text-sm font-medium line-clamp-2">
                      {item.product_name}
                    </p>

                    <p className="text-xs text-gray-500">
                      x{item.quantity} · π
                      {formatPi(item.unit_price)}
                    </p>

                    <p className="text-xs text-gray-400 capitalize">
                      {t[`order_status_${item.status}`] ??
                        item.status}
                    </p>

                  </div>

                </div>

              ))}

              {/* FOOTER */}

              <div className="flex justify-between items-center px-4 py-3 border-t text-sm">

                <span>
                  {t.total ?? "Total"}:
                  <b className="ml-1">
                    {t.total}: π{formatPi(o.total)}
                
                  </b>
                </span>

              </div>

            </div>

          ))

        )}

      </section>

    </main>
  );
}
