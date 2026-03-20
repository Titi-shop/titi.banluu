"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { getPiAccessToken } from "@/lib/piAuth";
import { formatPi } from "@/lib/pi";

/* =========================
TYPES
========================= */

interface OrderItem {
  product_name: string;
  thumbnail: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: string;
}

interface Order {
  id: string;
  order_number: string;
  total: number;
  created_at: string;
  status: string;
  order_items: OrderItem[];
}

interface ApiOrdersResponse {
  orders?: Order[];
}

interface MessageState {
  type: "error" | "success";
  text: string;
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
  const { user, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [showCancelFor, setShowCancelFor] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [message, setMessage] = useState<MessageState | null>(null);

  function showMessage(text: string, type: "error" | "success" = "error") {
    setMessage({ text, type });
    window.setTimeout(() => {
      setMessage(null);
    }, 3000);
  }

  function resetCancelState() {
    setShowCancelFor(null);
    setSelectedReason("");
    setCustomReason("");
  }

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    void loadOrders();
  }, [authLoading, user]);

  /* =========================
  LOAD ORDERS
  ========================= */

  async function loadOrders() {
    try {
      setLoading(true);

      const token = await getPiAccessToken();

      if (!token) {
        setOrders([]);
        return;
      }

      const res = await fetch("/api/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("LOAD_FAILED");
      }

      const data: ApiOrdersResponse = await res.json();
      const rawOrders = Array.isArray(data.orders) ? data.orders : [];

      const filtered = rawOrders.filter((o) => o.status === "pending");
      setOrders(filtered);
    } catch (err) {
      console.error("Load orders error:", err);
      setOrders([]);
      showMessage(t.load_orders_failed || "Không thể tải đơn hàng", "error");
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

      if (!token) {
        showMessage(t.login_required || "Vui lòng đăng nhập", "error");
        return;
      }

      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cancel_reason: reason,
        }),
      });

      if (!res.ok) {
        throw new Error("CANCEL_FAILED");
      }

      resetCancelState();
      await loadOrders();
      showMessage(t.cancel_success || "Huỷ đơn thành công", "success");
    } catch (err) {
      console.error("Cancel order error:", err);
      showMessage(t.cancel_order_failed || "Không thể huỷ đơn.", "error");
    } finally {
      setProcessingId(null);
    }
  }

  const totalPi = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  if (authLoading) {
    return <main className="p-8 text-center">Loading...</main>;
  }

  if (!user) {
    return <main className="p-8 text-center">Please login</main>;
  }

  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      {message && (
        <div
          className={`fixed top-16 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2 text-sm text-white shadow-lg ${
            message.type === "error" ? "bg-red-500" : "bg-green-500"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* HEADER */}
      <header className="bg-orange-500 px-4 py-4 text-white">
        <div className="rounded-lg bg-orange-400 p-4">
          <p className="text-sm opacity-90">{t.order_info}</p>

          <p className="mt-1 text-xs opacity-80">
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
          <div className="mt-16 flex flex-col items-center justify-center text-gray-400">
            <div className="mb-4 h-24 w-24 rounded-full bg-gray-200 opacity-40" />
            <p>{t.no_pending_orders || "Không có đơn chờ xác nhận"}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div
                key={o.id}
                className="overflow-hidden rounded-xl bg-white shadow-sm"
              >
                {/* HEADER */}
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <span className="text-sm font-semibold">
                    #{o.order_number}
                  </span>

                  <span className="text-sm font-medium text-orange-500">
                    {t.status_pending || "Chờ xác nhận"}
                  </span>
                </div>

                {/* PRODUCTS */}
                <div className="space-y-3 px-4 py-3">
                  {o.order_items?.map((item, idx) => {
                    const safeQty = item.quantity > 0 ? item.quantity : 1;
                    const unitPrice =
                      typeof item.unit_price === "number" && item.unit_price > 0
                        ? item.unit_price
                        : Number(item.total_price || 0) / safeQty;

                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="h-14 w-14 overflow-hidden rounded bg-gray-100">
                          <img
                            src={item.thumbnail || "/placeholder.png"}
                            alt={item.product_name}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-sm font-medium">
                            {item.product_name}
                          </p>

                          <p className="text-xs text-gray-500">
                            x{safeQty} · π{formatPi(unitPrice)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* FOOTER */}
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm font-semibold">
                    {t.total || "Tổng cộng"}: π{formatPi(o.total)}
                  </p>

                  <button
                    onClick={() => {
                      setShowCancelFor(o.id);
                      setSelectedReason("");
                      setCustomReason("");
                    }}
                    disabled={processingId === o.id}
                    className="rounded-md border border-red-500 px-4 py-1.5 text-sm text-red-500 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
                  >
                    {processingId === o.id
                      ? t.canceling || "Đang huỷ..."
                      : t.cancel_order || "Huỷ đơn"}
                  </button>
                </div>

                {/* CANCEL BOX */}
                {showCancelFor === o.id && (
                  <div className="space-y-3 px-4 pb-4">
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
                            onChange={(e) => setSelectedReason(e.target.value)}
                          />
                          {t[key] || key}
                        </label>
                      ))}
                    </div>

                    {selectedReason === "cancel_reason_other" && (
                      <textarea
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        placeholder={
                          t.enter_cancel_reason || "Nhập lý do huỷ"
                        }
                        className="w-full rounded-md border p-2 text-sm"
                        rows={3}
                      />
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const finalReason =
                            selectedReason === "cancel_reason_other"
                              ? customReason.trim()
                              : selectedReason.trim();

                          if (!finalReason) {
                            showMessage(
                              t.select_cancel_reason ||
                                "Vui lòng chọn lý do huỷ",
                              "error"
                            );
                            return;
                          }

                          void handleCancel(o.id, finalReason);
                        }}
                        disabled={processingId === o.id}
                        className="rounded-md bg-red-500 px-4 py-1.5 text-sm text-white disabled:opacity-50"
                      >
                        {t.confirm_cancel || "Xác nhận huỷ"}
                      </button>

                      <button
                        onClick={resetCancelState}
                        disabled={processingId === o.id}
                        className="rounded-md border px-4 py-1.5 text-sm disabled:opacity-50"
                      >
                        {t.cancel || "Đóng"}
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
