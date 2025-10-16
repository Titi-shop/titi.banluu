"use client";

import { useEffect, useState } from "react";

interface Order {
  id: number;
  status: string;
}

export default function SellerStatusPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data: Order[] = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("❌ Lỗi tải đơn:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <p className="text-center mt-6 text-gray-500">⏳ Đang tải dữ liệu...</p>;

  const stats = {
    pending: orders.filter((o) => o.status === "Chờ xác nhận").length,
    delivering: orders.filter((o) => o.status === "Đang giao").length,
    completed: orders.filter((o) => o.status === "Hoàn tất").length,
    canceled: orders.filter((o) => o.status === "Đã huỷ").length,
  };

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-5">📦 Trạng thái đơn hàng</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <StatusCard color="yellow" value={stats.pending} label="Chờ xác nhận" />
        <StatusCard color="blue" value={stats.delivering} label="Đang giao" />
        <StatusCard color="green" value={stats.completed} label="Hoàn tất" />
        <StatusCard color="red" value={stats.canceled} label="Đã huỷ" />
      </div>

      <div className="mt-8 text-gray-600 text-center">
        <p>Tổng số đơn: {orders.length}</p>
      </div>
    </main>
  );
}

function StatusCard({
  color,
  value,
  label,
}: {
  color: string;
  value: number;
  label: string;
}) {
  return (
    <div className={`bg-${color}-100 text-${color}-800 rounded-xl p-5 text-center shadow`}>
      <h2 className="text-3xl font-bold">{value}</h2>
      <p className="mt-1 font-medium">{label}</p>
    </div>
  );
}
