"use client";

import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const { cart, clearCart, total } = useCart();
  const [wallet, setWallet] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState("guest");
  const router = useRouter();

  // ✅ Lấy ví Pi và thông tin user
  useEffect(() => {
    const w = Number(localStorage.getItem("pi_wallet") ?? "1000");
    setWallet(w);
    if (!localStorage.getItem("pi_wallet")) {
      localStorage.setItem("pi_wallet", String(w));
    }

    const info = localStorage.getItem("user_info");
    if (info) {
      const parsed = JSON.parse(info);
      setUser(parsed.username || "guest");
    }
  }, []);

  // 💳 Thanh toán
  const handlePay = async () => {
    if (cart.length === 0) return alert("🛒 Giỏ hàng trống.");
    if (wallet < total) return alert("📛 Ví Pi không đủ.");

    setLoading(true);
    try {
      const newWallet = wallet - total;
      localStorage.setItem("pi_wallet", String(newWallet));
      setWallet(newWallet);

      const order = {
        id: Date.now(),
        items: cart,
        total,
        createdAt: new Date().toISOString(),
        buyer: user,
        status: "Chờ xác nhận",
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });

      if (!res.ok) {
        const existing = JSON.parse(localStorage.getItem("orders") ?? "[]");
        existing.push(order);
        localStorage.setItem("orders", JSON.stringify(existing));
      }

      clearCart();
      alert("✅ Thanh toán thành công!");
      router.push("/customer/pending");
    } catch (err) {
      console.error("❌ Lỗi thanh toán:", err);
      alert("❌ Giao dịch thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-center text-orange-600">💳 Thanh toán</h1>

      <div className="bg-white p-4 rounded shadow mb-4">
        <p>Người mua: <b>{user}</b></p>
        <p>Ví Pi: <b className="text-yellow-600">{wallet} Pi</b></p>
        <p>Tổng đơn: <b className="text-yellow-600">{total} Pi</b></p>
      </div>

      <button
        onClick={handlePay}
        disabled={loading}
        className={`w-full py-3 rounded text-white font-semibold ${
          loading ? "bg-gray-400" : "bg-green-500 hover:bg-green-600"
        }`}
      >
        {loading ? "Đang xử lý..." : "Thanh toán bằng Pi (Giả lập)"}
      </button>
    </main>
  );
}
