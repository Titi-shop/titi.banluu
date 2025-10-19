"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext"; // ✅ đường dẫn chính xác

export default function ReviewPage() {
  const { translate, language } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [language]); // ✅ reload khi đổi ngôn ngữ

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();

      // ✅ Lọc các đơn hoàn tất chưa đánh giá
      const completed = data.filter(
        (o: any) => o.status === "Hoàn tất" && !o.reviewed
      );
      setOrders(completed);
    } catch (error) {
      console.error("❌ Lỗi tải đơn hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (orderId: number) => {
    const rating = prompt(translate("enter_rating") || "Đánh giá (1-5 sao):", "5");
    const comment = prompt(translate("enter_comment") || "Nhận xét của bạn:", "");
    if (!rating || !comment) return;

    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, rating: Number(rating), comment }),
    });

    alert(translate("review_sent") || "✅ Đã gửi đánh giá!");
    fetchOrders();
  };

  if (loading)
    return <p className="text-center mt-6">{translate("loading") || "⏳ Đang tải..."}</p>;

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center text-yellow-600">
        ⭐ {translate("review_title") || "Đánh giá đơn hàng"}
      </h1>

      {orders.length === 0 ? (
        <p className="text-center text-gray-500">
          {translate("no_reviews") || "Không có đơn hàng nào cần đánh giá."}
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border p-4 rounded bg-white shadow hover:shadow-md transition"
            >
              <h2 className="font-semibold">🧾 {translate("order_code") || "Mã đơn"}: #{order.id}</h2>
              <p>💰 {translate("total_amount") || "Tổng tiền"}: {order.total} Pi</p>
              <button
                onClick={() => handleReview(order.id)}
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
              >
                ✍️ {translate("review_this_order") || "Đánh giá đơn này"}
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
