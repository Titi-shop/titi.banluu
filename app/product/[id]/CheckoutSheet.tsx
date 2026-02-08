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

  const { cart, updateQuantity, clearCart } = useCart();
  const { user, piReady } = useAuth();

  const [shipping, setShipping] = useState<ShippingInfo | null>(null);
  const [processing, setProcessing] = useState(false);

  /** chỉ giữ quantity draft cho 1 sản phẩm */
  const [qtyDraft, setQtyDraft] = useState<string>("");

  /* =========================
     ONLY ONE PRODUCT
  ========================= */
  const item = cart[0]; // 👈 chỉ lấy 1 sản phẩm

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
     LOAD ADDRESS
  ========================= */
  useEffect(() => {
    async function loadAddress() {
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

    if (open && user) loadAddress();
  }, [open, user]);

  /* =========================
     PRICE + TOTAL (SALE FIRST)
  ========================= */
  const unitPrice = useMemo(() => {
    if (!item) return 0;
    return (item as { sale_price?: number }).sale_price ?? item.price;
  }, [item]);

  const quantity = useMemo(() => {
    if (!item) return 1;
    return Number(qtyDraft || item.quantity);
  }, [qtyDraft, item]);

  const total = useMemo(() => {
    return unitPrice * quantity;
  }, [unitPrice, quantity]);

  /* =========================
     PAY WITH PI
  ========================= */
  const handlePay = async () => {
    if (!window.Pi || !piReady || !user || !shipping || !item) {
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
          metadata: {
            shipping,
            item: {
              product_id: item.id,
              quantity,
              price: unitPrice,
            },
          },
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

            await apiAuthFetch("/api/orders", {
              method: "POST",
              body: JSON.stringify({
                items: [
                  {
                    product_id: item.id,
                    quantity,
                    price: unitPrice,
                  },
                ],
                total,
              }),
            });

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

  if (!open || !item) return null;

  /* =========================
     UI
  ========================= */
  return (
    <div className="fixed inset-0 z-[100]">
      {/* BACKDROP */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* SHEET */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl h-[75vh] flex flex-col">
        {/* HANDLE */}
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-2 mb-2" />

        {/* HEADER */}
        <div className="px-4 pb-2 border-b">
          <h3 className="font-semibold">{t.checkout}</h3>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 pb-24">
          {/* ADDRESS */}
          <div
            className="border rounded-lg p-3 cursor-pointer"
            onClick={() => router.push("/customer/address")}
          >
            {shipping ? (
              <>
                <p className="font-medium">{shipping.name}</p>
                <p className="text-sm text-gray-600">{shipping.phone}</p>
                <p className="text-sm text-gray-500">{shipping.address}</p>
              </>
            ) : (
              <p className="text-gray-500">➕ {t.add_shipping}</p>
            )}
          </div>

          {/* PRODUCT */}
          <div className="flex items-center gap-3 border-b pb-3">
            <img
              src={item.image || item.images?.[0] || "/placeholder.png"}
              className="w-16 h-16 rounded object-cover"
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
                        setQtyDraft((d) => ({
                          ...d,
                          [item.id]: "",
                        }));
                        return;
                      }
                      updateQuantity(item.id, val);
                    }}
                    className="mt-1 w-16 border rounded px-2 py-1 text-sm text-center"
                  />
            </div>

            <p className="font-semibold text-orange-600">
              {total.toFixed(2)} π
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t p-4">
          <p className="text-center text-xs text-gray-900 mb-2">
             An tâm mua sắm tại TiTi
          </p>

          <button
            onClick={handlePay}
            disabled={processing}
            className="w-full py-3 bg-orange-600 text-white rounded-lg font-semibold disabled:bg-gray-300"
          >
            {processing ? t.processing : t.pay_now}
          </button>
        </div>
      </div>
    </div>
  );
}
