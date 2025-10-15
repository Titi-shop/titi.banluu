"use client";

import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const { cart, clearCart, total } = useCart();
  const [wallet, setWallet] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState("guest"); // 👈 thêm state lưu tên người mua
  const router = useRouter();

  // --- Lấy ví Pi và user khi mở trang ---
  useEffect(() => {
    // Lấy ví
    const w = Number(localStorage.getItem("pi_wallet") ?? "1000");
    setWallet(w);
    if (!localStorage.getItem("pi_wallet")) {
      localStorage.setItem("pi_wallet", String(w));
    }

    // Lấy user
    const u = localStorage.getItem("pi_user") ?? "guest";
    setUser(u);
  }, []);

  // --- Xử lý thanh toán ---
  const handlePay = async () => {
    if (cart.length === 0) {
      alert("🛒 Giỏ hàng trống.");
      return;
    }
    if (wallet < total) {
      alert("📛 Ví Pi không đủ. Vui lòng nạp thêm.");
      return;
    }

    setLoading(true);
    try {
      // Giả lập trừ ví Pi
      const newWallet = wallet - total;
      localStorage.setItem("pi_wallet", String(newWallet));
      setWallet(newWallet);

      // Tạo đơn hàng
      const order = {
        id: Date.now(),
        items: cart,
        total,
        createdAt: new Date().toISOString(),
        buyer: user,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });

      if (!res.ok) throw new Error("Không thể tạo đơn");

      clearCart();
      alert(`✅ Thanh toán thành công! Đã trừ ${total} Pi.`);
      router.push("/");
    } catch (err) {
      console.error(err);
      alert("❌ Lỗi khi thanh toán.");
      // Nếu lỗi → hoàn tiền tạm
      const w = Number(localStorage.getItem("pi_wallet") ?? "0");
      setWallet(w);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">💳 Thanh toán</h1>

      <div className="bg-white p-4 rounded shadow mb-4">
        <p>Người mua: <b>{user}</b></p> {/* ✅ dùng state user */}
        <p>Ví Pi hiện tại: <b className="text-yellow-600">{wallet} Pi</b></p>
        <p>Tổng đơn: <b className="text-yellow-600">{total} Pi</b></p>
      </div>

      <button
        onClick={handlePay}
        disabled={loading}
        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Đang xử lý..." : "Thanh toán bằng Pi (Giả lập)"}
      </button>
    </main>
  );
}
