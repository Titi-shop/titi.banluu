"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useCart } from "@/app/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { getPiAccessToken } from "@/lib/piAuth";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";

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

  const { cart, total, clearCart, updateQuantity } = useCart();
  const { user, piReady, loading } = useAuth();

  const [shipping, setShipping] = useState<ShippingInfo | null>(null);
  const [processing, setProcessing] = useState(false);

  /* =========================
     REQUIRE AUTH
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
    async function loadShipping() {
      try {
        const token = await getPiAccessToken();
        if (!token) return;

        const res = await fetch("/api/address", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) return;

        const data = await res.json();
        const def = data.items?.find(
          (a: { is_default: boolean }) => a.is_default
        );

        if (def) {
          setShipping({
            name: def.name,
            phone: def.phone,
            address: def.address,
            country: def.country,
          });
        }
      } catch {
        setShipping(null);
      }
    }

    if (!loading && user) loadShipping();
  }, [loading, user]);

  /* =========================
     PAY
  ========================= */
  const handlePay = async () => {
    if (!window.Pi || !piReady || !user || !shipping || !cart.length) {
      alert(t.transaction_failed);
      return;
    }

    if (processing) return;
    setProcessing(true);

    try {
      await window.Pi.createPayment(
        {
          amount: Number(total.toFixed(2)),
          memo: "Thanh toán đơn hàng TiTi",
          metadata: { shipping, items: cart },
        },
        {
          onReadyForServerApproval: async (paymentId) => {
            const token = await getPiAccessToken();
            await fetch("/api/pi/approve", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ paymentId }),
            });
          },

          onReadyForServerCompletion: async (paymentId, txid) => {
            await fetch("/api/pi/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId, txid }),
            });

            const orderRes = await apiAuthFetch("/api/orders", {
              method: "POST",
              body: JSON.stringify({
                items: cart.map((i) => ({
                  product_id: i.id,
                  quantity: i.quantity,
                  price: i.price,
                })),
                total,
              }),
            });

            if (!orderRes.ok) throw new Error();

            clearCart();
            router.push("/customer/pending");
          },

          onCancel: () => setProcessing(false),
          onError: () => setProcessing(false),
        }
      );
    } catch {
      alert(t.transaction_failed);
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

  /* =========================
     UI
  ========================= */
  return (
    <main className="max-w-md mx-auto min-h-screen bg-gray-50 pb-28">
      {/* SHIPPING */}
      <div
        className="bg-white p-4 border-b"
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
      <div className="bg-white mt-2">
        {cart.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 border-b"
          >
            <img
              src={item.image || item.images?.[0] || "/placeholder.png"}
              className="w-16 h-16 object-cover rounded"
              alt={item.name}
            />

            <div className="flex-1">
              <p className="text-sm font-medium line-clamp-2">
                {item.name}
              </p>

              <div className="mt-1 flex items-center gap-2">
                <select
                  value={item.quantity}
                  onChange={(e) =>
                    updateQuantity(item.id, Number(e.target.value))
                  }
                  className="border rounded px-2 py-1 text-sm"
                >
                  {Array.from({ length: 10 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>

                <span className="text-xs text-gray-500">
                  × {item.price} π
                </span>
              </div>
            </div>

            <p className="font-semibold text-orange-600 text-sm">
              {(item.price * item.quantity).toFixed(2)} π
            </p>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 max-w-md mx-auto">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm">{t.total_label}</span>
          <span className="text-lg font-bold text-orange-600">
            {total.toFixed(2)} π
          </span>
        </div>

        <button
          onClick={handlePay}
          disabled={processing}
          className="w-full py-3 rounded-lg bg-orange-600 text-white font-semibold disabled:bg-gray-400"
        >
          {processing ? t.processing : t.pay_now}
        </button>

        <p className="text-center text-xs text-gray-500 mt-2">
          🔒 An tâm mua sắm tại TiTi
        </p>
      </div>
    </main>
  );
}
