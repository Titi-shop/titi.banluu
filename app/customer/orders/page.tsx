"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function OrdersContent() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useSearchParams();
  const statusParam = params.get("status"); // "cho-xac-nhan" | "cho-lay-hang" ...
  const mapStatus: Record<string, string> = {
    "cho-xac-nhan": "Chờ xác nhận",
    "cho-lay-hang": "Đang giao",
    "cho-giao-hang": "Đang giao",
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
        console.error("Lỗi khi tải đơn hàng:", err);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [statusParam]);

  if (loading) return <p className="p-6 text-center">⏳ Đang tải...</p>;
  if (!orders.length) return <p className="p-6 text-center">❗ Không có đơn hàng nào.</p>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold mb-4">📦 Đơn hàng của bạn</h1>
      {orders.map((o) => (
        <div key={o.id} className="border rounded p-4 bg-white shadow">
          <p><b>Mã đơn:</b> {o.id}</p>
          <p><b>Trạng thái:</b> {o.status}</p>
          <p><b>Tổng:</b> {o.total} Pi</p>
          <ul className="ml-5 list-disc">
            {o.items.map((it: any, i: number) => (
              <li key={i}>{it.name} - {it.price} Pi</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ✅ Bọc trong Suspense để build không lỗi
export default function CustomerOrdersPage() {
  return (
    <Suspense fallback={<p className="p-6 text-center">⏳ Đang tải đơn hàng...</p>}>
      <OrdersContent />
    </Suspense>
  );
}
