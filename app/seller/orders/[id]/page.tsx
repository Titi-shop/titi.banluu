"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { formatPi } from "@/lib/pi";

/* ================= TYPES ================= */

interface OrderItem {
  id: string;
  product_id: string | null;
  product_name: string;

  quantity: number;
  unit_price: number | string;
  total_price: number | string;
}

interface Order {
  id: string;
  order_number?: string;

  created_at: string;

  shipping_name?: string;
  shipping_phone?: string;
  shipping_address?: string;

  shipping_provider?: string | null;
  shipping_country?: string | null;
  shipping_postal_code?: string | null;

  total?: number | string;

  order_items: Array.isArray(safe.order_items)
  ? safe.order_items.filter(Boolean)
  : [],
}

/* ================= HELPERS ================= */

function formatDate(date: string): string {
  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function downloadText(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

/* ================= PAGE ================= */

export default function SellerOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();

const [order, setOrder] = useState<Order | null>(null);
const [loading, setLoading] = useState(true);

  /* ================= LOAD ORDER ================= */

  const loadOrder = useCallback(async () => {
    try {
      const res = await apiAuthFetch(
        `/api/seller/orders/${params.id}`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        setOrder(null);
        return;
      }

      const data: unknown = await res.json();

      if (data && typeof data === "object") {
        const safe = data as Partial<Order>;

        setOrder({
          id: safe.id ?? "",
          order_number: safe.order_number,
          created_at: safe.created_at ?? "",

          shipping_name: safe.shipping_name ?? "",
          shipping_phone: safe.shipping_phone ?? "",
          shipping_address: safe.shipping_address ?? "",

          shipping_provider: safe.shipping_provider ?? null,
          shipping_country: safe.shipping_country ?? null,
          shipping_postal_code: safe.shipping_postal_code ?? null,

          total: safe.total ?? 0,

          order_items: Array.isArray(safe.order_items)
            ? safe.order_items
            : [],
        });
      } else {
        setOrder(null);
      }
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
  if (authLoading) return;
  if (!user) return;

  void loadOrder();
}, [authLoading, user, loadOrder]);
  /* ================= LOADING ================= */

  if (loading) {
    return (
      <p className="text-center mt-10 text-gray-500">
        {t.loading_order ?? "Loading order..."}
      </p>
    );
  }

  if (!order) {
    return (
      <p className="text-center mt-10 text-red-500">
        {t.order_not_found ?? "Order not found"}
      </p>
    );
  }

  /* ================= TOTAL ================= */

  const total = useMemo(() => {
    if (order.total) return Number(order.total);

    return order.order_items.reduce(
      (sum, i) => sum + Number(i.total_price ?? 0),
      0
    );
  }, [order]);

  /* ================= DOWNLOAD TEXT ================= */

  const downloadContent = `
${t.order ?? "ORDER"}: ${order.order_number ?? order.id}
${t.created_at ?? "Created at"}: ${formatDate(order.created_at)}

${t.receiver ?? "Receiver"}:
${t.name ?? "Name"}: ${order.shipping_name}
${t.phone ?? "Phone"}: ${order.shipping_phone}
${t.address ?? "Address"}: ${order.shipping_address}
${t.country ?? "Country"}: ${order.shipping_country ?? ""}
${t.postal_code ?? "Postal code"}: ${order.shipping_postal_code ?? ""}
${t.shipping_provider ?? "Shipping"}: ${order.shipping_provider ?? ""}

${t.products ?? "Products"}:
${(order.order_items ?? []).map(
    (item, idx) =>
      `${idx + 1}. ${item.product_name} x${item.quantity} · π${formatPi(
        Number(item.unit_price ?? 0)
      )}`
  )
  .join("\n")}

${t.total ?? "Total"}: π${formatPi(total)}
`;

  /* ================= UI ================= */

  return (
    <main className="min-h-screen bg-gray-100 p-6 print:bg-white">

      {/* ACTION BAR */}

      <div className="flex justify-end gap-2 mb-6 print:hidden">

        <button
          onClick={() =>
            downloadText(
              `order-${order.order_number ?? order.id}.txt`,
              downloadContent
            )
          }
          className="px-4 py-2 border border-gray-600 text-gray-700 rounded"
        >
          {t.download ?? "Download"}
        </button>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-gray-700 text-white rounded"
        >
          {t.print ?? "Print"}
        </button>

        <button
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-400 rounded"
        >
          {t.back ?? "Back"}
        </button>

      </div>

      {/* ORDER PAPER */}

      <section className="max-w-2xl mx-auto bg-white p-6 border shadow print:shadow-none">

        <h1 className="text-xl font-semibold text-center mb-6">
          {t.delivery_note ?? "Delivery Note"}
        </h1>

        {/* SHIPPING INFO */}

        <div className="space-y-1 text-sm mb-6">

          <p>
            <b>{t.receiver ?? "Receiver"}:</b>{" "}
            {order.shipping_name}
          </p>

          <p>
            <b>{t.phone ?? "Phone"}:</b>{" "}
            {order.shipping_phone}
          </p>

          <p>
            <b>{t.address ?? "Address"}:</b>{" "}
            {order.shipping_address}
          </p>

          <p>
            <b>{t.country ?? "Country"}:</b>{" "}
            {order.shipping_country}
          </p>

          <p>
            <b>{t.postal_code ?? "Postal code"}:</b>{" "}
            {order.shipping_postal_code}
          </p>

          <p>
            <b>{t.shipping_provider ?? "Shipping"}:</b>{" "}
            {order.shipping_provider}
          </p>

          <p>
            <b>{t.created_at ?? "Created at"}:</b>{" "}
            {formatDate(order.created_at)}
          </p>

        </div>

        {/* ITEMS */}

        <table className="w-full border text-sm">

          <thead className="bg-gray-100">

            <tr>
              <th className="border px-2 py-1 text-left">#</th>

              <th className="border px-2 py-1 text-left">
                {t.product ?? "Product"}
              </th>

              <th className="border px-2 py-1 text-center">
                {t.quantity ?? "Qty"}
              </th>

              <th className="border px-2 py-1 text-right">
                π
              </th>

            </tr>

          </thead>

         <tbody>
  {(order.order_items ?? []).map((item, i) => (

    <tr key={item.id}>

                <td className="border px-2 py-1">
                  {i + 1}
                </td>

                <td className="border px-2 py-1">
                  {item.product_name}
                </td>

                <td className="border px-2 py-1 text-center">
                  {item.quantity}
                </td>

                <td className="border px-2 py-1 text-right">
                  π{formatPi(Number(item.total_price ?? 0))}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

        {/* TOTAL */}

        <div className="mt-4 text-right font-semibold">

          {t.total ?? "Total"}: π{formatPi(total)}

        </div>

      </section>

    </main>
  );
}
