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

interface Order {
  id: string;
  status: string;
  total: number;
  created_at?: string;
  cancel_reason?: string | null;
  order_items: OrderItem[];
}

/* ================= HELPERS ================= */

function formatDate(date?: string): string {
  if (!date) return "—";
  const d = new Date(date);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("vi-VN");
}

/* ================= PAGE ================= */

export default function SellerCanceledOrdersPage() {
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
        "/api/seller/orders?status=cancelled",
        { cache: "no-store" }
      );

      if (!res.ok) {
        setOrders([]);
        return;
      }

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
    return orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
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
            {t.cancelled_orders ?? "Canceled Orders"}
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
            {t.no_cancelled_orders ?? "No canceled orders"}
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

                <span className="text-xs font-medium px-3 py-1 rounded-full bg-gray-200 text-gray-700">
                  {t.status_cancelled ?? "Canceled"}
                </span>
              </div>

              {/* ORDER ITEMS */}
              <div className="px-4 py-3 space-y-2">
                {order.order_items.map((item) => (
                  <div
                    key={`${order.id}-${item.product_id}`}
                    className="flex gap-3"
                  >
                    <img
                      src={
                        item.product?.images?.[0] ??
                        "/placeholder.png"
                      }
                      alt={item.product?.name ?? "product"}
                      className="w-12 h-12 rounded object-cover"
                    />

                    <div className="flex-1">
                      <p className="text-sm">
                        {item.product?.name ??
                          (t.product ?? "Product")}
                      </p>

                      <p className="text-xs text-gray-500">
                        x{item.quantity} · π
                        {formatPi(item.price)}
                      </p>
                      {/* 👇 Hiển thị lý do huỷ */}
                   {order.cancel_reason && (
               <p className="text-xs text-red-500 mt-1">
                  {t.cancel_reason ?? "Reason"}: {order.cancel_reason}
                </p>
                )}
             </div>
              
                  </div>
                ))}
              </div>

              {/* FOOTER */}
              <div className="px-4 py-3 border-t bg-gray-50 text-sm font-semibold">
                {t.total ?? "Total"}: π
                {formatPi(order.total)}
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
