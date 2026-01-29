"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { useCart } from "@/app/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/apiFetch";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

/* =========================
   PI SDK TYPES (NO any)
========================= */
interface PiPayment {
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
}

interface PiCallbacks {
  onReadyForServerApproval(paymentId: string): Promise<void>;
  onReadyForServerCompletion(
    paymentId: string,
    txid: string
  ): Promise<void>;
  onCancel(): void;
  onError(error: unknown): void;
}

interface PiSDK {
  createPayment(
    payment: PiPayment,
    callbacks: PiCallbacks
  ): Promise<void>;
}

declare global {
  interface Window {
    Pi?: PiSDK;
  }
}

/* =========================
   DOMAIN TYPES
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
   PAGE
========================= */
export default function CheckoutPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const { cart, total, clearCart } = useCart();
  const { user, piReady, loading } = useAuth();

  const [shipping, setShipping] = useState<ShippingInfo | null>(null);
  const [processing, setProcessing] = useState(false);

  /* =========================
     REQUIRE AUTH (CLIENT)
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
    if (!raw) return;

    try {
      setShipping(JSON.parse(raw) as ShippingInfo);
    } catch {
      setShipping(null);
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

    if (processing) return;
    setProcessing(true);

    const orderId = `ORD-${Date.now()}`;

    // 1️⃣ GỌI SERVER TẠO PAYMENT (TESTNET / MAINNET TỰ ĐỘNG)
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
    uid: user.uid, // ⚠️ BẮT BUỘC
  }),
});

if (!res.ok) {
  throw new Error("PI_CREATE_PAYMENT_FAILED");
}

// 2️⃣ PAYMENT OBJECT DO PI TRẢ VỀ
const paymentFromServer = await res.json();

// 3️⃣ GỌI PI WALLET
await window.Pi.createPayment(paymentFromServer, {
  onReadyForServerApproval: async (paymentId) => {
    await apiFetch("/api/pi/approve", {
      method: "POST",
      body: JSON.stringify({ paymentId, orderId }),
    });
  },

  onReadyForServerCompletion: async (paymentId, txid) => {
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
      body: JSON.stringify({ paymentId, txid }),
    });

    clearCart();
    alert(t.payment_success);
    router.push("/customer/pending");
  },

  onCancel: () => {
    alert(t.payment_canceled);
    setProcessing(false);
  },

  onError: (err) => {
    console.error("❌ PI PAYMENT ERROR", err);
    alert(t.payment_error);
    setProcessing(false);
  },
});

    try {
      await window.Pi.createPayment(payment, {
        onReadyForServerApproval: async (paymentId) => {
          await apiFetch("/api/pi/approve", {
            method: "POST",
            body: JSON.stringify({ paymentId, orderId }),
          });
        },

        onReadyForServerCompletion: async (paymentId, txid) => {
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
            body: JSON.stringify({ paymentId, txid }),
          });

          clearCart();
          alert(t.payment_success);
          router.push("/customer/pending");
        },

        onCancel: () => {
          alert(t.payment_canceled);
          setProcessing(false);
        },

        onError: (err) => {
          console.error("❌ PI PAYMENT ERROR", err);
          alert(t.payment_error);
          setProcessing(false);
        },
      });
    } catch (err) {
      console.error("❌ CHECKOUT FAILED", err);
      alert(t.transaction_failed);
      setProcessing(false);
    }
  };

  /* =========================
     HELPERS
  ========================= */
  const resolveImage = (img?: string) => {
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
     UI
  ========================= */
  return (
    <main className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col">
      {/* HEADER */}
      <div className="flex items-center bg-white p-3 border-b sticky top-0 z-10">
        <button onClick={() => router.back()} className="flex items-center text-gray-700">
          <ArrowLeft className="w-5 h-5 mr-1" />
          {t.back}
        </button>
        <h1 className="flex-1 text-center font-semibold">{t.checkout}</h1>
      </div>

      {/* SHIPPING */}
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

      {/* CART */}
      <div className="flex-1 overflow-y-auto bg-white mt-2">
        {cart.map((item, i) => (
          <div key={i} className="flex items-center border-b p-3">
            <img
              src={resolveImage(item.image || item.images?.[0])}
              className="w-16 h-16 object-cover rounded"
              alt={item.name}
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

      {/* FOOTER */}
      <div className="sticky bottom-0 bg-white border-t p-4 flex justify-between">
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
            processing ? "bg-gray-400" : "bg-orange-600 hover:bg-orange-700"
          }`}
        >
          {processing ? t.processing : t.pay_now}
        </button>
      </div>
    </main>
  );
}
