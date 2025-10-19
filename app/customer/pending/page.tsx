"use client";

import { useEffect, useState } from "react";

export default function PendingOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    const info = localStorage.getItem("user_info");
    if (info) {
      const parsed = JSON.parse(info);
      setUsername(parsed.username);
    }
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      const currentUser = parsedUser();
      const filtered = data.filter(
        (o: any) => o.status === "Chờ xác nhận" && o.buyer === currentUser
      );
      setOrders(filtered);
    } catch (err) {
      console.error("❌ Lỗi tải đơn:", err);
    } finally {
      setLoading(false);
    }
  };

  const parsedUser = () => {
    try {
      const info = localStorage.getItem("user_info");
      if (!info) return "";
      return JSON.parse(info).username;
    } catch {
      return "";
    }
  };

  if (loading) return <p className="text-center mt-6">⏳ Đang tải...</p>;

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center text-yellow-600">
        ⏳ Đơn hàng đang chờ xác nhận
      </h1>

      {orders.length === 0 ? (
        <p className="text-center text-gray-500">
          Hiện bạn chưa có đơn hàng nào đang chờ xác nhận.
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border p-4 rounded bg-white shadow">
              <h2 className="font-semibold">🧾 Mã đơn: #{order.id}</h2>
              <p>💰 Tổng tiền: {order.total} Pi</p>
              <p>📅 Ngày tạo: {new Date(order.createdAt).toLocaleString()}</p>
              <ul className="list-disc ml-6 mt-2">
                {order.items.map((item: any, i: number) => (
                  <li key={i}>
                    {item.name} — {item.price} Pi × {item.quantity}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-yellow-600 font-medium">
                Trạng thái: {order.status}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
