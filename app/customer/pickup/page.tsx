"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../../../context/LanguageContext"; // ✅ import context

export default function PickupOrdersPage() {
  const { translate: t, language } = useLanguage(); // ✅ hook ngôn ngữ
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [language]); // ✅ refetch nếu đổi ngôn ngữ

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();

      // ✅ Lọc các đơn hàng theo trạng thái có thể dịch
      const filterByLang = {
        vi: ["Đang giao", "Chờ lấy hàng"],
        en: ["Delivering", "Waiting for pickup"],
        zh: ["配送中", "等待取货"],
      }[language];

      const filtered = data.filter((o: any) => filterByLang.includes(o.status));
      setOrders(filtered);
    } catch (error) {
      console.error("❌ Lỗi tải đơn hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <p className="text-center mt-6">
        ⏳ {t("loading") || "Đang tải đơn hàng..."}
      </p>
    );

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center text-orange-600">
        🚚{" "}
        {language === "vi"
          ? "Đơn hàng đang giao / chờ lấy hàng"
          : language === "en"
          ? "Orders being delivered / waiting for pickup"
          : "配送中 / 等待取货 的订单"}
      </h1>

      {orders.length === 0 ? (
        <p className="text-center text-gray-500">
          {language === "vi"
            ? "Bạn chưa có đơn hàng nào đang giao hoặc chờ lấy."
            : language === "en"
            ? "You have no orders currently delivering or waiting for pickup."
            : "您当前没有正在配送或等待取货的订单。"}
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border p-4 rounded bg-white shadow hover:shadow-md transition"
            >
              <h2 className="font-semibold">🧾 {t("my_orders")}: #{order.id}</h2>
              <p>
                💰 {t("product_price")}: {order.total} Pi
              </p>
              <p>
                🚚 {t("update_status")}: {order.status}
              </p>

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
