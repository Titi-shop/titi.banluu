"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Send } from "lucide-react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";

/* =========================
   TYPES (NO any)
========================= */
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
     LOAD ORDERS (AUTH-CENTRIC)
  ======================= */
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const res = await apiAuthFetch("/api/orders", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("FAILED_TO_LOAD_ORDERS");
        }

        const data: unknown = await res.json();
        setOrders(Array.isArray(data) ? (data as Order[]) : []);
      } catch (err) {
        console.error("❌ Load orders failed:", err);
        alert(t.load_orders_failed || "Không thể tải đơn hàng");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [t]);

  /* =======================
     UPLOAD IMAGE (AUTH + FORM)
  ======================= */
  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);

      const res = await apiAuthFetch("/api/upload", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        throw new Error("UPLOAD_FAILED");
      }

      const data: unknown = await res.json();
      if (
        typeof data === "object" &&
        data !== null &&
        "url" in data &&
        typeof (data as { url: unknown }).url === "string"
      ) {
        setImages(prev => [...prev, (data as { url: string }).url]);
      }
    } catch (err) {
      console.error(err);
      alert(t.upload_error || "Upload ảnh thất bại");
    } finally {
      setUploading(false);
    }
  };

  /* =======================
     SUBMIT RETURN REQUEST
  ======================= */
  const handleSubmit = async () => {
    if (!selectedOrder || !reason) {
      alert(t.warning_select_order_and_reason);
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiAuthFetch("/api/returns", {
        method: "POST",
        body: JSON.stringify({
          orderId: selectedOrder,
          reason,
          images,
        }),
      });

      if (!res.ok) {
        throw new Error("SUBMIT_FAILED");
      }

      const data: unknown = await res.json();
      if (
        typeof data === "object" &&
        data !== null &&
        "success" in data &&
        (data as { success: boolean }).success
      ) {
        alert(t.submit_success);
        setSelectedOrder("");
        setReason("");
        setImages([]);
      } else {
        alert(t.submit_failed);
      }
    } catch (err) {
      console.error(err);
      alert(t.server_error || "Lỗi máy chủ");
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================
     LOADING
  ======================= */
  if (loading) {
    return (
      <p className="text-center mt-10 text-gray-500">
        ⏳ {t.loading || "Đang tải..."}
      </p>
    );
  }

  /* =======================
     UI
  ======================= */
  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      {/* HEADER */}
      <div className="flex items-center bg-white p-4 shadow-sm">
        <button onClick={() => router.back()} className="text-gray-600">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-semibold mx-auto">
          {t.return_request || "Yêu cầu hoàn trả"}
        </h1>
      </div>

      {/* SELECT ORDER */}
      <div className="p-4">
        <label className="font-semibold">{t.select_order}</label>
        <select
          className="block w-full border p-2 rounded mt-2"
          value={selectedOrder}
          onChange={(e) => setSelectedOrder(e.target.value)}
        >
          <option value="">{t.select_order_placeholder}</option>
          {orders.map(o => (
            <option key={o.id} value={o.id}>
              {o.id} — {o.status}
            </option>
          ))}
        </select>
      </div>

      {/* REASON */}
      <div className="p-4">
        <label className="font-semibold">{t.return_reason}</label>
        <textarea
          rows={4}
          className="w-full border p-2 rounded mt-2"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t.reason_placeholder}
        />
      </div>

      {/* IMAGES */}
      <div className="p-4">
        <label className="font-semibold">{t.proof_images}</label>
        <label className="flex items-center gap-2 mt-2 bg-orange-500 text-white px-4 py-2 rounded cursor-pointer w-fit">
          <Upload size={18} />
          {uploading ? t.uploading : t.upload_image}
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={handleUpload}
          />
        </label>

        {images.length > 0 && (
          <div className="flex gap-3 mt-3 flex-wrap">
            {images.map((url, i) => (
              <img
                key={i}
                src={url}
                className="w-20 h-20 rounded border object-cover"
              />
            ))}
          </div>
        )}
      </div>

      {/* SUBMIT */}
      <div className="flex justify-center mt-6">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`${
            submitting
              ? "bg-gray-400"
              : "bg-green-600 hover:bg-green-700"
          } text-white py-2 px-6 rounded flex items-center gap-2`}
        >
          <Send size={18} />
          {submitting ? t.sending : t.send_request}
        </button>
      </div>
    </main>
  );
}
