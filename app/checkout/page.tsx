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

  // 🏠 Thông tin giao hàng
  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    phone: "",
    address: "",
  });

  // ✅ Lấy thông tin người dùng từ PiLogin
  useEffect(() => {
    try {
      const isLoggedIn = localStorage.getItem("titi_is_logged_in") === "true";
      const username = localStorage.getItem("titi_username");
      if (isLoggedIn && username) setUser(username);
    } catch (err) {
      console.error("User load error:", err);
    }
  }, []);

  // ✅ Lấy ví Pi (mock)
  useEffect(() => {
    const w = Number(localStorage.getItem("pi_wallet") ?? "1000");
    setWallet(w);
  }, []);

  // ✅ Tự động nạp lại địa chỉ giao hàng cũ
  useEffect(() => {
    const saved = localStorage.getItem("shipping_info");
    if (saved) setShippingInfo(JSON.parse(saved));
  }, []);

  // ✅ Khi nhập thì lưu luôn
  const handleShippingChange = (e: any) => {
    const updated = { ...shippingInfo, [e.target.name]: e.target.value };
    setShippingInfo(updated);
    localStorage.setItem("shipping_info", JSON.stringify(updated));
  };

  // 💰 Thanh toán qua Pi
  const handlePayWithPi = async () => {
    if (!window.Pi) {
      alert("⚠️ Hãy mở trang này trong Pi Browser để thanh toán.");
      return;
    }
    if (cart.length === 0) {
      alert("🛒 Giỏ hàng trống.");
      return;
    }
    if (!shippingInfo.name || !shippingInfo.phone || !shippingInfo.address) {
      alert("📦 Vui lòng nhập đầy đủ thông tin giao hàng!");
      return;
    }
    setLoading(true);

    try {
      window.Pi.init({ version: "2.0", sandbox: true });
      const scopes = ["payments", "username", "wallet_address"];
      const auth = await window.Pi.authenticate(scopes, (res: any) => res);
      console.log("✅ Xác thực Pi:", auth);

      const orderId = Date.now();
      const paymentData = {
        amount: total,
        memo: `Thanh toán đơn hàng #${orderId}`,
        metadata: {
          orderId,
          items: cart,
          buyer: auth.user?.username || user,
        },
      };

      const callbacks = {
        onReadyForServerApproval: async (paymentId: string) => {
          await fetch("/api/pi/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId }),
          });
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          const res = await fetch("/api/pi/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId, txid }),
          });
          const result = await res.json();

          if (result?.success) {
            const order = {
              id: orderId,
              items: cart,
              total,
              buyer: auth.user?.username || user,
              status: "Đã thanh toán",
              note: `Pi TXID: ${txid}`,
              createdAt: new Date().toISOString(),
              shipping: shippingInfo, // ✅ thêm địa chỉ giao hàng
            };

            await fetch("/api/orders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(order),
            });

            clearCart();
            alert("✅ Thanh toán thành công!");
            router.push("/customer/pending");
          } else {
            alert("⚠️ Giao dịch đang chờ xác minh trên Pi Network.");
          }
        },
        onCancel: () => alert("❌ Giao dịch đã bị huỷ."),
        onError: (error: any) => {
          console.error("💥 Lỗi thanh toán:", error);
          alert("💥 Lỗi trong quá trình thanh toán: " + error.message);
        },
      };

      await window.Pi.createPayment(paymentData, callbacks);
    } catch (err: any) {
      console.error("❌ Lỗi thanh toán:", err);
      alert("❌ Giao dịch thất bại hoặc bị huỷ.");
    } finally {
      setLoading(false);
    }
  };

  // 🧱 Giao diện
  return (
    <main className="max-w-3xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-center text-orange-600">
        💳 Thanh toán
      </h1>

      {/* Form thông tin giao hàng */}
      <div className="p-4 border rounded-lg bg-white mb-4">
        <h3 className="font-semibold text-blue-600 mb-2">📦 Thông tin giao hàng</h3>

        <label className="block mb-2">
          Họ và tên:
          <input
            name="name"
            type="text"
            value={shippingInfo.name}
            onChange={handleShippingChange}
            className="w-full border p-2 rounded"
            required
          />
        </label>

        <label className="block mb-2">
          Số điện thoại:
          <input
            name="phone"
            type="text"
            value={shippingInfo.phone}
            onChange={handleShippingChange}
            className="w-full border p-2 rounded"
            required
          />
        </label>

        <label className="block mb-2">
          Địa chỉ giao hàng:
          <textarea
            name="address"
            value={shippingInfo.address}
            onChange={handleShippingChange}
            className="w-full border p-2 rounded"
            required
          />
        </label>
      </div>

      {/* Thông tin thanh toán */}
      <div className="bg-white p-4 rounded shadow mb-4">
        <p>Người mua: <b>{user}</b></p>
        <p>Ví Pi: <b className="text-yellow-600">{wallet} Pi</b></p>
        <p>Tổng đơn hàng: <b className="text-yellow-600">{total} Pi</b></p>
      </div>

      <button
        onClick={handlePayWithPi}
        disabled={loading}
        className={`w-full py-3 rounded text-white font-semibold ${
          loading ? "bg-gray-400" : "bg-purple-600 hover:bg-purple-700"
        }`}
      >
        {loading ? "Đang mở Pi Wallet..." : "Thanh toán bằng Pi Wallet"}
      </button>
    </main>
  );
}
