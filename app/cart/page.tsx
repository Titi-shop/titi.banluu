"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "../context/CartContext";
import { useRouter } from "next/navigation";
import { useLanguage } from "../context/LanguageContext";

export default function CartPage() {
  const { cart, removeFromCart, updateQty, clearCart } = useCart();
  const router = useRouter();
  const { translate } = useLanguage();

  // ✅ Thanh toán 1 sản phẩm qua Pi Testnet
  const handlePayOne = async (item: any) => {
    try {
      if (!window.Pi) {
        alert("⚠️ " + translate("please_open_in_pi_browser"));
        return;
      }

      const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");
      const buyer = userInfo.username || "guest_user";
      const orderId = Date.now();

      const scopes = ["payments", "username", "wallet_address"];
      const auth = await window.Pi.authenticate(scopes, (res) => res);
      console.log("✅ Xác thực Pi:", auth);

      // ✅ Gọi thanh toán thật
      const payment = await window.Pi.createPayment(
        {
          amount: item.price * (item.quantity || 1),
          memo: `${translate("paying_product")} ${item.name}`,
          metadata: {
            orderId,
            buyer,
            item: { id: item.id, name: item.name, price: item.price },
          },
        },
        {
          onReadyForServerApproval: async (paymentId) => {
            await fetch("/api/pi/approve", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId, orderId }),
            });
          },
          onReadyForServerCompletion: async (paymentId, txid) => {
            await fetch("/api/pi/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId, txid, metadata: { orderId } }),
            });
          },
          onCancel: () => alert("❌ " + translate("payment_cancelled")),
          onError: (err) => console.error("💥 " + translate("payment_error"), err),
        }
      );

      console.log("💰 Kết quả:", payment);

      // ✅ Lưu đơn vào hệ thống
      const orderData = {
        id: orderId,
        buyer,
        total: item.price * (item.quantity || 1),
        items: [item],
        createdAt: new Date().toISOString(),
        status: translate("waiting_confirm"),
      };

      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      removeFromCart(item.id);
      alert(`🎉 ${translate("payment_success")}: ${item.name}`);
      router.push("/customer/pending");
    } catch (error) {
      console.error("❌ " + translate("payment_error"), error);
      alert("💥 " + translate("payment_failed"));
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">🛒 {translate("cart_title")}</h1>

      {cart.length === 0 ? (
        <div className="text-center">
          <p>{translate("empty_cart")}</p>
          <Link href="/" className="text-blue-600 hover:underline">
            {translate("back_to_shop")}
          </Link>
        </div>
      ) : (
        <div>
          <div className="space-y-4">
            {cart.map((it) => (
              <div
                key={it.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border p-3 rounded shadow-sm bg-white"
              >
                {/* Hình ảnh */}
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-20 h-20 bg-gray-100 flex items-center justify-center overflow-hidden rounded">
                    {it.images?.[0] ? (
                      <img
                        src={it.images[0]}
                        className="w-full h-full object-cover"
                        alt={it.name}
                      />
                    ) : (
                      <span className="text-gray-400 text-sm">
                        {translate("no_image")}
                      </span>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold">{it.name}</h3>
                    <p className="text-yellow-600 font-bold">{it.price} Pi</p>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {it.description}
                    </p>
                  </div>
                </div>

                {/* Thao tác */}
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:w-[200px] justify-end">
                  <input
                    type="number"
                    min={1}
                    value={it.quantity || 1}
                    onChange={(e) =>
                      updateQty(it.id, Math.max(1, Number(e.target.value)))
                    }
                    className="w-16 border p-1 rounded text-center"
                  />

                  <button
                    onClick={() => removeFromCart(it.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    {translate("delete")}
                  </button>

                  {/* 🔥 Thanh toán thật qua Pi Testnet */}
                  <button
                    onClick={() => handlePayOne(it)}
                    className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 flex items-center gap-1"
                  >
                    💳 {translate("pay_with_pi")}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ==== Nút xóa toàn bộ ==== */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => {
                clearCart();
                alert("🗑️ " + translate("cart_cleared"));
              }}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
            >
              {translate("clear_all")}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
