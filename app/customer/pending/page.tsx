"use client";

import { useEffect, useState } from "react";

export default function PendingOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  // 🧩 Lấy username từ localStorage (nếu có)
  useEffect(() => {
    const info = localStorage.getItem("user_info");
    if (info) {
      try {
        const parsed = JSON.parse(info);
        setUsername(parsed.username || "");
      } catch {
        setUsername("");
      }
    } else {
      setUsername("");
    }
  }, []);

  // 🧩 Gọi API lấy đơn hàng (sau khi có username)
  useEffect(() => {
    // Nếu username là null -> vẫn đang load user_info
    if (username === null) return;

    // Nếu username rỗng -> người dùng chưa đăng nhập
    if (username === "") {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        if (!res.ok) throw new Error("Không thể tải đơn hàng");
        const data = await res.json();

        // 🔍 Lọc các đơn hàng đúng người mua và đúng trạng thái
        const filtered = data.filter(
          (o: any) =>
            o.status === "Chờ xác nhận" &&
            o.buyer?.toLowerCase() === username.toLowerCase()
        );

        setOrders(filtered);
      } catch (err) {
        console.error("❌ Lỗi tải đơn hàng:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [username]);

  // 🕒 Đang tải
  if (loading)
    return (
      <p className="text-center mt-6 text-gray-500">
        ⏳ Đang tải đơn hàng...
      </p>
    );

  // ⚠️ Nếu chưa đăng nhập
  if (username === "") {
    return (
      <main className="p-6 text-center text-red-600">
        <p className="text-lg font-medium">
          ⚠️ Không xác định được tài khoản, vui lòng đăng nhập lại.
        </p>
        <a
          href="/account"
          className="mt-4 inline-block px-4 py-2 bg-yellow-500 text-white rounded"
        >
          🔐 Đăng nhập
        </a>
      </main>
    );
  }

  // ✅ Nếu có username và đã load xong đơn
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
                🧾 Mã đơn: <span className="text-gray-700">#{order.id}</span>
              </h2>

              <p className="text-gray-600">💰 Tổng tiền: {order.total} Pi</p>
              <p className="text-gray-600">
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
