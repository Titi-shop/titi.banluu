"use client";
import { useEffect, useState } from "react";

export default function UnpaidOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const info = localStorage.getItem("pi_user");
    if (info) {
      const parsed = JSON.parse(info);
      setUser(parsed?.user?.username || parsed?.username || "");
    }
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      const res = await fetch("/api/orders");
      const all = await res.json();
      const filtered = all.filter(
        (o) =>
          o.buyer?.toLowerCase() === user.toLowerCase() &&
          ["Chưa thanh toán", "pending"].includes(o.status)
      );
      setOrders(filtered);
      setLoading(false);
    };
    if (user) fetchOrders();
  }, [user]);

  const repay = async (order) => {
    alert(`🔄 Thanh toán lại đơn ${order.id}`);
    // gọi SDK tạo payment lại
    const payment = {
      amount: order.total,
      memo: `Thanh toán lại đơn #${order.id}`,
      metadata: { orderId: order.id },
    };
    window.Pi.createPayment(payment, {
      onReadyForServerApproval: async (pid) =>
        await fetch("/api/pi/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId: pid }),
        }),
      onReadyForServerCompletion: async (pid, txid) =>
        await fetch("/api/pi/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId: pid, txid }),
        }),
    });
  };

  const cancelOrder = async (id) => {
    if (!confirm(`Bạn có chắc muốn hủy đơn #${id}?`)) return;
    await fetch(`/api/orders/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    alert("✅ Đã hủy đơn!");
    location.reload();
  };

  if (loading) return <p>Đang tải...</p>;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold text-red-600 mb-4">
        🔴 Đơn chưa thanh toán
      </h1>
      {orders.length === 0 ? (
        <p>Không có đơn chưa thanh toán</p>
      ) : (
        orders.map((o) => (
          <div key={o.id} className="p-4 border rounded mb-3 bg-white shadow">
            <h2>🧾 Đơn #{o.id}</h2>
            <p>💰 Tổng: {o.total} Pi</p>
            <p>📅 Ngày tạo: {new Date(o.createdAt).toLocaleString()}</p>
            <div className="mt-3 space-x-2">
              <button
                onClick={() => repay(o)}
                className="bg-green-500 text-white px-3 py-1 rounded"
              >
                💳 Thanh toán lại
              </button>
              <button
                onClick={() => cancelOrder(o.id)}
                className="bg-gray-500 text-white px-3 py-1 rounded"
              >
                ❌ Hủy đơn
              </button>
            </div>
          </div>
        ))
      )}
    </main>
  );
}
