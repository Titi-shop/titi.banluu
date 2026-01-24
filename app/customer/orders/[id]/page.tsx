"use client";

import { useParams } from "next/navigation";

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id;

  return (
    <main className="p-4">
      <h1 className="text-xl font-bold mb-4">🧾 Chi tiết đơn hàng</h1>
      <p>Mã đơn hàng: {orderId}</p>
      <p>Đây là trang hiển thị chi tiết đơn hàng {orderId}</p>
    </main>
  );
}
