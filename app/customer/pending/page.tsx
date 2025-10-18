"use client";

import { useEffect, useState } from "react";

/**
 * Trang hiển thị các đơn hàng "Chờ xác nhận" của khách hàng
 */
export default function PendingOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string>("");

  // ✅ Lấy username từ localStorage
  useEffect(() => {
    try {
      const info = localStorage.getItem("user_info");
      if (info) {
        const parsed = JSON.parse(info);
        setUsername(parsed.username || "");
      }
    } catch {
      setUsername("");
    }
  }, []);

  // ✅ Chỉ fetch đơn hàng khi đã có username
  useEffect(() => {
    if (!username) return;

    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        if (!res.ok) throw new Error("Không thể tải đơn hàng");
        const data = await res.json();

        // Lọc theo người dùng & trạng thái
        const filtered = data.filter(
          (o: any) =>
            o.status === "Chờ xác nhận" &&
            o.buyer?.toLowerCase() === username.toLowerCase()
        );

        setOrders(filtered);
      } catch (err) {
        console.error("❌ Lỗi tải đơn:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [username]);

  // 🕒 Loading state
  if (loading)
    return (
      <p className="text-center mt-6 text-gray-500">
        ⏳ Đang tải đơn hàng...
      </p>
    );

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
            <div
              key={order.id}
              className="border p-4 rounded bg-white shadow hover:shadow-md transition"
            >
              <h2 className="font-semibold text-lg">
                🧾 Mã đơn: #{order.id}
              </h2>
              <p>💰 Tổng tiền: {order.total} Pi</p>
              <p>
                📅 Ngày tạo:{" "}
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleString()
                  : "Không xác định"}
              </p>
              <ul className="list-disc ml-6 mt-2 text-gray-700">
                {order.items?.map((item: any, i: number) => (
                  <li key={i}>
                    {item.name} — {item.price} Pi × {item.quantity || 1}
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
