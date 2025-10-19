"use client";

import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useRouter } from "next/navigation";

// 🧩 Khai báo Pi SDK toàn cục
declare global {
  interface Window {
    Pi?: any;
  }
}

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

    const info = localStorage.getItem("user_info");
    if (info) {
      const parsed = JSON.parse(info);
      setUser(parsed.username || "guest");
    }
  }, []);

  // 💰 Thanh toán bằng Pi Wallet
  const handlePayWithPi = async () => {
    if (!window.Pi) {
      alert("⚠️ Hãy mở trang này trong Pi Browser để thanh toán.");
      return;
    }

    if (cart.length === 0) {
      alert("🛒 Giỏ hàng trống.");
      return;
    }

    setLoading(true);

    try {
      // ✅ 1. Xác thực người dùng Pi
      const scopes = ["payments", "username", "wallet_address"];
      const auth = await window.Pi.authenticate(scopes, (res: any) => res);
      console.log("✅ Xác thực Pi:", auth);

      // 🔐 2. Lưu thông tin người dùng vào localStorage
      if (auth?.user?.username) {
        localStorage.setItem(
          "user_info",
          JSON.stringify({ username: auth.user.username })
        );
        console.log("✅ Đã lưu user_info:", auth.user.username);
      }

      // ✅ 3. Tạo thanh toán thật
      const payment = await window.Pi.createPayment(
        {
          amount: total,
          memo: `Thanh toán đơn hàng #${Date.now()}`,
          metadata: {
            orderId: Date.now(),
            items: cart,
            buyer: auth.user?.username || user,
          },
        },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            console.log("⏳ [APPROVE] ID:", paymentId);
            await fetch("/api/pi/approve", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId }),
            });
          },
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            console.log("✅ [COMPLETE] ID:", paymentId, txid);
            await fetch("/api/pi/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId, txid }),
            });
          },
          onCancel: () => alert("❌ Giao dịch đã bị huỷ."),
          onError: (err: any) => console.error("💥 Lỗi Pi SDK:", err),
        }
      );

      console.log("💰 Kết quả thanh toán:", payment);

      // ✅ 4. Lưu đơn hàng lên API
      const order = {
        id: Date.now(),
        items: cart,
        total,
        createdAt: new Date().toISOString(),
        buyer: auth.user?.username || user,
        status: "Chờ xác nhận",
        note: "Pi đã thanh toán (testnet)",
      };

      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });

      clearCart();
      alert("✅ Thanh toán thành công!");
      router.push("/customer/pending");
    } catch (err) {
      console.error("❌ Lỗi thanh toán:", err);
      alert("❌ Giao dịch thất bại hoặc bị huỷ.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Giao diện thanh toán
  return (
    <main className="max-w-3xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-center text-orange-600">
        💳 Thanh toán
      </h1>

      <div className="bg-white p-4 rounded shadow mb-4">
        <p>
          Người mua: <b>{user}</b>
        </p>
        <p>
          Ví Pi hiện tại: <b className="text-yellow-600">{wallet} Pi</b>
        </p>
        <p>
          Tổng đơn hàng: <b className="text-yellow-600">{total} Pi</b>
        </p>
      </div>

      <button
        onClick={handlePayWithPi}
        disabled={loading}
        className={`w-full py-3 rounded text-white font-semibold ${
          loading ? "bg-gray-400" : "bg-purple-600 hover:bg-purple-700"
        }`}
      >
        {loading ? "Đang mở Pi Wallet..." : "Thanh toán bằng Pi Wallet (Testnet)"}
      </button>
    </main>
  );
}
