"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { formatPi } from "@/lib/pi";

/* ================= TYPES ================= */

interface Product {
  id: string;
  name: string;
  images: string[];
}

interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
  product?: Product;
}

interface Buyer {
  name: string;
  phone: string;
  address: string;
}

interface Order {
  id: string;
  status: string;
  total: number;
  created_at: string;
  buyer?: Buyer;
  order_items: OrderItem[];
}

/* ================= HELPERS ================= */

function formatDate(date: string): string {
  const d = new Date(date);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString();
}

/* ================= PAGE ================= */

export default function SellerCompletedOrdersPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD ================= */

  useEffect(() => {
    void loadOrders();
  }, []);

  async function loadOrders(): Promise<void> {
    try {
      const res = await apiAuthFetch(
        "/api/seller/orders?status=completed",
        { cache: "no-store" }
      );

      if (!res.ok) throw new Error("LOAD_FAILED");

      const data: unknown = await res.json();
      setOrders(Array.isArray(data) ? (data as Order[]) : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  /* ================= TOTAL ================= */

  const totalPi = useMemo(() => {
    return orders.reduce((sum, o) => sum + o.total, 0);
  }, [orders]);

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
      {/* ===== HEADER XÁM MỜ ===== */}
      <header className="bg-gray-600/90 backdrop-blur-lg text-white px-4 py-5 shadow-md">
        <div className="bg-white/10 rounded-xl p-4 border border-white/20">
          <p className="text-sm font-medium opacity-90">
            {t.completed_orders ?? "Completed Orders"}
          </p>

          <p className="text-xs mt-1 text-white/80">
            {t.orders ?? "Orders"}: {orders.length} · π
            {formatPi(totalPi)}
          </p>
        </div>
      </header>

      {/* ===== CONTENT ===== */}
      <section className="px-4 mt-5 space-y-4">
        {orders.length === 0 ? (
          <p className="text-center text-gray-400">
            {t.no_completed_orders ?? "No completed orders"}
          </p>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              onDoubleClick={() =>
                router.push(`/seller/orders/${order.id}`)
              }
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.99] transition"
            >
              {/* ORDER HEADER */}
              <div className="flex justify-between px-4 py-3 border-b bg-gray-50">
                <div>
                  <p className="font-semibold text-sm">
                    #{order.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(order.created_at)}
                  </p>
                </div>

                <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-100 text-green-700">
                  {t.status_completed ?? "Completed"}
                </span>
              </div>

              {/* BUYER INFO */}
              <div className="px-4 py-3 text-sm space-y-1">
                <p>
                  <span className="text-gray-500">
                    {t.customer ?? "Customer"}:
                  </span>{" "}
                  {order.buyer?.name ?? "—"}
                </p>

                <p>
                  <span className="text-gray-500">
                    {t.phone ?? "Phone"}:
                  </span>{" "}
                  {order.buyer?.phone ?? "—"}
                </p>

                <p className="text-gray-600 text-xs">
                  {order.buyer?.address ??
                    (t.no_address ?? "No address")}
                </p>
              </div>

              {/* PRODUCTS */}
              <div className="divide-y">
                {order.order_items.map((item) => (
                  <div
                    key={`${order.id}-${item.product_id}`}
                    className="flex gap-3 p-4"
                  >
                    <img
                      src={
                        item.product?.images?.[0] ??
                        "/placeholder.png"
                      }
                      alt={item.product?.name ?? (t.product ?? "Product")}
                      className="w-14 h-14 rounded-lg object-cover bg-gray-100"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">
                        {item.product?.name ??
                          (t.product ?? "Product")}
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        x{item.quantity} · π
                        {formatPi(item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* FOOTER */}
              <div
                className="px-4 py-3 border-t bg-gray-50 text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="font-semibold">
                  {t.total ?? "Total"}: π
                  {formatPi(order.total)}
                </span>
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
