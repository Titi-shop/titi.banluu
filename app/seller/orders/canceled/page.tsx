"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type OrderType = {
  orderId: string;
  total: number;
  status: string;
  createdAt: string;
};

export default function CancelledOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch(
        "/api/seller/orders?status=Đã hủy",
        {
          cache: "no-store",
          credentials: "include",
        }
      );

      if (!res.ok) {
        throw new Error("Không thể tải dữ liệu");
      }

      const data = await res.json();
      setOrders(data || []);
    } catch (err) {
      console.error(err);
      alert("❌ Lỗi tải đơn hàng đã hủy");
    } finally {
      setLoading(false);
    }
  };

  const totalPi = orders.reduce(
    (sum, o) => sum + (Number(o.total) || 0),
    0
  );

  if (loading) {
    return (
      <p className="text-center mt-10 text-gray-500">
        ⏳ Đang tải...
      </p>
    );
  }

  return (
    <main className="min-h-screen max-w-4xl mx-auto p-4 pb-24 bg-gray-50">
      <div className="flex items-center mb-4">
        <button
          onClick={() => router.back()}
          className="text-orange-500 font-semibold text-lg mr-2"
        >
          ←
        </button>
        <h1 className="text-xl font-semibold text-gray-800">
          ❌ Đơn hàng đã hủy
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card text-center">
          <p className="text-gray-500 text-sm">Tổng đơn</p>
          <p className="text-xl font-bold">{orders.length}</p>
        </div>
        <div className="card text-center">
          <p className="text-gray-500 text-sm">Tổng Pi</p>
          <p className="text-xl font-bold">
            {totalPi.toFixed(2)} Pi
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <p className="text-center text-gray-500">
          Không có đơn đã hủy.
        </p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div
              key={o.orderId}
              className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
            >
              <p>🧾 <b>Mã đơn:</b> #{o.orderId}</p>
              <p>💰 <b>Tổng:</b> {o.total.toFixed(2)} Pi</p>
              <p>📅 <b>Trạng thái:</b> {o.status}</p>
            </div>
          ))}
        </div>
      )}

      <div className="h-20"></div>
    </main>
  );
}
