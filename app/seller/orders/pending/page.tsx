"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { formatPi } from "@/lib/pi";

/* ================= TYPES ================= */

interface OrderItem {
  id: string;
  product_id: string | null;

  product_name: string;

  thumbnail: string;
  images: string[] | null;

  quantity: number;

  unit_price: number | string;
  total_price: number | string;

  status: string;
}

type OrderStatus = "pending" | "confirmed" | "cancelled";

interface Order {
  id: string;

  order_number: string;

  status: OrderStatus;

  total: number | string;

  created_at: string;

  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;

  shipping_provider?: string | null;
  shipping_country?: string | null;
  shipping_postal_code?: string | null;

  order_items: OrderItem[];
}

/* ================= HELPERS ================= */

function formatDate(date: string): string {
  const d = new Date(date);

  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("vi-VN");
}

/* ================= PAGE ================= */

export default function SellerPendingOrdersPage() {
  const router = useRouter();

  const { t } = useTranslation();

  const SELLER_CANCEL_REASONS: string[] = [
    t.cancel_reason_out_of_stock ?? "Out of stock",
    t.cancel_reason_discontinued ?? "Product discontinued",
    t.cancel_reason_wrong_price ?? "Wrong price",
    t.cancel_reason_other ?? "Other",
  ];

  const [orders, setOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState(true);

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  const [expandedId, setExpandedId] =
    useState<string | null>(null);

  const [showConfirmFor, setShowConfirmFor] =
    useState<string | null>(null);

  const [sellerMessage, setSellerMessage] =
    useState<string>("");

  const [showCancelFor, setShowCancelFor] =
    useState<string | null>(null);

  const [selectedReason, setSelectedReason] =
    useState<string>("");

  const [customReason, setCustomReason] =
    useState<string>("");

  /* ================= LOAD ================= */

  const loadOrders = useCallback(async () => {
    try {
      const res = await apiAuthFetch(
        "/api/seller/orders?status=pending",
        { cache: "no-store" }
      );

      if (!res.ok) {
        setOrders([]);
        return;
      }

      const data: unknown = await res.json();

      if (Array.isArray(data)) {
        setOrders(data as Order[]);
      } else {
        setOrders([]);
      }
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  /* ================= TOTAL ================= */

  const totalPi = useMemo(() => {
    return orders.reduce(
      (sum, o) => sum + Number(o.total ?? 0),
      0
    );
  }, [orders]);

  /* ================= CONFIRM ================= */

  async function handleConfirm(orderId: string) {
    if (!sellerMessage.trim()) return;

    try {
      setProcessingId(orderId);

      const res = await apiAuthFetch(
        `/api/seller/orders/${orderId}/confirm`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            seller_message: sellerMessage,
          }),
        }
      );

      if (!res.ok) return;

      setShowConfirmFor(null);

      setSellerMessage("");

      await loadOrders();
    } finally {
      setProcessingId(null);
    }
  }

  /* ================= CANCEL ================= */

  async function handleCancel(orderId: string) {
    const finalReason =
      selectedReason ===
      (t.cancel_reason_other ?? "Other")
        ? customReason
        : selectedReason;

    if (!finalReason.trim()) return;

    try {
      setProcessingId(orderId);

      const res = await apiAuthFetch(
        `/api/seller/orders/${orderId}/cancel`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            cancel_reason: finalReason,
          }),
        }
      );

      if (!res.ok) return;

      setShowCancelFor(null);

      setSelectedReason("");

      setCustomReason("");

      await loadOrders();
    } finally {
      setProcessingId(null);
    }
  }

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <p className="text-center mt-10 text-gray-400">
        {t.loading ?? "Loading..."}
      </p>
    );
  }

  /* ================= UI ================= */

  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      {/* HEADER */}

      <header className="bg-gray-600 text-white px-4 py-4">
        <div className="bg-gray-500 rounded-lg p-4">
          <p className="text-sm opacity-90">
            {t.pending_orders ?? "Pending orders"}
          </p>

          <p className="text-xs opacity-80 mt-1">
            {t.orders ?? "Orders"}: {orders.length} · π
            {formatPi(totalPi)}
          </p>
        </div>
      </header>

      <section className="mt-6 px-4 space-y-4">
        {orders.length === 0 ? (
          <p className="text-center text-gray-400">
            {t.no_pending_orders ??
              "No pending orders"}
          </p>
        ) : (
          orders.map((o) => (
            <div
              key={o.id}
              onClick={() => {
                if (expandedId === o.id) {
                  router.push(
                    `/seller/orders/${o.id}`
                  );
                } else {
                  setExpandedId(o.id);
                }
              }}
              className="bg-white rounded-xl shadow-sm overflow-hidden border"
            >
              {/* HEADER */}

              <div className="flex justify-between px-4 py-3 border-b bg-gray-50">
                <div>
                  <p className="font-semibold text-sm">
                    #{o.order_number}
                  </p>

                  <p className="text-xs text-gray-500">
                    {formatDate(o.created_at)}
                  </p>
                </div>

                <span className="text-yellow-600 text-sm font-medium">
                  {t.status_pending ??
                    "Pending"}
                </span>
              </div>

              {/* SHIPPING */}

              <div className="px-4 py-3 text-sm space-y-1 border-b">
                <p>
                  <span className="text-gray-500">
                    {t.customer ??
                      "Customer"}
                    :
                  </span>{" "}
                  {o.shipping_name}
                </p>

                <p>
                  <span className="text-gray-500">
                    {t.phone ?? "Phone"}:
                  </span>{" "}
                  {o.shipping_phone}
                </p>

                <p className="text-gray-600 text-xs">
                  {o.shipping_address}
                </p>
              </div>

              {/* ITEMS */}

              <div className="divide-y">
                {o.order_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 p-4"
                  >
                    <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={
                            item.product_name
                          }
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">
                        {item.product_name}
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        x{item.quantity} · π
                        {formatPi(
                          Number(
                            item.unit_price
                          )
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* FOOTER */}

              <div
                className="px-4 py-3 border-t bg-gray-50 text-sm"
                onClick={(e) =>
                  e.stopPropagation()
                }
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold">
                    {t.total ?? "Total"}: π
                    {formatPi(
                      Number(o.total)
                    )}
                  </span>

                  <div className="flex gap-2">
                    <button
                      disabled={
                        processingId === o.id
                      }
                      onClick={() => {
                        setSellerMessage(
                          t.confirm_default_message ??
                            "Thank you for your order."
                        );

                        setShowConfirmFor(
                          o.id
                        );

                        setShowCancelFor(
                          null
                        );
                      }}
                      className="px-3 py-1.5 text-xs bg-gray-700 text-white rounded-lg disabled:opacity-50"
                    >
                      {t.confirm ??
                        "Confirm"}
                    </button>

                    <button
                      disabled={
                        processingId === o.id
                      }
                      onClick={() => {
                        setShowCancelFor(
                          o.id
                        );

                        setShowConfirmFor(
                          null
                        );
                      }}
                      className="px-3 py-1.5 text-xs border border-gray-400 rounded-lg"
                    >
                      {t.cancel ?? "Cancel"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
