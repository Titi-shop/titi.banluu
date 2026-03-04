"use client";
import { countries } from "@/data/countries";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { getPiAccessToken } from "@/lib/piAuth";

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


interface Props {
  open: boolean;
  onClose: () => void;
  product: {
  id: string;
    name: string;
    price: number;
    finalPrice?: number;
    image?: string;
    images?: string[];
  };
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
  const [qtyDraft, setQtyDraft] = useState<string>("1");
  const quantity = useMemo(() => {
  const n = Number(qtyDraft);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}, [qtyDraft]);

   const getCountryDisplay = (code?: string) => {
  if (!code) return "";
  const found = countries.find(
    (c) => c.code.toUpperCase() === code.toUpperCase()
  );
  return found ? `${found.flag} ${found.name}` : code;
};
   
  const item = useMemo(() => {
  if (!product) return null;

  return {
    id: product.id,
    name: product.name,
    price: product.price,
    finalPrice: product.finalPrice,
    image: product.image,
    images: product.images,
    quantity: 1,
  };
}, [product]);

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
      if (!user) return;

      const token = await getPiAccessToken();
      if (!token) return;

      const res = await fetch("/api/address", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.error("ADDRESS API FAILED:", res.status);
        return;
      }

      const data = await res.json();

      if (!data.items || data.items.length === 0) {
        setShipping(null);
        return;
      }

      // ưu tiên default, nếu không có thì lấy cái đầu
      const selected =
        data.items.find(
          (a: { is_default: boolean }) => a.is_default
        ) || data.items[0];

      setShipping({
        name: selected.full_name,
        phone: selected.phone,
        address_line: selected.address_line,
        province: selected.province,
        country: selected.country,
        postal_code: selected.postal_code ?? null,
      });

    } catch (error) {
      console.error("LOAD ADDRESS ERROR:", error);
      setShipping(null);
    }
  }

  if (open) loadAddress();
}, [open, user]);

  /* =========================
     PRICE + TOTAL (SALE FIRST)
  ========================= */
  const unitPrice = useMemo(() => {
  if (!item) return 0;
  return typeof item.finalPrice === "number"
    ? item.finalPrice
    : item.price;
}, [item]);
   
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
    if (total < 0.0000001) {
      alert("Số Pi quá nhỏ để thanh toán");
      setProcessing(false);
      return;
    }

    await window.Pi.createPayment(
      {
        amount: Number(total.toFixed(7)),
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
        onReadyForServerApproval: async (paymentId: string) => {
          const token = await getPiAccessToken();
          if (!token) {
            setProcessing(false);
            return;
          }

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
            throw new Error("Approve failed");
          }
        },

        onReadyForServerCompletion: async (
          paymentId: string,
          txid: string
        ) => {
          const token = await getPiAccessToken();
          if (!token) {
            setProcessing(false);
            return;
          }

          const res = await fetch("/api/pi/complete", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ paymentId, txid }),
          });

          if (!res.ok) {
            setProcessing(false);
            return;
          }

          onClose();
          router.push("/customer/pending");
        },

        onCancel: () => {
          setProcessing(false);
        },

        onError: () => {
          setProcessing(false);
        },
      }
    );
  } catch {
    alert(t.transaction_failed);
    setProcessing(false);
  }
};
  /* =========================
     UI
  ========================= */
  return (
    <div className="fixed inset-0 z-[100]">
      {/* BACKDROP */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* SHEET */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl h-[45vh] flex flex-col">
        {/* HANDLE */}
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-2 mb-2" />

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto px-4 py-3 pb-24">
          {/* ADDRESS */}
          <div
            className="border rounded-lg p-3 cursor-pointer mb-4"
            onClick={() => router.push("/customer/address")}
          >
            {shipping ? (
              <>
  <p className="font-medium">{shipping.name}</p>
  <p className="text-sm text-gray-600">{shipping.phone}</p>

  <p className="text-sm text-gray-500">
  {shipping.address_line}
</p>

<p className="text-sm text-gray-500">
  {shipping.province}
</p>
  <p className="text-sm text-gray-500">
    {shipping.postal_code}
  </p>
  <p className="text-sm text-gray-500">
    {getCountryDisplay(shipping.country)}
  </p>
</>
            ) : (
              <p className="text-gray-500">➕ {t.add_shipping}</p>
            )}
          </div>

          {/* PRODUCT (ONLY ONE) */}
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
          const v = e.target.value;
    // chỉ cho nhập số hoặc rỗng
    if (/^\d*$/.test(v)) {
      setQtyDraft(v);
       }
      }}
      onBlur={() => {
      if (qtyDraft === "" || Number(qtyDraft) < 1) {
      setQtyDraft("1");
      }
         }}
         className="mt-1 w-16 border rounded px-2 py-1 text-sm text-center"
        />
            </div>

            <p className="font-semibold text-orange-600">
  {total.toFixed(6)} π
</p>
             
          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t p-4">
          <p className="text-center text-sm text-gray-1000 mb-2">
            {t.shop_confidence}
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
