"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

interface Order {
  id: number;
  buyer: string;
  total: number;
  status: string;
  reviewed?: boolean;
  createdAt: string;
  items?: any[];
}

export default function ReviewPage() {
  const router = useRouter();
  const { translate } = useLanguage();
  const { user, piReady } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState<{ [key: number]: number }>({});
  const [comments, setComments] = useState<{ [key: number]: string }>({});
  const [submitting, setSubmitting] = useState<number | null>(null);

  // ✅ Lấy danh sách đơn hàng hoàn tất để đánh giá
  useEffect(() => {
    if (!piReady) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        if (!res.ok) throw new Error("Không thể tải đơn hàng.");
        const data = await res.json();

        const completed = data.filter(
          (o: any) =>
            o.status === "Hoàn tất" &&
            !o.reviewed &&
            o.buyer?.toLowerCase() === user.username.toLowerCase()
        );
        setOrders(completed);
      } catch (err) {
        console.error("❌ Lỗi tải đơn hàng:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [piReady, user]);

  // ✅ Gửi đánh giá
  const handleSubmitReview = async (orderId: number) => {
    const rating = selectedRating[orderId];
    const comment = comments[orderId]?.trim() || "";

    if (!rating) {
      alert("Vui lòng chọn số sao trước khi gửi đánh giá!");
      return;
    }

    setSubmitting(orderId);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          rating,
          comment,
          username: user?.username,
        }),
      });

      const data = await res.json();
      if (!data.success && !data.ok) throw new Error(data.error || "Gửi đánh giá thất bại");

      alert("✅ Cảm ơn bạn đã đánh giá!");
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err: any) {
      alert("❌ " + err.message);
    } finally {
      setSubmitting(null);
    }
  };

  if (!piReady || loading)
    return (
      <main className="flex items-center justify-center min-h-screen text-gray-500">
        ⏳ Đang tải đơn hàng...
      </main>
    );

  if (!user)
    return (
      <main className="text-center py-10 text-gray-600">
        🔐 Vui lòng đăng nhập bằng Pi Network để xem và đánh giá đơn hàng.
      </main>
    );

  return (
    <main className="p-4 max-w-4xl mx-auto bg-gray-50 min-h-screen pb-24">
      {/* ===== Nút quay lại + Tiêu đề ===== */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => router.back()}
          className="text-orange-500 font-semibold text-lg mr-2"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold text-yellow-600 flex items-center gap-2">
          ⭐ Đánh giá đơn hàng
        </h1>
      </div>

      {/* ===== Nội dung chính ===== */}
      {!orders.length ? (
        <p className="text-center text-gray-500">
          Không có đơn hàng nào cần đánh giá.
          <br />
          👤 Người dùng: <b>{user.username}</b>
        </p>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border rounded-lg bg-white p-4 shadow hover:shadow-md transition"
            >
              <div className="flex justify-between items-center">
                <h2 className="font-semibold text-lg">🧾 Mã đơn: #{order.id}</h2>
                <span className="text-gray-500 text-sm">
                  {new Date(order.createdAt).toLocaleString()}
                </span>
              </div>

              <p className="mt-1 text-gray-700">
                💰 Tổng tiền: <b>{order.total} Pi</b>
              </p>

              {/* ⭐⭐⭐⭐⭐ Đánh giá sao */}
              <div className="mt-3 flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() =>
                      setSelectedRating((prev) => ({ ...prev, [order.id]: star }))
                    }
                    className={`text-3xl transition ${
                      selectedRating[order.id] >= star
                        ? "text-yellow-400"
                        : "text-gray-300"
                    } hover:text-yellow-400`}
                  >
                    ★
                  </button>
                ))}
              </div>

              {/* Nhận xét */}
              <textarea
                placeholder="Nhận xét của bạn (tùy chọn)"
                value={comments[order.id] || ""}
                onChange={(e) =>
                  setComments((prev) => ({ ...prev, [order.id]: e.target.value }))
                }
                className="w-full border rounded p-2 mt-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                rows={2}
              />

              <button
                onClick={() => handleSubmitReview(order.id)}
                disabled={submitting === order.id}
                className={`mt-3 px-4 py-2 rounded text-white ${
                  submitting === order.id
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {submitting === order.id ? "⏳ Đang gửi..." : "📩 Gửi đánh giá"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ===== Đệm chống che phần chân ===== */}
      <div className="h-20"></div>
    </main>
  );
}
