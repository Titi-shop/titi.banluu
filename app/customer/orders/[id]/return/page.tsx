"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";

/* =========================
TYPES
========================= */

type OrderStatus =
  | "pending"
  | "pickup"
  | "shipping"
  | "completed"
  | "cancelled";

type OrderItem = {
  id: string;
  product_name: string;
};

type OrderDetail = {
  id: string;
  status: OrderStatus;
  order_items: OrderItem[];
};

/* =========================
PAGE
========================= */

export default function OrderReturnPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();

  const { user, loading: authLoading } = useAuth();

  const orderId =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : "";

  const [order, setOrder] = useState<OrderDetail | null>(null);

  const [selectedItemId, setSelectedItemId] = useState<string>("");

  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  const [images, setImages] = useState<File[]>([]);

  const [error, setError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  /* =========================
  IMAGE SELECT
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

        if (data.order_items?.length) {
          setSelectedItemId(data.order_items[0].id);
        }

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
    if (!selectedItemId) {
      setError("Invalid order item");
      return;
    }

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
      formData.append("order_item_id", selectedItemId);
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

      const result: { return_id?: string } = await res.json();

      if (result?.return_id) {
        router.push(`/customer/returns/${result.return_id}`);
      } else {
        router.push("/customer/returns");
      }
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

      {/* ORDER ITEMS */}

      <div className="space-y-2">

        <label className="block text-sm font-medium">
          {t.product ?? "Product"}
        </label>

        <select
          value={selectedItemId}
          onChange={(e) => setSelectedItemId(e.target.value)}
          className="w-full border rounded-md p-2 text-sm"
        >

          {order?.order_items.map((item) => (

            <option key={item.id} value={item.id}>
              {item.product_name}
            </option>

          ))}

        </select>

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

      {/* IMAGE */}

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

              <div
                key={i}
                className="w-20 h-20 border rounded overflow-hidden"
              >

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
