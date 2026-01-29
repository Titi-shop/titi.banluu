"use client";

import { useRouter } from "next/navigation";
import { useContext } from "react";

import { CartContext } from "@/context/CartContext";
import { AuthContext } from "@/context/AuthContext";
import { t } from "@/i18n";
/* 
  ⚠️ Giả định bạn đã có:
  - apiFetch()
  - useCart()
  - useAuth()
  - i18n (t)
*/

declare global {
  interface Window {
    Pi: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();

  const { cart, clearCart, total } = useCart();
  const { user } = useAuth();
  const { t } = useI18n();

  const [loading, setLoading] = useState(false);

  // ✅ Bắt buộc: chỉ cho chạy trong Pi Browser
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!window.Pi) {
      alert("Vui lòng mở trang này bằng Pi Browser");
      router.replace("/");
      return;
    }
  }, [router]);

  async function handleCheckout() {
    if (!cart.length || !user) return;

    setLoading(true);

    const orderId = crypto.randomUUID();

    const paymentData = {
      amount: Number(total),
      memo: `${t.payment_for_order} #${orderId}`,
      metadata: {
        orderId,
        buyer: user.username,
        items: cart,
      },
    };

    try {
      await window.Pi.createPayment(paymentData, {
        // 🔑 STEP 1: Pi yêu cầu server approve
        onReadyForServerApproval: async (paymentId: string) => {
          await apiFetch("/api/pi/approve", {
            method: "POST",
            body: JSON.stringify({ paymentId }),
          });
        },

        // 🔑 STEP 2: Pi đã ký xong giao dịch
        onReadyForServerCompletion: async (
          paymentId: string,
          txid: string
        ) => {
          // ✅ Lưu đơn hàng
          await apiFetch("/api/orders", {
            method: "POST",
            body: JSON.stringify({
              id: orderId,
              buyer: user.username,
              items: cart,
              total,
              txid,
              status: "paid",
              createdAt: new Date().toISOString(),
            }),
          });

          // ✅ Báo Pi hoàn tất
          await apiFetch("/api/pi/complete", {
            method: "POST",
            body: JSON.stringify({ paymentId, txid }),
          });

          clearCart();
          router.push("/customer/pending");
        },

        onCancel: () => {
          alert(t.payment_canceled);
          setLoading(false);
        },

        onError: (err: unknown) => {
          console.error("Pi error:", err);
          alert(t.payment_error);
          setLoading(false);
        },
      });
    } catch (err) {
      console.error("Checkout failed:", err);
      setLoading(false);
    }
  }

  return (
    <div className="checkout">
      <h1>{t.checkout}</h1>

      {cart.map((item) => (
        <div key={item.id}>
          {item.name} × {item.qty} — {item.price} π
        </div>
      ))}

      <hr />

      <p>
        {t.total}: <b>{total} π</b>
      </p>

      <button disabled={loading} onClick={handleCheckout}>
        {loading ? t.processing : t.pay_now}
      </button>
    </div>
  );
}
