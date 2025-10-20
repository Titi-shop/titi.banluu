"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  buyer: string;
  createdAt: string;
  total: number;
  status: string;
  items: OrderItem[];
}

export default function SellerOrdersPage() {
  const { translate } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(data);
      setLoading(false);
    };
    fetchOrders();
  }, []);

  const filteredOrders =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const tabs = [
    { key: "all", label: translate("all") || "Tất cả" },
    { key: "pending", label: translate("pending") || "Chờ xử lý" },
    { key: "shipping", label: translate("shipping") || "Đang giao" },
    { key: "completed", label: translate("completed") || "Hoàn tất" },
    { key: "cancelled", label: translate("cancelled") || "Đã hủy" },
  ];

  return (
    <main className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-4 text-blue-600">
        📦 {translate("order_manager_title") || "Quản lý đơn hàng"}
      </h1>

      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1 rounded border ${
              filter === tab.key
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-gray-500">
          {translate("loading_orders") || "Đang tải đơn hàng..."}
        </p>
      ) : filteredOrders.length === 0 ? (
        <p className="text-center text-gray-500">
          {translate("no_orders") || "Không có đơn hàng nào."}
        </p>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="border rounded-lg bg-white shadow p-3"
            >
              <p>
                🧾 <b>{translate("order_id") || "Mã đơn"}:</b> #{order.id}
              </p>
              <p>👤 {translate("buyer") || "Người mua"}: {order.buyer}</p>
              <p>🕒 {translate("created_at") || "Thời gian tạo"}: {order.createdAt}</p>
              <p>💰 {translate("total_amount") || "Tổng tiền"}: {order.total} Pi</p>
              <p>🧺 {translate("items") || "Sản phẩm"}:</p>
              <ul className="ml-6 list-disc">
                {order.items.map((it, i) => (
                  <li key={i}>
                    {it.name} — {it.price} Pi × {it.quantity}
                  </li>
                ))}
              </ul>

              <div className="text-right mt-2">
                <span
                  className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                    order.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : order.status === "shipping"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {translate(order.status) || order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
