"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  buyer: string;
  total: number;
  status: string;
  note?: string;
  createdAt: string;
  items: OrderItem[];
}

export default function PendingOrdersPage() {
  const { translate } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<string>("");

  // ✅ Lấy username hiện tại từ localStorage (đúng key "pi_user")
  useEffect(() => {
    try {
      const info = localStorage.getItem("pi_user");
      if (!info) {
        console.warn("⚠️ Không tìm thấy dữ liệu người dùng (pi_user)");
        return;
      }

      const parsed = JSON.parse(info);
      const username = parsed?.user?.username || parsed?.username || "guest";
      setCurrentUser(username);
    } catch (err) {
      console.error("❌ Lỗi đọc pi_user:", err);
    }
  }, []);

  // 🧩 Tải danh sách đơn hàng "Chờ xác nhận" từ API
  useEffect(() => {
    const fetchOrders = async () => {
      if (!currentUser) {
        console.warn("⚠️ Chưa đăng nhập — không thể tải đơn hàng.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch("/api/orders", { method: "GET", cache: "no-store" });
        if (!res.ok) throw new Error("Không thể tải dữ liệu đơn hàng.");

        const data: Order[] = await res.json();
        if (!Array.isArray(data)) throw new Error("Dữ liệu đơn hàng không hợp lệ.");

        // ✅ Lọc đơn của người dùng hiện tại và trạng thái "chờ xác nhận"
        const filtered = data.filter(
          (o) =>
            o.buyer?.toLowerCase() === currentUser.toLowerCase() &&
            ["Chờ xác nhận", "pending", "wait"].includes(o.status)
        );

        setOrders(filtered);
      } catch (err: any) {
        console.error("❌ Lỗi tải đơn hàng:", err);
        setError(err.message || "Không thể tải danh sách đơn hàng.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentUser]);

  // 🕓 Loading
  if (loading)
    return (
      <p className="text-center mt-10 text-gray-500">
        ⏳ {translate("loading") || "Đang tải đơn hàng..."}
      </p>
    );

  // ⚠️ Lỗi
  if (error)
    return (
      <p className="text-center mt-10 text-red-500">
        ❌ {error}
      </p>
    );

  // 🚫 Không có đơn nào
  if (!orders.length)
    return (
      <main className="p-6 max-w-4xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-yellow-600 mb-2">
          ⏳ {translate("waiting_confirm") || "Đơn hàng đang chờ xác nhận"}
        </h1>
        <p className="text-gray-500 mb-4">
          {translate("no_products") || "Chưa có đơn hàng chờ xác nhận."}
        </p>
        <p className="text-gray-400 text-sm">
          👤 {translate("current_user") || "Người dùng hiện tại"}:{" "}
          <b>{currentUser || translate("guest") || "Chưa đăng nhập"}</b>
        </p>
      </main>
    );

  // ✅ Hiển thị danh sách đơn hàng
  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center text-yellow-600">
        ⏳ {translate("waiting_confirm") || "Đơn hàng đang chờ xác nhận"}
      </h1>

      <p className="text-center text-gray-500 mb-4">
        👤 {translate("current_user") || "Người dùng hiện tại"}:{" "}
        <b>{currentUser}</b>
      </p>

      <div className="space-y-5">
        {orders.map((order) => (
          <div
            key={order.id}
            className="border border-gray-200 rounded-lg p-4 bg-white shadow hover:shadow-lg transition"
          >
            <h2 className="font-semibold text-lg mb-1">
              🧾 {translate("order_id") || "Mã đơn"}: #{order.id}
            </h2>
            <p>💰 {translate("total_amount") || "Tổng tiền"}: <b>{order.total}</b> Pi</p>
            <p>📅 {translate("created_at") || "Ngày tạo"}: {new Date(order.createdAt).toLocaleString()}</p>

            {order.items?.length > 0 && (
              <ul className="list-disc ml-6 mt-2 text-gray-700">
                {order.items.map((item, i) => (
                  <li key={i}>
                    {item.name} — {item.price} Pi × {item.quantity}
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-3 text-yellow-600 font-medium">
              {translate("status") || "Trạng thái"}: {order.status}
            </p>

            {order.note && (
              <p className="mt-1 text-gray-500 italic text-sm">
                📝 {order.note}
              </p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
