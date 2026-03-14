"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext"
import { formatPi } from "@/lib/pi";

/* ================= TYPES ================= */

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  thumbnail?: string;
  images?: string[];
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  order_number?: string;
  status: string;
  total: number;
  created_at?: string;

  shipping_name?: string;
  shipping_phone?: string;
  shipping_address?: string;
  shipping_provider?: string;
  shipping_country?: string;
  shipping_postal_code?: string;

  order_items: OrderItem[];
}

/* ================= HELPERS ================= */

function formatDate(date: string): string {
  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return "—";
  }

  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}


/* ================= PAGE ================= */

export default function SellerConfirmedOrdersPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
const { user, loading: authLoading } = useAuth();
  
  /* ================= LOAD ================= */

  useEffect(() => {
    if (authLoading) return;
    void loadOrders();
  }, [authLoading, loadOrders]);

  async function loadOrders() {
    try {
      const res = await apiAuthFetch(
        "/api/seller/orders?status=confirmed",
        { cache: "no-store" }
      );

      if (!res.ok) throw new Error();

      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  /* ================= TOTAL ================= */

  const totalPi = useMemo(
  () =>
    orders.reduce(
      (sum, o) => sum + Number(o.total ?? 0),
      0
    ),
  [orders]
);

  /* ================= SHIPPING ================= */

  async function startShipping(orderId: string) {
    try {
      setProcessingId(orderId);

      const res = await apiAuthFetch(
        `/api/seller/orders/${orderId}/shipping`,
        { method: "PATCH" }
      );

      if (!res.ok) throw new Error();

      await loadOrders();
    } catch {
    } finally {
      setProcessingId(null);
    }
  }

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <p className="text-center mt-10 text-gray-500">
        {t.loading ?? "Loading..."}
      </p>
    );
  }

  /* ================= UI ================= */

  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      {/* HEADER */}
      <header className="bg-gray-600/90 backdrop-blur-lg text-white px-4 py-5 shadow-md">
        <div className="bg-white/10 rounded-xl p-4 border border-white/20">
          <p className="text-sm font-medium">
            {t.confirmed_orders ?? "Confirmed Orders"}
          </p>

          <p className="text-xs mt-1 text-white/80">
            {t.orders ?? "Orders"}: {orders.length} · π{formatPi(totalPi)}
          </p>
        </div>
      </header>

      {/* CONTENT */}
      <section className="px-4 mt-5 space-y-4">
        {orders.length === 0 ? (
          <p className="text-center text-gray-400">
            {t.no_confirmed_orders ?? "No confirmed orders"}
          </p>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              onDoubleClick={() =>
                router.push(`/seller/orders/${order.id}`)
              }
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* ORDER HEADER */}
              <div className="flex justify-between px-4 py-3 border-b bg-gray-50">
                <div>
                  <p className="font-semibold text-sm">
                    #{order.order_number ?? order.id.slice(0, 8)}
                  </p>

                  <p className="text-xs text-gray-500">
                    {formatDate(order.created_at)}
                  </p>
                </div>

                <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-100 text-green-700">
                  {t.status_confirmed ?? "Confirmed"}
                </span>
              </div>

              {/* PRODUCTS */}
              <div className="divide-y">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex gap-3 p-4">
                    <img
                      src={
                        item.thumbnail ??
                        item.images?.[0] ??
                        "/placeholder.png"
                      }
                      alt={item.product_name}
                      className="w-14 h-14 rounded-lg object-cover bg-gray-100"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">
                        {item.product_name}
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        x{item.quantity} · π{formatPi(item.unit_price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* SHIPPING INFO */}
              <div className="px-4 py-3 text-xs text-gray-600 border-t">
                <p>{order.shipping_name}</p>
                <p>{order.shipping_phone}</p>
                <p>{order.shipping_address}</p>
                <p>
                  {order.shipping_country} {order.shipping_postal_code}
                </p>
                <p>{order.shipping_provider}</p>
              </div>

              {/* FOOTER */}
              <div
                className="px-4 py-4 border-t bg-gray-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-sm font-semibold mb-3">
                  {t.total ?? "Total"}: π{formatPi(Number(o.total ?? 0))}
                </div>

                <div className="flex justify-end">
                  <button
                    disabled={processingId === order.id}
                    onClick={() => startShipping(order.id)}
                    className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg disabled:opacity-50"
                  >
                    {t.start_shipping   ?? "Shipping"}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
