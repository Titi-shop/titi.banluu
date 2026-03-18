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

interface ShippingInfo {
  name: string;
  phone: string;
  address_line: string;
  country?: string;
  postal_code?: string | null;
}

interface AddressItem {
  is_default: boolean;
  full_name: string;
  phone: string;
  address_line: string;
  country?: string;
  postal_code?: string | null;
}

interface Message {
  text: string;
  type: "error" | "success";
}

/* =========================
PAGE
========================= */

export default function CartPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const { cart, updateQty, removeFromCart, clearCart } = useCart();
  const { user, piReady, pilogin } = useAuth();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [shipping, setShipping] = useState<ShippingInfo | null>(null);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  /* =========================
  SHOW MESSAGE
  ========================= */

  const showMessage = (text: string, type: "error" | "success" = "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  /* =========================
  SELECTED ITEMS
  ========================= */

  const selectedItems = useMemo(
    () => cart.filter((i) => selectedIds.includes(i.id)),
    [cart, selectedIds]
  );

  const total = useMemo(
    () =>
      selectedItems.reduce((sum, item) => {
        const unit = typeof item.sale_price === "number" ? item.sale_price : item.price;
        return sum + unit * item.quantity;
      }, 0),
    [selectedItems]
  );

  /* =========================
  LOAD DEFAULT SHIPPING
  ========================= */

  useEffect(() => {
    async function loadAddress() {
      try {
        const token = await getPiAccessToken();
        const res = await fetch("/api/address", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) return;

        const data: { items?: AddressItem[] } = await res.json();
        const def = data.items?.find((a) => a.is_default);
        if (!def) return;

        setShipping({
          name: def.full_name,
          phone: def.phone,
          address_line: def.address_line,
          country: def.country,
          postal_code: def.postal_code ?? null,
        });
      } catch {
        // silent fail
      }
    }

    if (user) loadAddress();
  }, [user]);

  /* =========================
  TOGGLE ITEM
  ========================= */

  const toggleItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  /* =========================
  VALIDATION
  ========================= */

  const validateBeforePay = (): boolean => {
    if (!window.Pi || !piReady) {
      showMessage("Pi chưa sẵn sàng", "error");
      return false;
    }

    if (!user) {
      pilogin?.();
      return false;
    }

    if (!shipping) {
      showMessage("Vui lòng thêm địa chỉ giao hàng", "error");
      return false;
    }

    if (selectedItems.length === 0) {
      showMessage("Vui lòng chọn sản phẩm", "error");
      return false;
    }

    if (selectedItems.length > 1) {
      showMessage("Hiện chỉ hỗ trợ 1 sản phẩm mỗi lần", "error");
      return false;
    }

    const item = selectedItems[0];
    if (!item || item.quantity < 1 || item.quantity > 100) {
      showMessage("Số lượng không hợp lệ", "error");
      return false;
    }

    return true;
  };

  /* =========================
  PAY WITH PI
  ========================= */

  const handlePay = async () => {
    if (!validateBeforePay()) return;

    const item = selectedItems[0];
    const unit = typeof item.sale_price === "number" ? item.sale_price : item.price;
    const quantity = item.quantity;
    const totalPrice = Number((unit * quantity).toFixed(6));

    if (processing) return;
    setProcessing(true);

    try {
      await window.Pi?.createPayment(
        {
          amount: totalPrice,
          memo: "Thanh toán đơn hàng TiTi",
          metadata: { product_id: item.id, quantity },
        },
        {
          onReadyForServerApproval: async (paymentId, callback) => {
            try {
              const token = await getPiAccessToken();
              const res = await fetch("/api/pi/approve", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId }),
              });

              if (!res.ok) {
                setProcessing(false);
                showMessage("Approve thất bại", "error");
                return;
              }

              callback();
            } catch {
              setProcessing(false);
              showMessage("Approve lỗi", "error");
            }
          },

          onReadyForServerCompletion: async (paymentId, txid) => {
            try {
              const token = await getPiAccessToken();
              const res = await fetch("/api/pi/complete", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId, txid, product_id: item.id, quantity }),
              });

              if (!res.ok) {
                setProcessing(false);
                showMessage("Complete thất bại", "error");
                return;
              }

              clearCart();
              setSelectedIds([]);
              router.push("/customer/pending");
              showMessage("Thanh toán thành công", "success");
            } catch {
              setProcessing(false);
              showMessage("Thanh toán lỗi", "error");
            }
          },

          onCancel: () => {
            setProcessing(false);
            showMessage("Thanh toán bị huỷ", "error");
          },

          onError: () => {
            setProcessing(false);
            showMessage("Thanh toán thất bại", "error");
          },
        }
      );
    } catch {
      setProcessing(false);
      showMessage("Thanh toán lỗi", "error");
    }
  };

  /* =========================
  UI
  ========================= */

  // NOT LOGGED IN
  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-6">
        <h1 className="text-xl font-semibold mb-6">{t.cart}</h1>

        <button
          onClick={() => pilogin?.()}
          disabled={!piReady}
          className={`w-full py-3 rounded-full font-semibold text-white shadow
            ${piReady ? "bg-orange-500 hover:bg-orange-600" : "bg-gray-300 cursor-not-allowed"}`}
        >
          {t.login}
        </button>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="p-8 text-center">
        <p className="text-gray-500 mb-3">{t.empty_cart}</p>
        <Link href="/" className="text-orange-600">{t.back_to_shop}</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-36 relative">
      {/* MESSAGE BANNER */}
      {message && (
        <div className={`fixed top-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded shadow-lg z-50
          ${message.type === "error" ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}>
          {message.text}
        </div>
      )}

      {/* CART ITEMS */}
      <div className="bg-white divide-y">
        {cart.map((item) => {
          const unit = typeof item.sale_price === "number" ? item.sale_price : item.price;
          return (
            <div key={item.id} className="flex gap-3 p-4 items-center">
              <input
                type="checkbox"
                checked={selectedIds.includes(item.id)}
                onChange={() => toggleItem(item.id)}
              />

              <img src={item.image || item.images?.[0] || "/placeholder.png"} className="w-16 h-16 rounded object-cover" />

              <div className="flex-1">
                <p className="text-sm font-medium line-clamp-2">{item.name}</p>

                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={item.quantity}
                    onChange={(e) => updateQty(item.id, Number(e.target.value))}
                    className="w-16 border rounded text-center"
                  />
                  <span className="text-xs text-gray-500">× {formatPi(unit)} π</span>
                </div>
              </div>

              <div className="text-right">
                <p className="text-orange-600 font-semibold">{formatPi(unit * item.quantity)} π</p>
                <button onClick={() => removeFromCart(item.id)} className="text-xs text-red-500">{t.delete}</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER */}
      <div className="fixed bottom-7 left-0 right-0 bg-white border-t p-5 pb-8">
        <div className="flex justify-between mb-3">
          <span>{t.total}</span>
          <span className="font-bold text-orange-600">{formatPi(total)} π</span>
        </div>

        <button
          onClick={handlePay}
          disabled={processing || selectedItems.length === 0}
          className="w-full py-3 bg-orange-600 text-white rounded-lg"
        >
          {processing ? t.processing : t.pay_now}
        </button>
      </div>
    </main>
  );
}
