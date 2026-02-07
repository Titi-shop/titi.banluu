"use client";

import { useEffect, useMemo, useState } from "react";
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

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  images?: string[];
  sale_price?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

/* =========================
   COMPONENT
========================= */
export default function CheckoutSheet({ open, onClose }: Props) {
  const router = useRouter();
  const { t } = useTranslation();

  const {
    cart,
    updateQuantity,
    clearCart,
    removeFromCart,
  } = useCart();

  const { user, piReady } = useAuth();

  const [shipping, setShipping] = useState<ShippingInfo | null>(null);
  const [processing, setProcessing] = useState(false);

  /**
   * quantity draft để nhập tự do
   * key = product id
   */
  const [qtyDraft, setQtyDraft] = useState<Record<string, string>>({});

  /* =========================
     LOCK BODY SCROLL
  ========================= */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  /* =========================
     LOAD DEFAULT ADDRESS
  ========================= */
  useEffect(() => {
    async function loadAddress() {
      try {
        const token = await getPiAccessToken();
        if (!token) return;

        const res = await fetch("/api/address", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) return;

        const data: {
          items?: Array<{
            is_default: boolean;
            name: string;
            phone: string;
            address: string;
            country?: string;
          }>;
        } = await res.json();

        const def = data.items?.find((a) => a.is_default);

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

    if (open && user) loadAddress();
  }, [open, user]);

  /* =========================
     TOTAL (SALE-FIRST)
     ❗ KHÔNG dùng total từ CartContext
  ========================= */
  const checkoutTotal = useMemo(() => {
    return cart.reduce((sum: number, item: CartItem) => {
      const unitPrice =
        typeof item.sale_price === "number"
          ? item.sale_price
          : item.price;

      return sum + unitPrice * item.quantity;
    }, 0);
  }, [cart]);

  /* =========================
     PAY WITH PI
  ========================= */
  const handlePay = async () => {
    if (
      !window.Pi ||
      !piReady ||
      !user ||
      !shipping ||
      cart.length === 0
    ) {
      alert(t.transaction_failed);
      return;
    }

    if (processing) return;
    setProcessing(true);

    try {
      await window.Pi.createPayment(
        {
          amount: Number(checkoutTotal.toFixed(2)),
          memo: "Thanh toán đơn hàng TiTi",
          metadata: {
            shipping,
            items: cart,
          },
        },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            const token = await getPiAccessToken();
            if (!token) return;

            await fetch("/api/pi/approve", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ paymentId }),
            });
          },

          onReadyForServerCompletion: async (
            paymentId: string,
            txid: string
          ) => {
            await fetch("/api/pi/complete", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ paymentId, txid }),
            });

            const orderRes = await apiAuthFetch("/api/orders", {
              method: "POST",
              body: JSON.stringify({
                items: cart.map((i) => ({
                  product_id: i.id,
                  quantity: i.quantity,
                  price:
                    typeof i.sale_price === "number"
                      ? i.sale_price
                      : i.price,
                })),
                total: checkoutTotal,
              }),
            });

            if (!orderRes.ok) {
              throw new Error("ORDER_FAILED");
            }

            clearCart();
            onClose();
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

  if (!open) return null;

  /* =========================
     UI
  ========================= */
  return (
    <div className="fixed inset-0 z-[100]">
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* SHEET */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl min-h-[50vh] max-h-[70vh] flex flex-col">
        {/* HANDLE */}
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-2 mb-2" />

        {/* HEADER */}
        <div className="px-4 pb-2 border-b">
          <h3 className="font-semibold">{t.checkout}</h3>
        </div>

        {/* CONTENT */}
        <div className="overflow-y-auto px-4 py-3 space-y-3">
          {/* ADDRESS */}
          <div
            className="border rounded-lg p-3 cursor-pointer"
            onClick={() => router.push("/customer/address")}
          >
            {shipping ? (
              <>
                <p className="font-medium">{shipping.name}</p>
                <p className="text-sm text-gray-600">
                  {shipping.phone}
                </p>
                <p className="text-sm text-gray-500">
                  {shipping.address}
                </p>
              </>
            ) : (
              <p className="text-gray-500">
                ➕ {t.add_shipping}
              </p>
            )}
          </div>

          {/* PRODUCTS */}
          {cart.map((item: CartItem) => {
            const unitPrice =
              typeof item.sale_price === "number"
                ? item.sale_price
                : item.price;

            const displayQty =
              qtyDraft[item.id] ?? String(item.quantity);

            return (
              <div
                key={item.id}
                className="flex items-center gap-3 border-b pb-2"
              >
                <img
                  src={
                    item.image ||
                    item.images?.[0] ||
                    "/placeholder.png"
                  }
                  className="w-14 h-14 rounded object-cover"
                />

                <div className="flex-1">
                  <p className="text-sm font-medium line-clamp-2">
                    {item.name}
                  </p>

                  <input
                    type="number"
                    min={1}
                    value={displayQty}
                    onChange={(e) =>
                      setQtyDraft((d) => ({
                        ...d,
                        [item.id]: e.target.value,
                      }))
                    }
                    onBlur={() => {
                      const val = Number(displayQty);
                      if (!val || val < 1) {
                        removeFromCart(item.id);
                        return;
                      }
                      updateQuantity(item.id, val);
                    }}
                    className="mt-1 w-16 border rounded px-2 py-1 text-sm text-center"
                  />
                </div>

                <p className="font-semibold text-orange-600 text-sm">
                  {(unitPrice * Number(displayQty)).toFixed(2)} π
                </p>

                {/* DELETE */}
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-gray-400 hover:text-red-500 text-lg"
                  title={t.remove}
                >
                  ✕
                </button>
              </div>
            );
          })}

          {cart.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-6">
              {t.no_products}
            </p>
          )}
        </div>

        {/* FOOTER */}
        <div className="border-t p-4">
          <p className="text-center text-xs text-gray-700 mb-2">
            An tâm mua sắm tại TiTi
          </p>

          <button
            onClick={handlePay}
            disabled={processing || cart.length === 0}
            className="w-full py-3 bg-orange-600 text-white rounded-lg font-semibold disabled:bg-gray-300"
          >
            {processing ? t.processing : t.pay_now}
          </button>
        </div>
      </div>
    </div>
  );
}
