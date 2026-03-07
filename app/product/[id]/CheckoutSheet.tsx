"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { getPiAccessToken } from "@/lib/piAuth";
import { formatPi } from "@/lib/pi";

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
   TYPES
========================= */

interface ShippingInfo {
  name: string;
  phone: string;
  address_line: string;
  province: string;
  country?: string;
  postal_code?: string | null;
}

interface AddressApiItem {
  is_default: boolean;
  full_name: string;
  phone: string;
  address_line: string;
  province: string;
  country?: string;
  postal_code?: string | null;
}

interface AddressApiResponse {
  items?: AddressApiItem[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  product: {
    id: number;
    name: string;
    price: number;
    finalPrice?: number;
    image?: string;
    images?: string[];
  };
}

/* =========================
   HELPERS
========================= */

function getCountryDisplay(country?: string) {
  return country ?? "";
}

/* =========================
   COMPONENT
========================= */

export default function CheckoutSheet({ open, onClose, product }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, piReady } = useAuth();

  const [shipping, setShipping] = useState<ShippingInfo | null>(null);
  const [processing, setProcessing] = useState(false);
  const [qtyDraft, setQtyDraft] = useState("1");

  const quantity = useMemo(() => {
    const n = Number(qtyDraft);
    return Number.isInteger(n) && n >= 1 ? n : 1;
  }, [qtyDraft]);

  const item = useMemo(() => {
    if (!product) return null;

    return {
      id: product.id,
      name: product.name,
      price: product.price,
      finalPrice: product.finalPrice,
      image: product.image,
      images: product.images,
    };
  }, [product]);

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

        const data: AddressApiResponse = await res.json();

        const def = data.items?.find((a) => a.is_default);

        if (!def) return;

        setShipping({
          name: def.full_name,
          phone: def.phone,
          address_line: def.address_line,
          province: def.province,
          country: def.country,
          postal_code: def.postal_code ?? null,
        });
      } catch {
        setShipping(null);
      }
    }

    if (open && user) {
      loadAddress();
    }
  }, [open, user]);

  /* =========================
     PRICE
  ========================= */

  const unitPrice = useMemo(() => {
    if (!item) return 0;

    return typeof item.finalPrice === "number"
      ? item.finalPrice
      : item.price;
  }, [item]);

  const total = useMemo(() => unitPrice * quantity, [unitPrice, quantity]);

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
          amount: Number(total.toFixed(6)),
          memo: "Thanh toán đơn hàng TiTi",
          metadata: {
  shipping,
  product: {
    id: item.id,
    name: item.name,
    image: item.image || item.images?.[0] || "",
    price: unitPrice
  },
  quantity
},
        },
        {
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

      console.error("APPROVE FAIL", await res.text());

      setProcessing(false);

      alert("Approve thất bại");

      return;
    }

    callback(); // ✅ chỉ gọi khi approve OK

  } catch (err) {

    console.error("APPROVE ERROR:", err);

    setProcessing(false);

  }

},

          /* COMPLETE */

          onReadyForServerCompletion: async (paymentId, txid) => {

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
      product_id: product.id,
      quantity,
      total,
      shipping,
      user: {
  pi_uid: user.pi_uid
}
    }),
  });

  if (!res.ok) {
    setProcessing(false);
    alert("Complete thất bại");
    return;
  }

  onClose();
  router.push("/customer/pending");
},

          onCancel: () => setProcessing(false),

          onError: () => setProcessing(false),
        }
      );

    } catch {

      setProcessing(false);

      alert(t.transaction_failed);
    }
  };

  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl h-[45vh] flex flex-col">

        <div className="flex-1 overflow-y-auto px-4 py-3 pb-24">

          <div
            className="border rounded-lg p-3 cursor-pointer mb-4"
            onClick={() => router.push("/customer/address")}
          >
            {shipping ? (
              <>
                <p className="font-medium">{shipping.name}</p>
                <p className="text-sm text-gray-600">{shipping.phone}</p>
                <p className="text-sm text-gray-500">{shipping.address_line}</p>
                <p className="text-sm text-gray-500">{shipping.province}</p>
                <p className="text-sm text-gray-500">{shipping.postal_code}</p>
                <p className="text-sm text-gray-500">
                  {getCountryDisplay(shipping.country)}
                </p>
              </>
            ) : (
              <p className="text-gray-500">➕ {t.add_shipping}</p>
            )}
          </div>

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
                type="text"
                inputMode="numeric"
                value={qtyDraft}
                onChange={(e) => {
                  if (/^\d*$/.test(e.target.value)) {
                    setQtyDraft(e.target.value);
                  }
                }}
                onBlur={() => {
                  if (!qtyDraft || Number(qtyDraft) < 1) {
                    setQtyDraft("1");
                  }
                }}
                className="mt-1 w-16 border rounded px-2 py-1 text-sm text-center"
              />
            </div>

            <p className="font-semibold text-orange-600">
              {formatPi(total)} π
            </p>
          </div>

        </div>

        <div className="border-t p-4">
          <button
            onClick={handlePay}
            disabled={processing}
            className="w-full py-3 bg-orange-600 text-white rounded-lg font-semibold"
          >
            {processing ? t.processing : t.pay_now}
          </button>
        </div>

      </div>
    </div>
  );
}
