"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

interface Order {
  id: number;
  buyerName: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  province: string;
  total: number;
  status: string;
  createdAt: string;
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const { t } = useTranslation();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.error) {
          setOrder(null);
        } else {
          setOrder(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setOrder(null);
        setLoading(false);
      });
  }, [id]);

  const printOrder = () => window.print();

  const downloadJSON = () => {
    if (!order) return;

    const blob = new Blob([JSON.stringify(order, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    // SAFE template string
    a.download = `order_${id}.json`;

    a.click();
  };

  // ⏳ LOADING
  if (loading)
    return (
      <p className="text-center mt-10 text-gray-500">
        ⏳ {t.loading_initial}
      </p>
    );

  // ❌ ORDER NOT FOUND
  if (!order)
    return (
      <p className="text-center mt-10 text-red-500">
        ❌ {t.product_not_found}
      </p>
    );

  return (
    <main className="min-h-screen p-5 max-w-2xl mx-auto bg-white">
      {/* BACK */}
      <button
        onClick={() => router.back()}
        className="text-orange-500 text-lg mb-4"
      >
        ← {t.back}
      </button>

      {/* TITLE */}
      <h1 className="text-2xl font-bold text-gray-800 mb-3">
        🧾 {t.order_details} #{id}
      </h1>

      {/* ORDER INFO */}
      <div className="border p-4 rounded-lg shadow-sm space-y-2">
        <p>
          <b>👤 {t.buyer}:</b> {order.buyerName}
        </p>
        <p>
          <b>📧 {t.email}:</b> {order.email}
        </p>
        <p>
          <b>📞 {t.phone_number}:</b> {order.phone}
        </p>
        <p>
          <b>🏠 {t.address}:</b> {order.address}
        </p>
        <p>
          <b>🌍 {t.country}:</b> {order.country}
        </p>
        <p>
          <b>🏙 {t.province}:</b> {order.province}
        </p>

        <hr className="my-3" />

        <p>
          <b>💰 {t.total_pi}:</b> {order.total} Pi
        </p>
        <p>
          <b>📦 {t.status}:</b> {order.status}
        </p>
        <p>
          <b>📅 {t.created_at}:</b> {order.createdAt}
        </p>
      </div>

      {/* Buttons */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={downloadJSON}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          ⬇ {t.download}
        </button>

        <button
          onClick={printOrder}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          🖨 {t.print}
        </button>
      </div>
    </main>
  );
}
