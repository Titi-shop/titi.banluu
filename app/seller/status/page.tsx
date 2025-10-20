"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";

interface Order {
  id: string;
  code: string;
  buyer: string;
  total: number;
  status: string;
  createdAt: string;
}

export default function SellerStatusPage() {
  const { translate } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // 🔄 Lấy danh sách đơn hàng
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders");
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error(err);
        setMessage(translate("update_error") || "Lỗi tải đơn hàng.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [translate]);

  // ✅ Cập nhật trạng thái đơn hàng
  const handleMarkDone = async (id: string) => {
    const confirm = window.confirm(
      translate("confirm_done") || "Xác nhận hoàn tất đơn này?"
    );
    if (!confirm) return;

    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });

      if (!res.ok) throw new Error("Update failed");

      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: "completed" } : o))
      );
      setMessage(translate("order_completed") || "✅ Đơn hàng đã hoàn tất!");
    } catch (err) {
      console.error(err);
      setMessage(translate("update_error") || "Có lỗi khi cập nhật đơn hàng!");
    }
  };

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-4">
        ⚙️ {translate("update_status") || "Cập nhật trạng thái đơn hàng"}
      </h1>

      {message && (
        <p
          className={`text-center mb-3 font-medium ${
            message.includes("✅")
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}

      {loading ? (
        <p className="text-center text-gray-500">
          {translate("loading_orders") || "Đang tải đơn hàng..."}
        </p>
      ) : orders.length === 0 ? (
        <p className="text-center text-gray-500">
          {translate("no_orders") || "Không có đơn hàng nào."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg shadow">
            <thead className="bg-yellow-500 text-white">
              <tr>
                <th className="p-2 text-left">{translate("order_code")}</th>
                <th className="p-2 text-left">{translate("buyer")}</th>
                <th className="p-2 text-left">{translate("total")}</th>
                <th className="p-2 text-left">{translate("status")}</th>
                <th className="p-2 text-center">{translate("update_status")}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b">
                  <td className="p-2">{order.code}</td>
                  <td className="p-2">{order.buyer}</td>
                  <td className="p-2">{order.total.toLocaleString()} Pi</td>
                  <td className="p-2 capitalize">
                    {translate(order.status) || order.status}
                  </td>
                  <td className="p-2 text-center">
                    {order.status !== "completed" ? (
                      <button
                        onClick={() => handleMarkDone(order.id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                      >
                        {translate("mark_done") || "Hoàn tất đơn"}
                      </button>
                    ) : (
                      <span className="text-green-600 font-medium">
                        {translate("completed_status") || "Hoàn tất"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
