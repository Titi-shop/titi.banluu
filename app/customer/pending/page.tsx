"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";

export default function PendingOrdersPage() {
  const { translate } = useLanguage(); // ✅ dùng translate cho đa ngôn ngữ
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Lấy username an toàn từ localStorage
  const getCurrentUser = (): string => {
    try {
      const info = localStorage.getItem("user_info");
      if (!info) return "";
      return JSON.parse(info).username || "";
    } catch {
      return "";
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders");
        const data = await res.json();
        const currentUser = getCurrentUser();
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

    fetchOrders();
  }, []);

  if (loading)
    return (
      <p className="text-center mt-6 text-gray-500">
        ⏳ {translate("loading")}
      </p>
    );

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center text-yellow-600">
        ⏳ {translate("waiting_confirm")}
      </h1>

      {orders.length === 0 ? (
        <p className="text-center text-gray-500">
          {translate("no_products")}
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border p-4 rounded bg-white shadow hover:shadow-lg transition"
            >
              <h2 className="font-semibold">
                🧾 Mã đơn: #{order.id}
              </h2>
              <p>💰 Tổng tiền: {order.total} Pi</p>
              <p>📅 Ngày tạo: {new Date(order.createdAt).toLocaleString()}</p>
              <ul className="list-disc ml-6 mt-2">
                {order.items?.map((item: any, i: number) => (
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
