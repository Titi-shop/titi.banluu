"use client";

import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const { cart, clearCart, total } = useCart();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const info = localStorage.getItem("user_info");
    if (info) {
      const parsed = JSON.parse(info);
      setUser(parsed);
    }
  }, []);

  // ✅ Hàm thanh toán bằng Pi thật (qua SDK)
  const handlePayWithPi = async () => {
    if (!window.Pi) return alert("❌ Không tìm thấy Pi SDK. Hãy mở trong Pi Browser!");
    if (cart.length === 0) return alert("🛒 Giỏ hàng trống.");

    setLoading(true);
    try {
      // ✅ Xác thực người dùng
      const scopes = ["payments", "username", "wallet_address"];
      const auth = await window.Pi.authenticate(scopes, (authResult) => authResult);

      console.log("✅ Xác thực:", auth);

      // ✅ Tạo giao dịch testnet
      const paymentData = {
        amount: total,
        memo: `Thanh toán đơn hàng ${Date.now()}`,
        metadata: { items: cart },
      };

      const payment = await window.Pi.createPayment(paymentData, {
        onReadyForServerApproval: (paymentId) => {
          console.log("✅ Ready for server approval:", paymentId);
        },
        onReadyForServerCompletion: (paymentId, txid) => {
          console.log("✅ Ready for server completion:", paymentId, txid);
        },
        onCancel: (paymentId) => {
          console.warn("❌ Giao dịch bị hủy:", paymentId);
          setLoading(false);
        },
        onError: (error, paymentId) => {
          console.error("❌ Lỗi:", error);
          setLoading(false);
        },
      });

      console.log("💰 Kết quả thanh toán:", payment);

      // ✅ Ghi đơn hàng vào hệ thống (backend)
      const order = {
        id: Date.now(),
        items: cart,
        total,
        createdAt: new Date().toISOString(),
        buyer: auth.user?.username || "guest",
        status: "Chờ xác nhận",
        txid: payment.transaction?.txid || null,
      };

      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });

      clearCart();
      alert("✅ Thanh toán thành công qua Pi Wallet!");
      router.push("/customer/pending");
    } catch (err) {
      console.error("❌ Lỗi khi thanh toán:", err);
      alert("Thanh toán thất bại. Hãy thử lại trong Pi Browser Testnet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-center text-orange-600">
        💳 Thanh toán
      </h1>

      <div className="bg-white p-4 rounded shadow mb-4 text-sm">
        <pre className="overflow-x-auto bg-gray-50 p-2 rounded text-xs">
          {JSON.stringify(user, null, 2)}
        </pre>
        <p>
          <b>Tổng đơn hàng:</b> {total} Pi
        </p>
      </div>

      <button
        onClick={handlePayWithPi}
        disabled={loading}
        className={`w-full py-3 rounded text-white font-semibold ${
          loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {loading ? "Đang xử lý..." : "Thanh toán qua Pi Wallet Testnet"}
      </button>
    </main>
  );
}
