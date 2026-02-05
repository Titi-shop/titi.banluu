"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

/* =========================
   TYPES
========================= */
interface Order {
  id: number;
  createdAt: string;
  status: string;
  reviewed?: boolean;
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
export default function CustomerReviewPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [comments, setComments] = useState<Record<number, string>>({});
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  /* =========================
     LOAD REVIEWABLE ORDERS
  ========================= */
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await apiAuthFetch("/api/orders?reviewable=true");
      if (!res.ok) throw new Error("UNAUTHORIZED");

      const data: Order[] = await res.json();

      // ✅ CHỈ ĐƠN ĐÃ NHẬN / HOÀN TẤT & CHƯA REVIEW
      setOrders(
        (data || []).filter(
          (o) =>
            (o.status === "completed" ||
              o.status === "received") &&
            !o.reviewed
        )
      );
    } catch (e) {
      console.error("❌ Load review orders error:", e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     SUBMIT REVIEW
  ========================= */
  const submitReview = async (orderId: number) => {
    if (submittingId !== null) return;

    const rating = ratings[orderId];
    const comment = comments[orderId] || "";

    if (!rating) {
      alert(t.select_rating);
      return;
    }

    try {
      setSubmittingId(orderId);

      const res = await apiAuthFetch("/api/reviews", {
        method: "POST",
        body: JSON.stringify({ orderId, rating, comment }),
      });

      if (!res.ok) throw new Error("REVIEW_FAILED");

      // ✅ UI UPDATE NGAY
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      alert(t.review_success);
    } catch (e) {
      console.error("❌ Submit review error:", e);
      alert(t.review_failed);
    } finally {
      setSubmittingId(null);
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
      count: orders.length,
    },
    {
      key: "received",
      label: t.order_received,
      href: "/customer/orders",
    },
  ];

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
                {/* LABEL */}
                <div className="h-8 flex items-center justify-center px-1">
                  <span className="leading-tight text-gray-700 text-center">
                    {tab.label}
                  </span>
                </div>

                {/* COUNT */}
                <div
                  className={`h-5 flex items-center justify-center mt-1 ${
                    active
                      ? "text-orange-500 font-semibold"
                      : "text-gray-400"
                  }`}
                >
                  {tab.count ?? 0}
                </div>

                {/* ACTIVE BAR */}
                {active && (
                  <div className="h-0.5 w-6 bg-orange-500 mt-1 rounded" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ===== CONTENT ===== */}
      <section className="px-4 mt-10">
        {loading && (
          <p className="text-center text-gray-500">
            ⏳ {t.loading_orders}
          </p>
        )}

        {!loading && orders.length === 0 && (
          <div className="flex flex-col items-center text-gray-400 mt-16">
            <div className="w-28 h-28 bg-gray-200 rounded-full mb-4 opacity-40" />
            <p>{t.no_orders_to_review}</p>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow p-4"
              >
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">
                    #{order.id}
                  </span>
                  <span className="text-gray-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </span>
                </div>

                {/* STAR RATING */}
                <div className="flex gap-1 my-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() =>
                        setRatings((p) => ({
                          ...p,
                          [order.id]: star,
                        }))
                      }
                      className={`text-2xl ${
                        (ratings[order.id] || 0) >= star
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                {/* COMMENT */}
                <textarea
                  rows={3}
                  className="w-full border rounded p-2 text-sm"
                  placeholder={t.comment_placeholder}
                  value={comments[order.id] || ""}
                  onChange={(e) =>
                    setComments((p) => ({
                      ...p,
                      [order.id]: e.target.value,
                    }))
                  }
                />

                {/* SUBMIT */}
                <button
                  onClick={() => submitReview(order.id)}
                  disabled={
                    submittingId === order.id ||
                    !ratings[order.id]
                  }
                  className={`mt-3 w-full py-2 rounded text-white ${
                    submittingId === order.id ||
                    !ratings[order.id]
                      ? "bg-gray-400"
                      : "bg-orange-500 hover:bg-orange-600"
                  }`}
                >
                  {submittingId === order.id
                    ? t.submitting
                    : t.submit_review}
                </button>
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
