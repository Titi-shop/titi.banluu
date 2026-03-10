"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useCart } from "@/app/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

import { getPiAccessToken } from "@/lib/piAuth";
import { formatPi } from "@/lib/pi";

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

interface ShippingInfo {
  name: string;
  phone: string;
  address: string;
  country?: string;
}

/* =========================
   PI TYPE
========================= */

type PiPayment = {
  createPayment: (
    data: {
      amount: number;
      memo: string;
      metadata: unknown;
    },
    callbacks: {
      onReadyForServerApproval: (
        paymentId: string,
        callback: () => void
      ) => void;
      onReadyForServerCompletion: (
        paymentId: string,
        txid: string
      ) => void;
      onCancel: () => void;
      onError: (error: unknown) => void;
    }
  ) => Promise<void>;
};

declare global {
  interface Window {
    Pi?: PiPayment;
  }
}

/* =========================
   PAGE
========================= */

export default function CartPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const { cart, updateQty, removeFromCart, clearCart } = useCart();
  const { user, piReady } = useAuth();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [shipping, setShipping] = useState<ShippingInfo | null>(null);

  const [qtyDraft, setQtyDraft] = useState<Record<string, string>>({});

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
     TOTAL
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
     LOAD ADDRESS
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

        const data = await res.json();

        const def = data.items?.find(
          (a: { is_default?: boolean }) => a.is_default
        );

        if (!def) return;

        setShipping({
          name: def.full_name,
          phone: def.phone,
          address: def.address_line,
          country: def.country,
        });

      } catch (err) {
        console.error("Load address error", err);
      }
    }

    if (user) loadAddress();
  }, [user]);

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

    if (!shipping) {
      alert("Vui lòng thêm địa chỉ giao hàng");
      return;
    }

    if (selectedItems.length === 0) {
      alert(t.please_select_item);
      return;
    }

    if (processing) return;

    setProcessing(true);

    try {

      const amount = Number(total.toFixed(6));

      if (amount < 0.00001) {
        alert("Số Pi quá nhỏ để thanh toán");
        setProcessing(false);
        return;
      }

      await window.Pi.createPayment(
        {
          amount,
          memo: `${t.paying_order} (${selectedItems.length})`,
          metadata: {
            items: selectedItems.map((i) => ({
              product_id: Number(i.id),
              quantity: i.quantity,
              price:
                typeof i.sale_price === "number"
                  ? i.sale_price
                  : i.price,
            })),
          },
        },
        {
          /* APPROVE */

          onReadyForServerApproval: async (paymentId, callback) => {

            try {

              const res = await fetch("/api/pi/approve", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ paymentId }),
              });

              if (!res.ok) {
                setProcessing(false);
                alert("Approve thất bại");
                return;
              }

              callback();

            } catch (err) {

              console.error("APPROVE ERROR:", err);
              setProcessing(false);

            }

          },

          /* COMPLETE */

          onReadyForServerCompletion: async (paymentId, txid) => {

            try {

              const res = await fetch("/api/pi/complete", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  paymentId,
                  txid,
                  items: selectedItems.map((i) => ({
                    product_id: Number(i.id),
                    quantity: i.quantity,
                  })),
                  total: Number(total.toFixed(6)),
                  shipping,
                  user: {
                    pi_uid: user.pi_uid,
                  },
                }),
              });

              if (!res.ok) {

                const err = await res.text();
                console.error("COMPLETE FAIL:", err);

                setProcessing(false);
                alert("Thanh toán thất bại");

                return;
              }

              clearCart();
              setSelectedIds([]);

              router.push("/customer/pending");

            } catch (err) {

              console.error("COMPLETE ERROR:", err);
              setProcessing(false);

            }

          },

          onCancel: () => setProcessing(false),

          onError: (err) => {
            console.error("PI ERROR:", err);
            setProcessing(false);
            alert(t.payment_failed);
          },
        }
      );

    } catch (err) {

      console.error("PAY ERROR:", err);
      setProcessing(false);
      alert(t.payment_failed);

    }

  };

  /* =========================
     UI
  ========================= */

  return (
    <main className="min-h-screen bg-gray-50 pb-36">

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

              const displayQty =
                qtyDraft[item.id] ?? String(item.quantity);

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
                        type="text"
                        inputMode="numeric"
                        value={displayQty}
                        onChange={(e) => {
                          const v = e.target.value;

                          if (/^\d*$/.test(v)) {
                            setQtyDraft((d) => ({
                              ...d,
                              [item.id]: v,
                            }));
                          }
                        }}
                        onBlur={() => {

                          const val = Number(displayQty);

                          if (!val || val < 1) {
                            setQtyDraft((d) => ({
                              ...d,
                              [item.id]: "",
                            }));
                            return;
                          }

                          updateQty(item.id, val);

                        }}
                        className="w-14 border rounded px-1 py-0.5 text-sm text-center"
                      />

                      <span className="text-xs text-gray-500">
                        × {formatPi(unit)} π
                      </span>

                    </div>
                  </div>

                  <div className="text-right">

                    <p className="text-orange-600 font-semibold">
                      {formatPi(
                        unit *
                          Number(
                            qtyDraft[item.id] ??
                              item.quantity
                          )
                      )} π
                    </p>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-xs text-red-500 mt-1"
                    >
                      {t.delete}
                    </button>

                  </div>
                </div>
              );
            })}
          </div>

          {/* FOOTER */}

          <div className="fixed bottom-7 left-0 right-0 bg-white border-t p-5 pb-8">

            <div className="flex justify-between mb-2">
              <span className="text-sm">{t.total}</span>

              <span className="font-bold text-orange-600">
                {formatPi(total)} π
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
