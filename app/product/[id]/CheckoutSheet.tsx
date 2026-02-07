"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

import { useCart } from "@/app/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CheckoutSheet({ open, onClose }: Props) {
  const { t } = useTranslation();
  const { cart, total, updateQuantity } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* SHEET */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[90vh] flex flex-col animate-slideUp">
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b">
          <span className="font-semibold">{t.checkout}</span>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* CART */}
        <div className="flex-1 overflow-y-auto">
          {cart.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 border-b"
            >
              <img
                src={item.image || item.images?.[0] || "/placeholder.png"}
                className="w-14 h-14 rounded object-cover"
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

              <span className="text-sm font-semibold text-orange-600">
                {(item.price * item.quantity).toFixed(2)} π
              </span>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div className="border-t p-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm">{t.total_label}</span>
            <span className="font-bold text-orange-600">
              {total.toFixed(2)} π
            </span>
          </div>

          <button
            className="w-full py-3 rounded-lg bg-orange-600 text-white font-semibold"
            onClick={() => {
              alert("👉 Giai đoạn test: gọi pay ở đây");
            }}
          >
            {t.pay_now}
          </button>

          <p className="text-center text-xs text-gray-500 mt-2">
            🔒 An tâm mua sắm tại TiTi
          </p>
        </div>
      </div>
    </div>
  );
}
