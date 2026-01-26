"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { useRouter } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  total: number;
  status: string;
  reviewed?: boolean;
  createdAt: string;
  items?: OrderItem[];
}

export default function ReviewPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState<Record<number, number>>({});
  const [comments, setComments] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState<number | null>(null);

  /* =========================
     LOAD ORDERS (COOKIE AUTH)
  ========================= */
  useEffect(() => {
  apiFetch("/api/orders")
    .then((res) => {
      if (!res.ok) throw new Error("unauthorized");
      return res.json();
    })
    .then((data: Order[]) => {
      const filtered = (data || []).filter(
        (o) => o.status === "Hoàn tất" && !o.reviewed
      );
      setOrders(filtered);
    })
    .catch((err) => {
      console.error("❌ Load orders error:", err);
    })
    .finally(() => setLoading(false));
}, []);

  /* =========================
     SUBMIT REVIEW
  ========================= */
  const handleSubmitReview = async (orderId: number) => {
    const rating = selectedRating[orderId];
    const comment = comments[orderId] || "";

    if (!rating) {
      alert(t.select_rating || "Vui lòng chọn số sao!");
      return;
    }

    setSubmitting(orderId);
    try {
      const res = await apiFetch("/api/reviews", {
  method: "POST",
  body: JSON.stringify({
    orderId,
    rating,
    comment,
  }),
});

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "review_failed");

      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      alert(t.review_success || "Đánh giá thành công!");
    } catch (err) {
      console.error("❌ Submit review error:", err);
      alert(t.review_failed || "Gửi đánh giá thất bại");
    } finally {
      setSubmitting(null);
    }
  };

  if (loading)
    return (
      <p className="text-center mt-10 text-gray-500">
        ⏳ {t.loading || "Đang tải..."}
      </p>
    );

  return (
    <main className="p-4 max-w-4xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex items-center mb-4">
        <button
          onClick={() => router.back()}
          className="text-orange-500 font-semibold text-lg mr-2"
        >
          ←
        </button>
        <h1 className="text-xl font-semibold">
          ⭐ {t.review_orders || "Đánh giá đơn hàng"}
        </h1>
      </div>

      {orders.length === 0 ? (
        <p className="text-center text-gray-500">
          {t.no_orders_to_review || "Không có đơn cần đánh giá."}
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border rounded-lg p-4 shadow"
            >
              <p className="font-semibold">🧾 #{order.id}</p>
              <p className="text-sm text-gray-500">
                {t.created_at}: {order.createdAt}
              </p>

              {/* Rating */}
              <div className="flex gap-2 my-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() =>
                      setSelectedRating((p) => ({ ...p, [order.id]: star }))
                    }
                    className={`text-xl ${
                      selectedRating[order.id] >= star
                        ? "text-yellow-500"
                        : "text-gray-300"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>

              {/* Comment */}
              <textarea
                className="w-full border p-2 rounded text-sm"
                rows={3}
                placeholder={t.comment_placeholder || "Nhận xét của bạn"}
                value={comments[order.id] || ""}
                onChange={(e) =>
                  setComments((p) => ({ ...p, [order.id]: e.target.value }))
                }
              />

              <button
                disabled={submitting === order.id}
                onClick={() => handleSubmitReview(order.id)}
                className={`mt-3 w-full py-2 rounded text-white ${
                  submitting === order.id
                    ? "bg-gray-400"
                    : "bg-orange-500 hover:bg-orange-600"
                }`}
              >
                {submitting === order.id
                  ? t.submitting || "Đang gửi..."
                  : t.submit_review || "Gửi đánh giá"}
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
