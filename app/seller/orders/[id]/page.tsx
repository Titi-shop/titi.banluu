"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";
import { formatPi } from "@/lib/pi";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

/* ================= TYPES ================= */

interface OrderItem {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
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

  total: number;
  order_items: OrderItem[];
}

/* ================= HELPERS ================= */

function formatDate(date: string) {
  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleString();
}

/* ================= PAGE ================= */

import { useParams } from "next/navigation";

export default function SellerOrderDetailPage() {

  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD ORDER ================= */

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const load = async () => {
      try {
        const res = await apiAuthFetch(
          `/api/seller/orders/${id}`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          setOrder(null);
          setLoading(false);
          return;
        }

        const data = await res.json();

        const safe: Order = {
          id: String(data?.id ?? ""),
          order_number: data?.order_number ?? "",
          created_at: data?.created_at ?? "",

          shipping_name: data?.shipping_name ?? "",
          shipping_phone: data?.shipping_phone ?? "",
          shipping_address: data?.shipping_address ?? "",
          shipping_provider: data?.shipping_provider ?? "",
          shipping_country: data?.shipping_country ?? "",
          shipping_postal_code: data?.shipping_postal_code ?? "",

          total: Number(data?.total ?? 0),

          order_items: Array.isArray(data?.order_items)
            ? data.order_items.map((i: any) => ({
                id: String(i?.id ?? crypto.randomUUID()),
                product_id: i?.product_id ?? null,
                product_name: i?.product_name ?? "",
                quantity: Number(i?.quantity ?? 0),
                unit_price: Number(i?.unit_price ?? 0),
                total_price: Number(i?.total_price ?? 0),
              }))
            : [],
        };

        setOrder(safe);
      } catch (err) {
        console.error("ORDER LOAD ERROR", err);
        setOrder(null);
      }

      setLoading(false);
    };

    load();
}, [authLoading, user, id]);

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <p className="text-center mt-10 text-gray-500">
        {t.loading ?? "Loading..."}
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
    if (order.total) return order.total;

    return order.order_items.reduce(
      (sum, i) => sum + i.total_price,
      0
    );
  }, [order]);

  /* ================= UI ================= */

  return (
    <main className="min-h-screen bg-gray-100 p-6">

      <div className="flex justify-end mb-6">

        <button
          onClick={() => router.back()}
          className="px-4 py-2 border rounded"
        >
          {t.back ?? "Back"}
        </button>

      </div>

      <section className="max-w-2xl mx-auto bg-white p-6 border shadow">

        <h1 className="text-xl font-semibold mb-6 text-center">
          {t.delivery_note ?? "Delivery Note"}
        </h1>

        {/* SHIPPING */}

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
            <b>{t.created_at ?? "Created"}:</b>{" "}
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

            {order.order_items.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="text-center py-4 text-gray-400"
                >
                  No items
                </td>
              </tr>
            )}

            {order.order_items.map((item, i) => (
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
                  π{formatPi(item.total_price)}
                </td>
              </tr>
            ))}

          </tbody>

        </table>

        <div className="mt-4 text-right font-semibold">
          {t.total ?? "Total"}: π{formatPi(total)}
        </div>

      </section>

    </main>
  );
}
