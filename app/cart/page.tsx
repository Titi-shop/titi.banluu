
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

/* =========================
PAGE
========================= */

export default function CartPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const { cart, updateQty, removeFromCart, clearCart } = useCart();
  const { user, piReady } = useAuth();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [shipping, setShipping] = useState<ShippingInfo | null>(null);
  const [processing, setProcessing] = useState(false);

  /* =========================
SELECT ITEMS
========================= */

  const selectedItems = useMemo(() => {
    return cart.filter((i) => selectedIds.includes(i.id));
  }, [cart, selectedIds]);

  /* =========================
PRICE (UI ONLY)
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

        const res = await fetch("/api/address", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
TOGGLE
========================= */

  const toggleItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  /* =========================
VALIDATION
========================= */

  const validateBeforePay = () => {
    if (!window.Pi || !piReady) {
      alert("Pi chưa sẵn sàng");
      return false;
    }

    if (!user) {
      router.push("/pilogin");
      return false;
    }

    if (!shipping) {
      alert("Vui lòng thêm địa chỉ giao hàng");
      return false;
    }

    if (selectedItems.length === 0) {
      alert("Vui lòng chọn sản phẩm");
      return false;
    }

    if (selectedItems.length > 1) {
      alert("Hiện chỉ hỗ trợ 1 sản phẩm mỗi lần");
      return false;
    }

    const item = selectedItems[0];

    if (!item || item.quantity < 1 || item.quantity > 100) {
      alert("Số lượng không hợp lệ");
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

    const unit =
      typeof item.sale_price === "number"
        ? item.sale_price
        : item.price;

    const quantity = item.quantity;

    const totalPrice = Number((unit * quantity).toFixed(6));

    if (processing) return;

    setProcessing(true);

    try {
      await window.Pi.createPayment(
        {
          amount: totalPrice,
          memo: "Thanh toán đơn hàng TiTi",

          // ⚠️ metadata chỉ để hiển thị, KHÔNG tin server
          metadata: {
            product_id: item.id,
            quantity,
          },
        },

        {
          /* =========================
          APPROVE
          ========================= */

          onReadyForServerApproval: async (paymentId, callback) => {
            try {
              const token = await getPiAccessToken();

              const res = await fetch("/api/pi/approve", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
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
            } catch {
              setProcessing(false);
            }
          },

          /* =========================
          COMPLETE
          ========================= */

          onReadyForServerCompletion: async (paymentId, txid) => {
            try {
              const token = await getPiAccessToken();

              const res = await fetch("/api/pi/complete", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  paymentId,
                  txid,
                  product_id: item.id,
                  quantity,
                  // ❌ KHÔNG gửi total
                  // ❌ KHÔNG gửi user
                  // ❌ KHÔNG gửi shipping
                }),
              });

              if (!res.ok) {
                setProcessing(false);
                alert("Complete thất bại");
                return;
              }

              clearCart();
              setSelectedIds([]);
              router.push("/customer/pending");
            } catch {
              setProcessing(false);
              alert("Thanh toán lỗi");
            }
          },

          onCancel: () => setProcessing(false),

          onError: () => {
            setProcessing(false);
            alert("Thanh toán thất bại");
          },
        }
      );
    } catch {
      setProcessing(false);
      alert("Thanh toán lỗi");
    }
  };

  /* =========================
UI
========================= */

  if (cart.length === 0) {
    return (
      <main className="p-8 text-center">
        <p className="text-gray-500 mb-3">{t.empty_cart}</p>
        <Link href="/" className="text-orange-600">
          {t.back_to_shop}
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-36">
      <div className="bg-white divide-y">
        {cart.map((item) => {
          const unit =
            typeof item.sale_price === "number"
              ? item.sale_price
              : item.price;

          return (
            <div key={item.id} className="flex gap-3 p-4 items-center">
              <input
                type="checkbox"
                checked={selectedIds.includes(item.id)}
                onChange={() => toggleItem(item.id)}
              />

              <img
                src={item.image || item.images?.[0] || "/placeholder.png"}
                className="w-16 h-16 rounded object-cover"
              />

              <div className="flex-1">
                <p className="text-sm font-medium line-clamp-2">
                  {item.name}
                </p>

                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={item.quantity}
                    onChange={(e) =>
                      updateQty(item.id, Number(e.target.value))
                    }
                    className="w-16 border rounded text-center"
                  />

                  <span className="text-xs text-gray-500">
                    × {formatPi(unit)} π
                  </span>
                </div>
              </div>

              <div className="text-right">
                <p className="text-orange-600 font-semibold">
                  {formatPi(unit * item.quantity)} π
                </p>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-xs text-red-500"
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
        <div className="flex justify-between mb-3">
          <span>{t.total}</span>

          <span className="font-bold text-orange-600">
            {formatPi(total)} π
          </span>
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
