"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";

type OrderStatus =
  | "pending"
  | "pickup"
  | "shipping"
  | "completed"
  | "cancelled";

type OrderDetail = {
  id: string;
  status: OrderStatus;
};

export default function OrderReturnPage() {

  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();

  const orderId =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : "";

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const [images, setImages] = useState<File[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  /* =========================
     IMAGE HANDLER
  ========================= */

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {

    const files = e.target.files;

    if (!files) return;

    const selected = Array.from(files).slice(0, 3);

    setImages(selected);
  }

  /* =========================
     LOAD ORDER
  ========================= */

  useEffect(() => {

    if (authLoading) return;
    if (!user) return;
    if (!orderId) return;

    async function loadOrder() {

      try {

        const res = await apiAuthFetch(`/api/orders/${orderId}`);

        if (!res.ok) {
          setError(t.order_load_failed ?? "Cannot load order");
          setLoading(false);
          return;
        }

        const data: OrderDetail = await res.json();

        if (data.status !== "completed") {
          setError(
            t.return_only_completed ??
              "Only completed orders can be returned"
          );
          setLoading(false);
          return;
        }

        setOrder(data);
        setLoading(false);

      } catch {

        setError(t.system_error ?? "System error");
        setLoading(false);

      }
    }

    loadOrder();

  }, [authLoading, user, orderId, t]);

  /* =========================
     SUBMIT RETURN
  ========================= */

  async function handleSubmit() {

    if (!reason.trim()) {
      setError(t.return_reason_required ?? "Return reason required");
      return;
    }

    if (images.length < 1) {
      setError(t.return_image_required ?? "Please upload product images");
      return;
    }

    try {

      setSubmitting(true);
      setError(null);

      const formData = new FormData();

      formData.append("order_id", orderId);
      formData.append("reason", reason);
      formData.append("description", description);

      images.forEach((img) => {
        formData.append("images", img);
      });

      const res = await apiAuthFetch("/api/returns", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {

        const data = await res.json().catch(() => null);

        setError(
          data?.error ??
            t.return_submit_failed ??
            "Failed to submit return request"
        );

        setSubmitting(false);
        return;
      }

      router.push("/customer/returns");

    } catch {

      setError(t.system_error ?? "System error");

    } finally {

      setSubmitting(false);

    }
  }

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <main className="p-4">
        <p>{t.loading ?? "Loading..."}</p>
      </main>
    );
  }

  if (error && !order) {
    return (
      <main className="p-4">
        <p className="text-red-500">{error}</p>
      </main>
    );
  }

  /* =========================
     UI
  ========================= */

  return (

    <main className="p-4 max-w-xl mx-auto space-y-4">

      <h1 className="text-xl font-bold">
        🔄 {t.return_request ?? "Return request"}
      </h1>

      <div className="border p-3 rounded-md text-sm">

        <p>
          {t.order_id ?? "Order"}: {order?.id}
        </p>

        <p>
          {t.status ?? "Status"}: {order?.status}
        </p>

      </div>

      {/* REASON */}

      <div className="space-y-2">

        <label className="block text-sm font-medium">
          {t.return_reason ?? "Return reason"}
        </label>

        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border rounded-md p-2 text-sm"
          placeholder={t.return_reason_example ?? "Example: product defect"}
        />

      </div>

      {/* DESCRIPTION */}

      <div className="space-y-2">

        <label className="block text-sm font-medium">
          {t.description ?? "Description"}
        </label>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border rounded-md p-2 text-sm"
          rows={4}
        />

      </div>

      {/* IMAGE UPLOAD */}

      <div className="space-y-2">

        <label className="block text-sm font-medium">
          {t.upload_images ?? "Upload product images"} (max 3)
        </label>

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          className="w-full text-sm"
        />

        {images.length > 0 && (

          <div className="flex gap-2">

            {images.map((img, i) => (

              <div key={i} className="w-20 h-20 border rounded overflow-hidden">

                <img
                  src={URL.createObjectURL(img)}
                  alt="preview"
                  className="object-cover w-full h-full"
                />

              </div>

            ))}

          </div>

        )}

      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full bg-black text-white rounded-md p-2 text-sm disabled:opacity-50"
      >

        {submitting
          ? t.submitting ?? "Submitting..."
          : t.submit_return ?? "Submit return request"}

      </button>

    </main>

  );
}
