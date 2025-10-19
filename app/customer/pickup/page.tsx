"use client";
import { useLanguage } from "../context/LanguageContext";
import { useEffect, useState } from "react";

export default function PickupOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();

      // ✅ Lọc các đơn "Đang giao" hoặc "Chờ lấy hàng"
      const filtered = data.filter(
        (o: any) => o.status === "Đang giao" || o.status === "Chờ lấy hàng"
      );
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
        🚚 Đơn hàng đang giao / chờ lấy hàng
      </h1>

      {orders.length === 0 ? (
        <p className="text-center text-gray-500">
          Bạn chưa có đơn hàng nào đang giao hoặc chờ lấy.
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border p-4 rounded bg-white shadow hover:shadow-md transition"
            >
              <h2 className="font-semibold">🧾 Mã đơn: #{order.id}</h2>
              <p>💰 Tổng tiền: {order.total} Pi</p>
              <p>🚚 Trạng thái: {order.status}</p>

              <ul className="mt-2 text-sm">
                {order.items?.map((item: any, i: number) => (
                  <li key={i}>
                    • {item.name} — {item.price} Pi × {item.quantity || 1}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
