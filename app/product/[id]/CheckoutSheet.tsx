"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { getPiAccessToken } from "@/lib/piAuth";

interface ShippingInfo {
  name: string;
  phone: string;
  address_line: string;
  province: string;
  country?: string;
  postal_code?: string | null;
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
  };
}

export default function CheckoutSheet({ open, onClose, product }: Props) {

  const router = useRouter();
  const { t } = useTranslation();
  const { user, piReady } = useAuth();

  const [shipping, setShipping] = useState<ShippingInfo | null>(null);
  const [processing, setProcessing] = useState(false);
  const [qtyDraft, setQtyDraft] = useState("1");

  const quantity = useMemo(() => {
    const n = Number(qtyDraft);
    return Number.isInteger(n) && n > 0 ? n : 1;
  }, [qtyDraft]);

  const unitPrice =
    typeof product.finalPrice === "number"
      ? product.finalPrice
      : product.price;

  const total = unitPrice * quantity;

  const handlePay = async () => {

    if (!window.Pi || !piReady || !user || !shipping) {
      alert("Pi chưa sẵn sàng");
      return;
    }

    if (processing) return;

    setProcessing(true);

    try {

      await window.Pi.createPayment(
        {
          amount: Number(total),
          memo: "TiTi Order",
          metadata: {
            product_id: product.id,
            quantity,
            price: unitPrice,
            shipping,
          },
        },
        {

          /* APPROVAL */

          onReadyForServerApproval: async (paymentId, callback) => {

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

  if (!open) return null;

  return (
    <button onClick={handlePay}>
      {processing ? "Processing..." : "Pay"}
    </button>
  );
}
