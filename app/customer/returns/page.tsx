"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { apiFetchForm } from "@/lib/apiFetchForm";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Send } from "lucide-react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

interface Order {
  id: string;
  status: string;
}

export default function ReturnPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState("");
  const [reason, setReason] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  /* =======================
     LOAD ORDERS (NO AUTH)
  ======================= */
  useEffect(() => {
  apiFetch("/api/orders")
    .then((res) => {
      if (!res.ok) throw new Error("unauthorized");
      return res.json();
    })
    .then((data) => {
      setOrders(Array.isArray(data) ? data : []);
    })
    .catch(() => {
      console.warn(t.load_orders_failed);
    })
    .finally(() => setLoading(false));
}, [t]);

  /* =======================
     UPLOAD IMAGE
  ======================= */
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setUploading(true);
  try {
    const form = new FormData();
    form.append("file", file);

    const res = await apiFetchForm("/api/upload", {
      method: "POST",
      body: form,
    });

    const data = await res.json();
    if (data.url) setImages((prev) => [...prev, data.url]);
  } catch {
    alert(t.upload_error);
  } finally {
    setUploading(false);
  }
};

  /* =======================
     SUBMIT RETURN
  ======================= */
  const handleSubmit = async () => {
    if (!selectedOrder || !reason) {
      alert(t.warning_select_order_and_reason);
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/returns", {
  method: "POST",
  body: JSON.stringify({
    orderId: selectedOrder,
    reason,
    images,
  }),
});

      const data = await res.json();
      if (data.success) {
        alert(t.submit_success);
        setSelectedOrder("");
        setReason("");
        setImages([]);
      } else {
        alert(t.submit_failed);
      }
    } catch {
      alert(t.server_error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <p className="text-center mt-10 text-gray-500">
        ⏳ {t.loading}
      </p>
    );

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      {/* ===== Header ===== */}
      <div className="flex items-center bg-white p-4 shadow-sm">
        <button onClick={() => router.back()} className="text-gray-600">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-semibold mx-auto">
          {t.return_request}
        </h1>
      </div>

      {/* ===== Select order ===== */}
      <div className="p-4">
        <label className="font-semibold">{t.select_order}</label>
        <select
          className="block w-full border p-2 rounded mt-2"
          value={selectedOrder}
          onChange={(e) => setSelectedOrder(e.target.value)}
        >
          <option value="">{t.select_order_placeholder}</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.id} — {o.status}
            </option>
          ))}
        </select>
      </div>

      {/* ===== Reason ===== */}
      <div className="p-4">
        <label className="font-semibold">{t.return_reason}</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className="w-full border p-2 rounded mt-2"
          placeholder={t.reason_placeholder}
        />
      </div>

      {/* ===== Images ===== */}
      <div className="p-4">
        <label className="font-semibold">{t.proof_images}</label>
        <label className="flex items-center gap-2 mt-2 bg-orange-500 text-white px-4 py-2 rounded cursor-pointer w-fit">
          <Upload size={18} />
          {uploading ? t.uploading : t.upload_image}
          <input type="file" hidden accept="image/*" onChange={handleUpload} />
        </label>

        {images.length > 0 && (
          <div className="flex gap-3 mt-3 flex-wrap">
            {images.map((url, i) => (
              <img key={i} src={url} className="w-20 h-20 rounded border object-cover" />
            ))}
          </div>
        )}
      </div>

      {/* ===== Submit ===== */}
      <div className="flex justify-center mt-6">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`${
            submitting ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
          } text-white py-2 px-6 rounded flex items-center gap-2`}
        >
          <Send size={18} />
          {submitting ? t.sending : t.send_request}
        </button>
      </div>
    </main>
  );
}
