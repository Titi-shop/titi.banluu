"use client";
import { useEffect, useState } from "react";

export default function ReviewPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const res = await fetch("/api/orders");
    const data = await res.json();
    const completed = data.filter((o: any) => o.status === "Hoàn tất" && !o.reviewed);
    setOrders(completed);
    setLoading(false);
  };

  const handleReview = async (orderId: number) => {
    const rating = prompt("Đánh giá (1-5 sao):", "5");
    const comment = prompt("Nhận xét của bạn:", "Hàng rất tốt!");
    if (!rating || !comment) return;

    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, rating: Number(rating), comment }),
    });

    alert("✅ Đã gửi đánh giá!");
    fetchOrders();
  };

  if (loading) return <p className="text-center mt-6">⏳ Đang tải...</p>;

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">⭐ Đánh giá đơn hàng</h1>

      {orders.length === 0 ? (
        <p className="text-center text-gray-500">Không có đơn hàng nào cần đánh giá.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border p-4 rounded bg-white shadow">
              <h2 className="font-semibold">🧾 Mã đơn: #{order.id}</h2>
              <p>💰 Tổng tiền: {order.total} Pi</p>
              <button
                onClick={() => handleReview(order.id)}
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
              >
                ✍️ Đánh giá đơn này
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
