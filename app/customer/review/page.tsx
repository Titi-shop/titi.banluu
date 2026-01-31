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
  total: number;
  status: string;
  reviewed?: boolean;
  createdAt: string;
}

interface TabItem {
  label: string;
  count: number;
  href: string;
  active: boolean;
}

export default function ReviewPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { t, lang } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [comments, setComments] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState<number | null>(null);

  /* =========================
     LOAD ORDERS (NEED REVIEW)
  ========================= */
  useEffect(() => {
    loadOrders();
  }, [lang]);

  const loadOrders = async () => {
    try {
      const res = await apiAuthFetch("/api/orders");
      if (!res.ok) throw new Error("UNAUTHORIZED");

      const data: Order[] = await res.json();

      const completedStatusByLang: Record<string, string[]> = {
        vi: ["Hoàn tất"],
        en: ["Completed"],
        zh: ["已完成"],
      };

      const allowStatus =
        completedStatusByLang[lang] || completedStatusByLang.vi;

      setOrders(
        (data || []).filter(
          (o) => allowStatus.includes(o.status) && !o.reviewed
        )
      );
    } catch (err) {
      console.error("❌ Load review orders error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     SUBMIT REVIEW
  ========================= */
  const submitReview = async (orderId: number) => {
    const rating = ratings[orderId];
    const comment = comments[orderId] || "";

    if (!rating) {
      alert(t.select_rating || "Vui lòng chọn số sao");
      return;
    }

    setSubmitting(orderId);
    try {
      const res = await apiAuthFetch("/api/reviews", {
        method: "POST",
        body: JSON.stringify({ orderId, rating, comment }),
      });

      if (!res.ok) throw new Error("REVIEW_FAILED");

      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      alert(t.review_success || "Đánh giá thành công!");
    } catch (err) {
      console.error("❌ Submit review error:", err);
      alert(t.review_failed || "Không thể gửi đánh giá");
    } finally {
      setSubmitting(null);
    }
  };

  /* =========================
     TABS
  ========================= */
  const tabs: TabItem[] = [
    {
      label: t.wait_confirm || "Chờ xác nhận",
      count: 0,
      href: "/customer/pending",
      active: false,
    },
    {
      label: t.wait_pickup || "Chờ lấy hàng",
      count: 0,
      href: "/customer/pickup",
      active: false,
    },
    {
      label: t.shipping || "Đang giao",
      count: 0,
      href: "/customer/shipping",
      active: false,
    },
    {
      label: t.rating || "Đánh giá",
      count: orders.length,
      href: "/customer/review",
      active: pathname === "/customer/review",
    },
    {
      label: t.received || "Đơn hàng nhận",
      count: 0,
      href: "/customer/orders",
      active: false,
    },
  ];

  /* =========================
     UI
  ========================= */
  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      {/* ===== HEADER ===== */}
      <div className="bg-orange-500 text-white px-4 py-4">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="text-xl">
            ←
          </button>
          <h1 className="font-semibold text-lg">
            ⭐ {t.review_orders || "Đánh giá đơn hàng"}
          </h1>
        </div>
      </div>

      {/* ===== STATUS TABS ===== */}
      <div className="bg-white shadow-sm">
        <div className="grid grid-cols-5 text-center text-sm">
          {tabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => router.push(tab.href)}
              className="py-3"
            >
              <p className="text-gray-700 leading-tight">{tab.label}</p>
              <p
                className={`mt-1 ${
                  tab.active
                    ? "text-orange-500 font-semibold"
                    : "text-gray-500"
                }`}
              >
                {tab.count}
              </p>
              {tab.active && (
                <div className="h-0.5 bg-orange-500 w-6 mx-auto mt-1 rounded" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="mt-10 px-4">
        {loading ? (
          <p className="text-center text-gray-500">
            ⏳ {t.loading || "Đang tải..."}
          </p>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center text-gray-400 mt-16">
            <div className="w-32 h-32 bg-gray-200 rounded-full mb-4 opacity-40" />
            <p>
              {t.no_orders_to_review || "Không có đơn cần đánh giá"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div
                key={o.id}
                className="bg-white rounded-lg p-4 shadow"
              >
                <div className="flex justify-between">
                  <span className="font-semibold">#{o.id}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(o.createdAt).toLocaleString()}
                  </span>
                </div>

                {/* ===== RATING ===== */}
                <div className="flex gap-1 my-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() =>
                        setRatings((p) => ({ ...p, [o.id]: star }))
                      }
                      className={`text-2xl ${
                        (ratings[o.id] || 0) >= star
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                {/* ===== COMMENT ===== */}
                <textarea
                  rows={3}
                  className="w-full border rounded p-2 text-sm"
                  placeholder={
                    t.comment_placeholder || "Nhận xét của bạn"
                  }
                  value={comments[o.id] || ""}
                  onChange={(e) =>
                    setComments((p) => ({
                      ...p,
                      [o.id]: e.target.value,
                    }))
                  }
                />

                <button
                  disabled={submitting === o.id}
                  onClick={() => submitReview(o.id)}
                  className={`mt-3 w-full py-2 rounded text-white ${
                    submitting === o.id
                      ? "bg-gray-400"
                      : "bg-orange-500 hover:bg-orange-600"
                  }`}
                >
                  {submitting === o.id
                    ? t.submitting || "Đang gửi..."
                    : t.submit_review || "Gửi đánh giá"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== FLOAT BUTTON ===== */}
      <button className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-orange-500 shadow-lg" />
    </main>
  );
}
