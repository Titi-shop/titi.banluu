"use client";
import { useEffect, useState } from "react";

export default function SellerDeliveryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      const delivering = data.filter((o: any) => o.status === "Đang giao");
      setOrders(delivering);
    } catch (err) {
      console.error("❌ Lỗi tải đơn:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsDone = async (id: number) => {
    if (!confirm("Xác nhận hoàn tất đơn này?")) return;
    await fetch("/api/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "Hoàn tất" }),
    });
    alert("✅ Đơn hàng đã được đánh dấu hoàn tất!");
    fetchOrders();
  };

  if (loading)
    return <p className="text-center mt-6 text-gray-500">⏳ Đang tải đơn hàng...</p>;

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-5">🚚 Quản lý giao hàng</h1>

      {orders.length === 0 ? (
        <p className="text-center text-gray-500">Không có đơn hàng nào đang giao.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border rounded-lg p-5 shadow-md bg-white hover:shadow-lg transition"
            >
              <h2 className="font-semibold text-lg">🧾 Mã đơn: #{order.id}</h2>
              <p>👤 Người mua: {order.buyer || "guest"}</p>
              <p>💰 Tổng tiền: {order.total} Pi</p>
              <p>🕒 Ngày tạo: {new Date(order.createdAt).toLocaleString()}</p>

              <ul className="mt-2 text-sm list-disc ml-6 text-gray-700">
                {order.items?.map((item: any, idx: number) => (
                  <li key={idx}>
                    {item.name} — {item.price} Pi × {item.quantity || 1}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => markAsDone(order.id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded"
                >
                  ✅ Hoàn tất đơn
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
