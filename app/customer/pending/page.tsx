"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { getPiAccessToken } from "@/lib/piAuth";
import { formatPi } from "@/lib/pi";

/* =========================
TYPES (MATCH DB)
========================= */

interface OrderItem {
  product_name: string;
  thumbnail: string;
  images?: string[];
  quantity: number;
  unit_price: number;
}

interface Order {
  id: string;
  order_number: string;
  total: number;
  created_at: string;
  status: string;
  order_items: OrderItem[];
}

/* =========================
CANCEL REASONS
========================= */

const CANCEL_REASON_KEYS = [
  "cancel_reason_change_mind",
  "cancel_reason_wrong_product",
  "cancel_reason_change_variant",
  "cancel_reason_better_price",
  "cancel_reason_delivery_slow",
  "cancel_reason_update_address",
  "cancel_reason_other",
] as const;

/* =========================
PAGE
========================= */

export default function PendingOrdersPage() {

  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [showCancelFor, setShowCancelFor] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  useEffect(() => {
    void loadOrders();
  }, []);

  /* =========================
  LOAD ORDERS
  ========================= */

  async function loadOrders() {

    try {

      const token = await getPiAccessToken();

      const res = await fetch("/api/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!res.ok) throw new Error("LOAD_FAILED");

      const data = await res.json();

      const rawOrders: Order[] = data.orders ?? [];

      const filtered = rawOrders.filter(
        (o) => o.status === "pending"
      );

      setOrders(filtered);

    } catch (err) {

      console.error("Load orders error:", err);
      setOrders([]);

    } finally {

      setLoading(false);

    }
  }

  /* =========================
  CANCEL ORDER
  ========================= */

  async function handleCancel(orderId: string, reason: string) {

    try {

      setProcessingId(orderId);

      const token = await getPiAccessToken();

      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "refunded",
          cancel_reason: reason,
        }),
      });

      if (!res.ok) {
        throw new Error("CANCEL_FAILED");
      }

      setSelectedReason("");
      setCustomReason("");
      setShowCancelFor(null);

      await loadOrders();

    } catch (err) {

      alert("Không thể huỷ đơn.");

    } finally {

      setProcessingId(null);

    }
  }

  const totalPi = orders.reduce(
    (sum, o) => sum + Number(o.total),
    0
  );

  return (
    <main className="min-h-screen bg-gray-100 pb-24">

      {/* HEADER */}
      <header className="bg-orange-500 text-white px-4 py-4">

        <div className="bg-orange-400 rounded-lg p-4">

          <p className="text-sm opacity-90">
            {t.order_info}
          </p>

          <p className="text-xs opacity-80 mt-1">
            {t.orders}: {orders.length} · π{formatPi(totalPi)}
          </p>

        </div>

      </header>

      {/* CONTENT */}

      <section className="mt-6 px-4">

        {loading ? (

          <p className="text-center text-gray-400">
            {t.loading_orders || "Đang tải..."}
          </p>

        ) : orders.length === 0 ? (

          <div className="flex flex-col items-center justify-center mt-16 text-gray-400">

            <div className="w-24 h-24 bg-gray-200 rounded-full mb-4 opacity-40" />

            <p>
              {t.no_pending_orders || "Không có đơn chờ xác nhận"}
            </p>

          </div>

        ) : (

          <div className="space-y-4">

            {orders.map((o) => (

              <div
                key={o.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >

                {/* HEADER */}

                <div className="flex justify-between items-center px-4 py-3 border-b">

                  <span className="font-semibold text-sm">
                    #{o.order_number}
                  </span>

                  <span className="text-orange-500 text-sm font-medium">
                    {t.status_pending || "Chờ xác nhận"}
                  </span>

                </div>

                {/* PRODUCTS */}

                <div className="px-4 py-3 space-y-3">

                  {o.order_items?.map((item, idx) => (

                    <div
                      key={idx}
                      className="flex gap-3 items-center"
                    >

                      <div className="w-14 h-14 bg-gray-100 rounded overflow-hidden">

                        <img
                          src={item.thumbnail}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />

                      </div>

                      <div className="flex-1 min-w-0">

                        <p className="text-sm font-medium line-clamp-1">
                          {item.product_name}
                        </p>

                        <p className="text-xs text-gray-500">
                          x{item.quantity} · π{formatPi(item.unit_price)}
                        </p>

                      </div>

                    </div>

                  ))}

                </div>

                {/* FOOTER */}

                <div className="flex justify-between items-center px-4 py-3 border-t">

                  <p className="text-sm font-semibold">
                    {t.total || "Tổng cộng"}: π{formatPi(o.total)}
                  </p>

                  <button
                    onClick={() => setShowCancelFor(o.id)}
                    disabled={processingId === o.id}
                    className="px-4 py-1.5 text-sm border border-red-500 text-red-500 rounded-md hover:bg-red-500 hover:text-white transition disabled:opacity-50"
                  >

                    {processingId === o.id
                      ? t.canceling
                      : t.cancel_order}

                  </button>

                </div>

                {/* CANCEL BOX */}

                {showCancelFor === o.id && (

                  <div className="px-4 pb-4 space-y-3">

                    <div className="space-y-2">

                      {CANCEL_REASON_KEYS.map((key) => (

                        <label
                          key={key}
                          className="flex items-center gap-2 text-sm"
                        >

                          <input
                            type="radio"
                            name={`cancel-${o.id}`}
                            value={key}
                            checked={selectedReason === key}
                            onChange={(e) =>
                              setSelectedReason(e.target.value)
                            }
                          />

                          {t[key]}

                        </label>

                      ))}

                    </div>

                    {selectedReason === "cancel_reason_other" && (

                      <textarea
                        value={customReason}
                        onChange={(e) =>
                          setCustomReason(e.target.value)
                        }
                        placeholder={t.enter_cancel_reason}
                        className="w-full border rounded-md p-2 text-sm"
                        rows={3}
                      />

                    )}

                    <div className="flex gap-2">

                      <button
                        onClick={() => {

                          const finalReason =
                            selectedReason === "cancel_reason_other"
                              ? customReason
                              : selectedReason;

                          if (!finalReason.trim()) {
                            alert(t.select_cancel_reason);
                            return;
                          }

                          handleCancel(o.id, finalReason);

                        }}
                        className="px-4 py-1.5 text-sm bg-red-500 text-white rounded-md"
                      >

                        {t.confirm_cancel}

                      </button>

                      <button
                        onClick={() => {

                          setShowCancelFor(null);
                          setSelectedReason("");
                          setCustomReason("");

                        }}
                        className="px-4 py-1.5 text-sm border rounded-md"
                      >

                        {t.cancel}

                      </button>

                    </div>

                  </div>

                )}

              </div>

            ))}

          </div>

        )}

      </section>

    </main>
  );
}
