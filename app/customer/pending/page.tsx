"use client";

import { useEffect, useState } from "react";

/**
 * Trang hiển thị các đơn hàng "Chờ xác nhận" của khách hàng.
 * Lấy dữ liệu từ API /api/orders (lưu trong Vercel Blob)
 */
export default function PendingOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string>("");

  // ✅ 1. Lấy username từ localStorage (được lưu sau khi checkout)
  useEffect(() => {
    try {
      const info = localStorage.getItem("user_info");
      if (info) {
        const parsed = JSON.parse(info);
        if (parsed?.username) {
          setUsername(parsed.username);
          console.log("✅ Đã tìm thấy username:", parsed.username);
        } else {
          setUsername("");
        }
      } else {
        setUsername("");
      }
    } catch (err) {
      console.error("❌ Lỗi đọc user_info:", err);
      setUsername("");
    }
  }, []);

  // ✅ 2. Gọi API để lấy danh sách đơn hàng
  useEffect(() => {
    if (!username) return; // chưa có username thì không gọi
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        if (!res.ok) throw new Error("Không thể tải đơn hàng từ API");

        const data = await res.json();

        // ✅ Lọc các đơn của người dùng hiện tại có trạng thái “Chờ xác nhận”
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

  // ✅ 3. Khi chưa đăng nhập
  if (!username) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <p className="text-red-600 font-semibold text-center mb-4">
          ⚠️ Không xác định được tài khoản, vui lòng đăng nhập lại.
        </p>
        <button
          onClick={() => {
            localStorage.removeItem("user_info");
            window.location.href = "/login";
          }}
          className="px-6 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition"
        >
          🔐 Đăng nhập
        </button>
      </main>
    );
  }

  // ✅ 4. Hiển thị trạng thái tải dữ liệu
  if (loading)
    return (
      <p className="text-center text-gray-500 mt-6">
        ⏳ Đang tải đơn hàng...
      </p>
    );

  // ✅ 5. Giao diện danh sách đơn hàng
  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center text-yellow-600">
        🧾 Đơn hàng đang chờ xác nhận
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
              className="border border-gray-200 p-4 rounded-lg bg-white shadow hover:shadow-md transition"
            >
              <h2 className="font-semibold text-lg mb-2">
                🧾 Mã đơn: <span className="text-gray-700">#{order.id}</span>
              </h2>
              <p className="text-gray-700 mb-1">💰 Tổng tiền: {order.total} Pi</p>
              <p className="text-gray-600 mb-1">
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
                ⏳ Trạng thái: {order.status}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
