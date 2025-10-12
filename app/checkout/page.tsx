"use client";

import { useEffect } from "react";
import { useAuth } from "../../context/AuthContext"; // ✅ thêm dòng này

export default function CheckoutPage() {
  const { user } = useAuth(); // ✅ kiểm tra đăng nhập

  useEffect(() => {
    if (!user) return; // ✅ Nếu chưa đăng nhập thì không chạy thanh toán

    if (typeof window === "undefined" || !window.Pi) {
      alert("⚠️ Vui lòng mở trang này trong Pi Browser để thanh toán!");
      return;
    }

    const Pi = window.Pi;
    Pi.init({ version: "2.0" });

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");

    if (cart.length === 0) {
      alert("🛒 Giỏ hàng trống!");
      return;
    }

    const totalAmount = cart.reduce(
      (sum, item) => sum + Number(item.price || 0),
      0
    );

    const paymentData = {
      amount: totalAmount,
      memo: `Thanh toán ${cart.length} sản phẩm tại TiTi Shop`,
      metadata: { products: cart, user: user.username }, // ✅ thêm user vào metadata
    };

    async function startPayment() {
      try {
        const payment = await Pi.createPayment(paymentData, {
          onReadyForServerApproval: async (paymentId) => {
            console.log("🟡 Gửi paymentId lên server:", paymentId);
          },
          onReadyForServerCompletion: async (paymentId, txid) => {
            console.log("🟢 Giao dịch thành công:", txid);
            alert("✅ Thanh toán thành công qua Pi Wallet!");
            localStorage.removeItem("cart");
          },
          onCancel: () => {
            alert("❌ Bạn đã hủy thanh toán.");
          },
          onError: (error) => {
            console.error("🚨 Lỗi khi thanh toán:", error);
            alert("Lỗi khi thanh toán!");
          },
        });

        console.log("Payment object:", payment);
      } catch (err) {
        console.error("❌ Không thể tạo thanh toán:", err);
      }
    }

    startPayment();
  }, [user]); // ✅ chạy lại khi user đã login

  // ✅ Nếu chưa đăng nhập
  if (!user) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">
          ⚠️ Bạn cần đăng nhập bằng tài khoản Pi để thanh toán.
        </p>
      </main>
    );
  }

  // ✅ Nếu đã đăng nhập
  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-xl font-bold mb-3">
        💳 Đang khởi tạo thanh toán cho {user.username}...
      </h1>
      <p>Vui lòng chờ hoặc xác nhận trong Pi Browser.</p>
    </main>
  );
}
