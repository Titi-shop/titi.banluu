"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

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
  const { accessToken, authLoading } = useAuth();
  const { t } = useTranslation();

  const orderId = params.id;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const [images, setImages] = useState<File[]>([]);
  const [preview, setPreview] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  /* =========================
     1️⃣ LOAD ORDER
  ========================= */

  useEffect(() => {
    if (authLoading) return;
    if (!accessToken) {
      setLoading(false);
      return;
    }

    async function loadOrder() {
      try {
        const res = await fetch(`/api/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          setError("Không thể tải đơn hàng");
          setLoading(false);
          return;
        }

        const data: OrderDetail = await res.json();

        if (data.status !== "completed") {
          setError("Chỉ đơn đã hoàn thành mới được trả hàng");
          setLoading(false);
          return;
        }

        setOrder(data);
        setLoading(false);
      } catch {
        setError("Lỗi hệ thống");
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderId, accessToken, authLoading]);

  /* =========================
     2️⃣ IMAGE SELECT
  ========================= */

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const newFiles: File[] = [];
    const newPreview: string[] = [];

    for (let i = 0; i < files.length; i++) {
      if (images.length + newFiles.length >= 3) break;

      const file = files[i];
      newFiles.push(file);
      newPreview.push(URL.createObjectURL(file));
    }

    setImages((prev) => [...prev, ...newFiles]);
    setPreview((prev) => [...prev, ...newPreview]);
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreview((prev) => prev.filter((_, i) => i !== index));
  }

  /* =========================
     3️⃣ SUBMIT RETURN
  ========================= */

  async function handleSubmit() {
    if (!reason.trim()) {
      setError("Vui lòng nhập lý do trả hàng");
      return;
    }

    if (!accessToken) return;

    try {
      setSubmitting(true);
      setError(null);

      const formData = new FormData();
      formData.append("order_id", orderId);
      formData.append("reason", reason);
      formData.append("description", description);

      images.forEach((file) => {
        formData.append("images", file);
      });

      const res = await fetch("/api/returns", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const data: { error?: string } = await res.json();
        setError(data.error ?? "Không thể gửi yêu cầu trả hàng");
        setSubmitting(false);
        return;
      }

      router.push(`/customer/returns/${orderId}`);
    } catch {
      setError("Lỗi hệ thống");
    } finally {
      setSubmitting(false);
    }
  }

  /* =========================
     4️⃣ UI
  ========================= */

  if (loading || authLoading) {
    return (
      <main className="p-4">
        <p>{t("loading")}</p>
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

  return (
    <main className="p-4 max-w-xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">🔄 Yêu cầu trả hàng</h1>

      <div className="border p-3 rounded-md text-sm">
        <p>Mã đơn: {order?.id}</p>
        <p>Trạng thái: {order?.status}</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Lý do trả hàng
        </label>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border rounded-md p-2 text-sm"
          placeholder="Ví dụ: Sản phẩm lỗi"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Mô tả chi tiết (không bắt buộc)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border rounded-md p-2 text-sm"
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Ảnh sản phẩm (tối đa 3 ảnh)
        </label>

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          disabled={images.length >= 3}
          className="text-sm"
        />

        {preview.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            {preview.map((src, i) => (
              <div key={i} className="relative">
                <img
                  src={src}
                  className="w-full h-24 object-cover rounded border"
                />

                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-black text-white text-xs px-1 rounded"
                >
                  ✕
                </button>
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
        {submitting ? "Đang gửi..." : "Gửi yêu cầu trả hàng"}
      </button>
    </main>
  );
}
