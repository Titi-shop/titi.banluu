"use client";

import { useEffect } from "react";

export default function CheckoutPage() {
  useEffect(() => {
    // Kiểm tra SDK
    if (typeof window === "undefined" || !window.Pi) {
      alert("⚠️ Vui lòng mở trang này trong Pi Browser để thanh toán!");
      return;
    }

    const Pi = window.Pi;
    Pi.init({ version: "2.0" }); // Luôn phải init trước khi gọi API

    // Dữ liệu giỏ hàng
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");

    if (cart.length === 0) {
      alert("🛒 Giỏ hàng trống!");
      return;
    }

    const totalAmount = cart.reduce(
      (sum, item) => sum + Number(item.price || 0),
      0
    );

    // Dữ liệu thanh toán
    const paymentData = {
      amount: totalAmount,
      memo: `Thanh toán ${cart.length} sản phẩm tại TiTi Shop`,
      metadata: { products: cart },
    };

    async function startPayment() {
      try {
        const payment = await Pi.createPayment(paymentData, {
          onReadyForServerApproval: async (paymentId) => {
            console.log("🟡 Gửi paymentId lên server:", paymentId);
            // Ở đây bạn có thể gọi API backend để xác thực
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
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-xl font-bold mb-3">💳 Đang khởi tạo thanh toán...</h1>
      <p>Vui lòng chờ hoặc xác nhận trong Pi Browser.</p>
    </main>
  );
}
