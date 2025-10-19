"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext"; // ✅ dùng ngôn ngữ đồng bộ

export default function CustomerOrdersPage() {
  const { translate } = useLanguage();
  return (
    <Suspense fallback={<p className="p-6 text-center">{translate("loading_orders") || "⏳ Đang tải đơn hàng..."}</p>}>
      <OrdersWrapper />
    </Suspense>
  );
}

// ✅ Bọc lại component chính bên ngoài Suspense
function OrdersWrapper() {
  const params = useSearchParams();
  const statusParam = params?.get("status") ?? null;
  return <OrdersContent statusParam={statusParam} />;
}

function OrdersContent({ statusParam }: { statusParam: string | null }) {
  const { translate, language } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Map trạng thái nội bộ tương ứng ngôn ngữ hiện tại
  const mapStatus: Record<string, string> = {
    "cho-xac-nhan": translate("waiting_confirm") || "Chờ xác nhận",
    "cho-lay-hang": translate("waiting_pickup") || "Chờ lấy hàng",
    "cho-giao-hang": translate("delivering") || "Đang giao",
    "danh-gia": "Hoàn tất",
  };

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const res = await fetch("/api/orders");
        const data = await res.json();
        const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");
        const buyer = userInfo.username || "guest_user";

        const filtered = data.filter(
          (o: any) =>
            o.buyer === buyer &&
            (statusParam ? o.status === mapStatus[statusParam] : true)
        );

        setOrders(filtered);
      } catch (err) {
        console.error("❌ Lỗi khi tải đơn hàng:", err);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [statusParam, language]); // ✅ reload khi đổi ngôn ngữ

  if (loading) return <p className="p-6 text-center">{translate("loading") || "⏳ Đang tải..."}</p>;
  if (!orders.length)
    return <p className="p-6 text-center text-gray-500">{translate("no_orders") || "❗ Không có đơn hàng nào."}</p>;

  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-orange-600 text-center">
        📦 {translate("my_orders") || "Đơn hàng của bạn"}
      </h1>
      {orders.map((o) => (
        <div key={o.id} className="border rounded p-4 bg-white shadow hover:shadow-md transition">
          <p><b>{translate("order_code") || "Mã đơn"}:</b> {o.id}</p>
          <p><b>{translate("status") || "Trạng thái"}:</b> {o.status}</p>
          <p><b>{translate("total_amount") || "Tổng tiền"}:</b> {o.total} Pi</p>
          <ul className="ml-5 list-disc">
            {o.items.map((it: any, i: number) => (
              <li key={i}>{it.name} — {it.price} Pi × {it.quantity || 1}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
