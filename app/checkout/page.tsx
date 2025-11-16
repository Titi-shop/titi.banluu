"use client";

import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft } from "lucide-react";

declare global {
  interface Window {
    Pi?: any;
  }
}

export default function CheckoutPage() {
  const { cart, clearCart, total } = useCart();
  const { user, piReady } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [shipping, setShipping] = useState<any>(null);

  // ✅ Lấy thông tin địa chỉ giao hàng
  useEffect(() => {
    const saved = localStorage.getItem("shipping_info");
    if (saved) setShipping(JSON.parse(saved));
  }, []);

  // 💳 Thanh toán qua Pi (logic gốc)
  const handlePayWithPi = async () => {
    if (!piReady || !window.Pi) {
      alert("⚠️ Pi SDK chưa sẵn sàng. Hãy mở trong Pi Browser.");
      return;
    }
    if (!user?.username) {
      alert("🔑 Vui lòng đăng nhập Pi trước khi thanh toán!");
      router.push("/pilogin");
      return;
    }
    if (cart.length === 0) {
      alert("🛒 Giỏ hàng trống!");
      return;
    }
    if (!shipping?.name || !shipping?.phone || !shipping?.address) {
      alert("📦 Vui lòng nhập đầy đủ địa chỉ giao hàng!");
      router.push("/customer/address");
      return;
    }

    setLoading(true);
    try {
      const orderId = `ORD-${Date.now()}`;
      const paymentData = {
        amount: Number(total.toFixed(2)),
        memo: `Thanh toán đơn hàng #${orderId}`,
        metadata: {
          orderId,
          buyer: user.username,
          items: cart,
          shipping,
        },
      };

      const callbacks = {
        onReadyForServerApproval: async (paymentId: string) => {
          console.log("⏳ onReadyForServerApproval:", paymentId);
          await fetch("/api/pi/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId }),
          });
        },

        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          console.log("✅ onReadyForServerCompletion:", paymentId, txid);
          await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: orderId,
              buyer: user.username,
              items: cart,
              total,
              txid,
              shipping,
              status: "Đã thanh toán",
              createdAt: new Date().toISOString(),
            }),
          });

          await fetch("/api/pi/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId, txid }),
          });

          clearCart();
          alert("🎉 Thanh toán thành công!");
          router.push("/customer/pending");
        },

        onCancel: async (paymentId: string) => {
          console.log("🛑 onCancel:", paymentId);
          alert("❌ Giao dịch đã huỷ.");
        },

        onError: (error: any) => {
          console.error("💥 onError:", error);
          alert("💥 Lỗi thanh toán: " + error.message);
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

  // ✅ Xử lý đường dẫn ảnh an toàn
  const resolveImageUrl = (img?: string) => {
    if (!img) return "/placeholder.png";
    if (img.startsWith("http")) return img;
    const cleanPath = img.replace(/^\//, "");
    return `https://muasam-titi.pi/${cleanPath}`;
  };

  return (
    <main className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col justify-between">
      {/* Thanh điều hướng */}
      <div className="flex items-center justify-between bg-white p-3 border-b sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-700 hover:text-blue-600"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          <span>Back</span>
        </button>
        <h1 className="font-semibold text-gray-800">Thanh toán</h1>
        <div className="w-5" />
      </div>

      {/* Nội dung */}
      <div className="flex-1 overflow-y-auto pb-28">
        {/* Địa chỉ giao hàng */}
        <div
          className="bg-white border-b border-gray-200 p-4 flex justify-between items-center cursor-pointer"
          onClick={() => router.push("/customer/address")}
        >
          {shipping ? (
            <div className="flex-1">
              <p className="font-semibold text-gray-800">{shipping.name}</p>
              <p className="text-gray-600 text-sm">{shipping.phone}</p>
              <p className="text-gray-500 text-sm">
                {shipping.country ? `${shipping.country}, ` : ""}
                {shipping.address}
              </p>
            </div>
          ) : (
            <p className="text-gray-500">➕ Thêm địa chỉ giao hàng</p>
          )}
          <span className="text-blue-500 text-sm ml-3">Chỉnh sửa ➜</span>
        </div>

        {/* sản phẩm  */}
        <div className="p-4 bg-white mt-2 border-t">
          <h2 className="font-semibold text-gray-800 mb-2">sản phẩm</h2>
          {cart.length === 0 ? (
            <p className="text-gray-500 text-sm">Không có sản phẩm nào.</p>
          ) : (
            <div className="space-y-3">
              {cart.map((item, i) => {
                const imageUrl = resolveImageUrl(item.image || item.images?.[0]);


                return (
                  <div
                    key={i}
                    className="flex items-center border-b border-gray-100 pb-2"
                  >
                    <img
                      src={imageUrl}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded border bg-gray-100"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.png";
                      }}
                    />
                    <div className="ml-3 flex-1">
                      <p className="text-gray-800 font-medium text-sm">
                        {item.name}
                      </p>
                      <p className="text-gray-500 text-xs">
                        x{item.quantity} × {item.price} π
                      </p>
                    </div>
                    <p className="text-orange-600 font-semibold text-sm">
                      {(item.price * item.quantity).toFixed(2)} π
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Thanh tổng cộng + nút thanh toán */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-between items-center max-w-md mx-auto">
        <div>
          <p className="text-gray-600 text-sm">Tổng cộng:</p>
          <p className="text-xl font-bold text-orange-600">
            {total.toFixed(2)} π
          </p>
        </div>
        <button
          onClick={handlePayWithPi}
          disabled={loading}
          className={`px-6 py-3 rounded-lg font-semibold text-white text-sm flex items-center gap-2 ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-orange-600 hover:bg-orange-700 active:bg-orange-800"
          }`}
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
              <span>Đang xử lý...</span>
            </>
          ) : (
            "Pay Now"
          )}
        </button>
      </div>
    </main>
  );
}
