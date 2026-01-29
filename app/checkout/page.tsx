"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { useCart } from "@/app/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/apiFetch";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

/* =========================
   PI GLOBAL
========================= */
declare global {
  interface Window {
    Pi?: {
      createPayment: (
        paymentId: string,
        callbacks: {
          onReadyForServerApproval: (paymentId: string) => Promise<void>;
          onReadyForServerCompletion: (
            paymentId: string,
            txid: string
          ) => Promise<void>;
          onCancel: () => void;
          onError: (err: unknown) => void;
        }
      ) => Promise<void>;
    };
  }
}

/* =========================
   TYPES
========================= */
interface ShippingInfo {
  name: string;
  phone: string;
  address: string;
  country?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const { cart, total, clearCart } = useCart();
  const { user, piReady, loading } = useAuth();

  const [processing, setProcessing] = useState(false);
  const [shipping, setShipping] = useState<ShippingInfo | null>(null);

  /* =========================
     REQUIRE LOGIN
  ========================= */
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/pilogin");
    }
  }, [loading, user, router]);

  /* =========================
     LOAD SHIPPING
  ========================= */
  useEffect(() => {
    const raw = localStorage.getItem("shipping_info");
    if (raw) {
      try {
        setShipping(JSON.parse(raw));
      } catch {
        setShipping(null);
      }
    }
  }, []);

  /* =========================
     PAY WITH PI
  ========================= */
  const handlePayWithPi = async () => {
    if (!window.Pi || !piReady) {
      alert(t.pi_not_ready);
      return;
    }

    if (!user || !cart.length || !shipping) {
      alert(t.transaction_failed);
      return;
    }

    setProcessing(true);

    try {
      const orderId = `ORD-${Date.now()}`;

      /* =========================
         CREATE PAYMENT (SERVER)
      ========================= */
      const res = await apiFetch("/api/pi/create", {
        method: "POST",
        body: JSON.stringify({
          amount: Number(total.toFixed(2)),
          memo: `${t.payment_for_order} #${orderId}`,
          metadata: {
            orderId,
            buyer: user.username,
            shipping,
            items: cart,
          },
        }),
      });

      if (!res.ok) {
        throw new Error("CREATE_PAYMENT_FAILED");
      }

      const { paymentId } = await res.json();

      if (!paymentId) {
        throw new Error("MISSING_PAYMENT_ID");
      }

      /* =========================
         OPEN PI WALLET
      ========================= */
      await window.Pi.createPayment(paymentId, {
        onReadyForServerApproval: async (pid) => {
          await apiFetch("/api/pi/approve", {
            method: "POST",
            body: JSON.stringify({ paymentId: pid }),
          });
        },

        onReadyForServerCompletion: async (pid, txid) => {
          await apiFetch("/api/orders", {
            method: "POST",
            body: JSON.stringify({
              id: orderId,
              buyer: user.username,
              items: cart,
              total,
              txid,
              shipping,
              status: "paid",
              createdAt: new Date().toISOString(),
            }),
          });

          await apiFetch("/api/pi/complete", {
            method: "POST",
            body: JSON.stringify({ paymentId: pid, txid }),
          });

          clearCart();
          alert(t.payment_success);
          router.push("/customer/pending");
        },

        onCancel: () => {
          alert(t.payment_canceled);
        },

        onError: (err) => {
          console.error("PI ERROR", err);
          alert(t.payment_error);
        },
      });
    } catch (err) {
      console.error("CHECKOUT FAILED", err);
      alert(t.transaction_failed);
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !user) {
    return <main className="min-h-screen flex items-center justify-center">⏳</main>;
  }

  return (
    <main className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col">
      <div className="flex items-center bg-white p-3 border-b">
        <button onClick={() => router.back()} className="flex items-center">
          <ArrowLeft className="w-5 h-5 mr-1" />
          {t.back}
        </button>
        <h1 className="flex-1 text-center font-semibold">{t.checkout}</h1>
      </div>

      <div className="flex-1 p-4">
        <button
          onClick={handlePayWithPi}
          disabled={processing}
          className="w-full py-3 bg-orange-600 text-white rounded-lg"
        >
          {processing ? t.processing : t.pay_now}
        </button>
      </div>
    </main>
  );
}
