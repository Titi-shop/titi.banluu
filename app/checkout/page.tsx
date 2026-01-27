"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { useCart } from "../context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/apiFetch";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

/* =========================
   PI GLOBAL (NO any)
========================= */
declare global {
  interface Window {
    Pi?: {
      createPayment: (
        payment: unknown,
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

interface CartItem {
  name: string;
  price: number;
  quantity: number;
  image?: string;
  images?: string[];
}

/* =========================
   UTIL
========================= */
async function ensureOK(res: Response, label: string): Promise<void> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${label} failed (${res.status}): ${text}`);
  }
}

/* =========================
   PAGE
========================= */
export default function CheckoutPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { cart, clearCart, total } = useCart();
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
     LOAD SHIPPING (LOCAL)
  ========================= */
  useEffect(() => {
    const saved = localStorage.getItem("shipping_info");
    if (saved) {
      try {
        setShipping(JSON.parse(saved) as ShippingInfo);
      } catch {
        setShipping(null);
      }
    }
  }, []);

  /* =========================
     PAY WITH PI
  ========================= */
  const handlePayWithPi = async (): Promise<void> => {
    if (!window.Pi || !piReady) {
      alert(t.pi_not_ready);
      return;
    }

    if (!user) {
      router.push("/pilogin");
      return;
    }

    if (!cart.length) {
      alert(t.cart_empty);
      return;
    }

    if (!shipping?.name || !shipping.phone || !shipping.address) {
      alert(t.must_fill_shipping);
      router.push("/customer/address");
      return;
    }

    setProcessing(true);

    try {
      const orderId = `ORD-${Date.now()}`;

      /* =========================
         CREATE PAYMENT (SERVER)
      ========================= */
      const paymentPayload = {
        amount: Number(total.toFixed(2)),
        memo: `${t.payment_for_order} #${orderId}`,
        metadata: {
          orderId,
          buyer: user.username,
          shipping,
          items: cart,
        },
      };

      const createRes = await apiFetch("/api/pi/create", {
        method: "POST",
        body: JSON.stringify(paymentPayload),
      });

      await ensureOK(createRes, "PI CREATE");
      const payment = await createRes.json();

      /* =========================
         PI CALLBACKS
      ========================= */
      await window.Pi.createPayment(payment, {
        onReadyForServerApproval: async (paymentId: string) => {
          const res = await apiFetch("/api/pi/approve", {
            method: "POST",
            body: JSON.stringify({ paymentId }),
          });

          await ensureOK(res, "PI APPROVE");
        },

        onReadyForServerCompletion: async (
          paymentId: string,
          txid: string
        ) => {
          const orderRes = await apiFetch("/api/orders", {
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

          await ensureOK(orderRes, "CREATE ORDER");

          const completeRes = await apiFetch("/api/pi/complete", {
            method: "POST",
            body: JSON.stringify({ paymentId, txid }),
          });

          await ensureOK(completeRes, "PI COMPLETE");

          clearCart();
          alert(t.payment_success);
          router.push("/customer/pending");
        },

        onCancel: () => {
          alert(t.payment_canceled);
        },

        onError: (err: unknown) => {
          console.error("💥 Pi payment error:", err);
          alert(t.payment_error);
        },
      });
    } catch (err) {
      console.error("❌ Checkout error:", err);
      alert(t.transaction_failed);
    } finally {
      setProcessing(false);
    }
  };

  /* =========================
     UI HELPERS
  ========================= */
  const resolveImageUrl = (img?: string): string => {
    if (!img) return "/placeholder.png";
    if (img.startsWith("http")) return img;
    return `/${img.replace(/^\//, "")}`;
  };

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-500">
        ⏳ {t.loading}
      </main>
    );
  }

  /* =========================
     RENDER
  ========================= */
  return (
    <main className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col justify-between">
      {/* HEADER */}
      <div className="flex items-center bg-white p-3 border-b sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-700"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          {t.back}
        </button>
        <h1 className="flex-1 text-center font-semibold">{t.checkout}</h1>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto pb-28">
        <div
          className="bg-white p-4 border-b cursor-pointer"
          onClick={() => router.push("/customer/address")}
        >
          {shipping ? (
            <>
              <p className="font-semibold">{shipping.name}</p>
              <p className="text-sm text-gray-600">{shipping.phone}</p>
              <p className="text-sm text-gray-500">
                {shipping.country ? `${shipping.country}, ` : ""}
                {shipping.address}
              </p>
            </>
          ) : (
            <p className="text-gray-500">➕ {t.add_shipping}</p>
          )}
        </div>

        <div className="p-4 bg-white mt-2">
          {cart.map((item: CartItem, i: number) => (
            <div key={i} className="flex items-center border-b py-2">
              <img
                src={resolveImageUrl(item.image || item.images?.[0])}
                className="w-16 h-16 object-cover rounded"
              />
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-gray-500">
                  x{item.quantity} × {item.price} π
                </p>
              </div>
              <p className="font-semibold text-orange-600 text-sm">
                {(item.price * item.quantity).toFixed(2)} π
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t p-4 flex justify-between max-w-md mx-auto">
        <div>
          <p className="text-sm">{t.total_label}</p>
          <p className="text-xl font-bold text-orange-600">
            {total.toFixed(2)} π
          </p>
        </div>

        <button
          onClick={handlePayWithPi}
          disabled={processing}
          className={`px-6 py-3 rounded-lg text-white font-semibold ${
            processing
              ? "bg-gray-400"
              : "bg-orange-600 hover:bg-orange-700"
          }`}
        >
          {processing ? t.processing : t.pay_now}
        </button>
      </div>
    </main>
  );
}
