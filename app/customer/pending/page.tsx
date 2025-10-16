"use client";
import { useEffect, useState } from "react";

export default function PendingOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();

      // ✅ Lọc theo trạng thái tiếng Việt
      const filtered = data.filter((o: any) => o.status === "Chờ xác nhận");
      setOrders(filtered);
    } catch (error) {
      console.error("❌ Lỗi tải đơn hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="text-center mt-6">⏳ Đang tải đơn hàng...</p>;

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">
        ⏳ Đơn hàng chờ xác nhận
      </h1>

      {orders.length === 0 ? (
        <p className="text-center text-gray-500">
          Không có đơn hàng nào đang chờ xác nhận.
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border p-4 rounded bg-white shadow hover:shadow-md transition"
            >
              <h2 className="font-semibold">🧾 Mã đơn: #{order.id}</h2>
              <p>👤 Người mua: {order.buyer || "guest"}</p>
              <p>💰 Tổng tiền: {order.total} Pi</p>
              <p>📅 Ngày tạo: {order.createdAt}</p>

              <ul className="mt-2 text-sm">
                {order.items?.map((item: any, i: number) => (
                  <li key={i}>
                    • {item.name} — {item.price} Pi × {item.quantity || 1}
                  </li>
                ))}
              </ul>

              <p className="mt-2 text-yellow-600 font-medium">
                Đơn hàng đang chờ người bán xác nhận.
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
