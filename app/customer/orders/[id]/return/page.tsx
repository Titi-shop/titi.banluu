"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPiAccessToken } from "@/lib/piAuth";

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

  const orderId = params.id;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  /* =========================
     1️⃣ LOAD ORDER
  ========================= */
  useEffect(() => {
    async function loadOrder() {
      try {
        const token = await getPiAccessToken();

        const res = await fetch(`/api/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
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
  }, [orderId]);

  /* =========================
     2️⃣ SUBMIT RETURN
  ========================= */
  async function handleSubmit() {
    if (!reason.trim()) {
      setError("Vui lòng nhập lý do trả hàng");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const token = await getPiAccessToken();

      const res = await fetch("/api/returns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: orderId,
          reason,
          description,
        }),
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
     3️⃣ UI
  ========================= */
  if (loading) {
    return (
      <main className="p-4">
        <p>Đang tải...</p>
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
