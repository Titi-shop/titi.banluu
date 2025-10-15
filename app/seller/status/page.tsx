"use client";
import { useEffect, useState } from "react";

export default function SellerStatusPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("❌ Lỗi tải đơn:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <p className="text-center mt-6 text-gray-500">⏳ Đang tải dữ liệu...</p>;

  // Đếm số lượng từng loại trạng thái
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
        <div className="bg-yellow-100 text-yellow-800 rounded-xl p-5 text-center shadow">
          <h2 className="text-3xl font-bold">{stats.pending}</h2>
          <p className="mt-1 font-medium">Chờ xác nhận</p>
        </div>
        <div className="bg-blue-100 text-blue-800 rounded-xl p-5 text-center shadow">
          <h2 className="text-3xl font-bold">{stats.delivering}</h2>
          <p className="mt-1 font-medium">Đang giao</p>
        </div>
        <div className="bg-green-100 text-green-800 rounded-xl p-5 text-center shadow">
          <h2 className="text-3xl font-bold">{stats.completed}</h2>
          <p className="mt-1 font-medium">Hoàn tất</p>
        </div>
        <div className="bg-red-100 text-red-800 rounded-xl p-5 text-center shadow">
          <h2 className="text-3xl font-bold">{stats.canceled}</h2>
          <p className="mt-1 font-medium">Đã huỷ</p>
        </div>
      </div>

      <div className="mt-8 text-gray-600 text-center">
        <p>Tổng số đơn: {orders.length}</p>
      </div>
    </main>
  );
}
