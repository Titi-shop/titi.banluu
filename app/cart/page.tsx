"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useCart } from "@/app/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { getPiAccessToken } from "@/lib/piAuth";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";

/* =========================
   TYPES
========================= */
interface CartItem {
  id: string;
  name: string;
  price: number;
  sale_price?: number;
  quantity: number;
  image?: string;
  images?: string[];
}

/* =========================
   PAGE
========================= */
export default function CartPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const { user, piReady } = useAuth();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);

  /* =========================
     SELECT LOGIC
  ========================= */
  const toggleItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === cart.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cart.map((i) => i.id));
    }
  };

  /* =========================
     SELECTED ITEMS
  ========================= */
  const selectedItems: CartItem[] = useMemo(() => {
    return cart.filter((i) => selectedIds.includes(i.id));
  }, [cart, selectedIds]);

  /* =========================
     TOTAL (SALE-FIRST)
  ========================= */
  const total = useMemo(() => {
    return selectedItems.reduce((sum, item) => {
      const unit =
        typeof item.sale_price === "number"
          ? item.sale_price
          : item.price;

      return sum + unit * item.quantity;
    }, 0);
  }, [selectedItems]);

  /* =========================
     PAY WITH PI
  ========================= */
  const handlePay = async () => {
    if (!window.Pi || !piReady) {
      alert(t.pi_not_ready);
      return;
    }

    if (!user) {
      router.push("/pilogin");
      return;
    }

    if (selectedItems.length === 0) {
      alert(t.please_select_item);
      return;
    }

    if (processing) return;
    setProcessing(true);

    try {
      const token = await getPiAccessToken();
      if (!token) throw new Error("NO_TOKEN");

      await window.Pi.createPayment(
        {
          amount: Number(total.toFixed(2)),
          memo: `${t.paying_order} (${selectedItems.length})`,
          metadata: {
            items: selectedItems,
          },
        },
        {
          onReadyForServerApproval: async (paymentId: string) => {
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
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId, txid }),
            });

            await apiAuthFetch("/api/orders", {
              method: "POST",
              body: JSON.stringify({
                items: selectedItems.map((i) => ({
                  product_id: i.id,
                  quantity: i.quantity,
                  price:
                    typeof i.sale_price === "number"
                      ? i.sale_price
                      : i.price,
                })),
                total,
              }),
            });

            clearCart();
            router.push("/customer/pending");
          },

          onCancel: () => setProcessing(false),
          onError: () => setProcessing(false),
        }
      );
    } catch {
      alert(t.payment_failed);
      setProcessing(false);
    }
  };

  /* =========================
     UI
  ========================= */
  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white p-4 border-b font-semibold">
        🛒 {t.cart_title}
      </div>

      {cart.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p className="mb-3">{t.empty_cart}</p>
          <Link href="/" className="text-orange-600 font-medium">
            {t.back_to_shop}
          </Link>
        </div>
      ) : (
        <>
          {/* SELECT ALL */}
          <div className="flex items-center gap-2 px-4 py-3 bg-white border-b">
            <input
              type="checkbox"
              checked={selectedIds.length === cart.length}
              onChange={toggleAll}
              className="w-5 h-5 accent-orange-500"
            />
            <span className="text-sm">
              {t.select_all} ({cart.length})
            </span>
          </div>

          {/* ITEMS */}
          <div className="bg-white divide-y">
            {cart.map((item) => {
              const unit =
                typeof item.sale_price === "number"
                  ? item.sale_price
                  : item.price;

              return (
                <div
                  key={item.id}
                  className="flex gap-3 p-4 items-center"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggleItem(item.id)}
                    className="w-5 h-5 accent-orange-500"
                  />

                  <img
                    src={
                      item.image ||
                      item.images?.[0] ||
                      "/placeholder.png"
                    }
                    className="w-16 h-16 rounded object-cover"
                  />

                  <div className="flex-1">
                    <p className="text-sm font-medium line-clamp-2">
                      {item.name}
                    </p>

                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(
                            item.id,
                            Math.max(1, Number(e.target.value))
                          )
                        }
                        className="w-14 border rounded px-1 py-0.5 text-sm text-center"
                      />

                      <span className="text-xs text-gray-500">
                        × {unit} π
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-orange-600 font-semibold">
                      {(unit * item.quantity).toFixed(2)} π
                    </p>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-xs text-red-500 mt-1"
                    >
                      🗑 {t.delete}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* FOOTER */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm">{t.total}</span>
              <span className="font-bold text-orange-600">
                {total.toFixed(2)} π
              </span>
            </div>

            <button
              onClick={handlePay}
              disabled={processing || selectedItems.length === 0}
              className="w-full py-3 rounded-lg bg-orange-600 text-white font-semibold disabled:bg-gray-400"
            >
              {processing ? t.processing : t.pay_now}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
