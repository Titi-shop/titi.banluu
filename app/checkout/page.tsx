"use client";

export const dynamic = "force-dynamic";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { CartContext } from "../context/CartContext";
import { AuthContext } from "@/context/AuthContext";
import { apiFetch } from "@/lib/apiFetch";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

declare global {
  interface Window {
    Pi?: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const { cart, total, clearCart } = useContext(CartContext);
  const { user, loading, piReady } = useContext(AuthContext);

  const [processing, setProcessing] = useState(false);

  /* =========================
     REQUIRE PI BROWSER + LOGIN
  ========================= */
  useEffect(() => {
    if (loading) return;

    if (!window.Pi) {
      alert("Vui lòng mở trang này bằng Pi Browser");
      router.replace("/");
      return;
    }

    if (!user) {
      router.replace("/pilogin");
    }
  }, [loading, user, router]);

  /* =========================
     PAY WITH PI
  ========================= */
  const handlePay = async () => {
    if (!window.Pi || !piReady) {
      alert(t.pi_not_ready);
      return;
    }

    if (!user || !cart.length) {
      alert(t.cart_empty);
      return;
    }

    setProcessing(true);

    const orderId = `ORD-${Date.now()}`;

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
        /* 🔑 PI → SERVER APPROVE */
        onReadyForServerApproval: async (paymentId: string) => {
          await apiFetch("/api/pi/approve", {
            method: "POST",
            body: JSON.stringify({ paymentId }),
          });
        },

        /* 🔑 PI → SERVER COMPLETE */
        onReadyForServerCompletion: async (
          paymentId: string,
          txid: string
        ) => {
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

          await apiFetch("/api/pi/complete", {
            method: "POST",
            body: JSON.stringify({ paymentId, txid }),
          });

          clearCart();
          router.push("/customer/pending");
        },

        onCancel: () => {
          alert(t.payment_canceled);
          setProcessing(false);
        },

        onError: (err: unknown) => {
          console.error("💥 Pi error:", err);
          alert(t.payment_error);
          setProcessing(false);
        },
      });
    } catch (err) {
      console.error("❌ Checkout error:", err);
      setProcessing(false);
    }
  };

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-500">
        ⏳ {t.loading}
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col justify-between">
      {/* HEADER */}
      <div className="bg-white p-4 border-b text-center font-semibold">
        {t.checkout}
      </div>

      {/* CART */}
      <div className="flex-1 overflow-y-auto p-4 bg-white">
        {cart.map((item: any, i: number) => (
          <div key={i} className="flex justify-between py-2 border-b text-sm">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span className="font-semibold">
              {(item.price * item.quantity).toFixed(2)} π
            </span>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div className="p-4 border-t bg-white">
        <div className="flex justify-between mb-3">
          <span>{t.total_label}</span>
          <span className="font-bold text-orange-600">
            {total.toFixed(2)} π
          </span>
        </div>

        <button
          onClick={handlePay}
          disabled={processing}
          className={`w-full py-3 rounded-lg text-white font-semibold ${
            processing ? "bg-gray-400" : "bg-orange-600"
          }`}
        >
          {processing ? t.processing : t.pay_now}
        </button>
      </div>
    </main>
  );
}
