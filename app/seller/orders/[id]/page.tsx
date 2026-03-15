"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
  order_number: string;
  created_at: string;

  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_provider: string | null;
  shipping_country: string | null;
  shipping_postal_code: string | null;

  total: number;
  order_items: OrderItem[];
}

/* ================= HELPERS ================= */

function formatDate(date: string) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function safeNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function safeString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/* ================= PAGE ================= */

export default function SellerOrderDetailPage() {

  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();

  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : undefined;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  /* ================= TOTAL ================= */

  const total = useMemo(() => {

    if (!order) return 0;

    if (order.total) return order.total;

    return order.order_items.reduce(
      (sum, i) => sum + i.total_price,
      0
    );

  }, [order]);

  /* ================= LOAD ORDER ================= */

  useEffect(() => {

    if (authLoading) return;
    if (!user) return;
    if (!id) return;

    const loadOrder = async () => {

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

        const data: unknown = await res.json();

        if (!data || typeof data !== "object") {
          setOrder(null);
          setLoading(false);
          return;
        }

        const raw = data as Record<string, unknown>;

        const itemsRaw = Array.isArray(raw.order_items)
          ? raw.order_items
          : [];

        const items: OrderItem[] = itemsRaw
          .map((item) => {

            if (!item || typeof item !== "object") return null;

            const i = item as Record<string, unknown>;

            return {
              id:
                typeof i.id === "string"
                  ? i.id
                  : `${Date.now()}-${Math.random()}`,
              product_id:
                typeof i.product_id === "string"
                  ? i.product_id
                  : null,
              product_name: safeString(i.product_name),
              quantity: safeNumber(i.quantity),
              unit_price: safeNumber(i.unit_price),
              total_price: safeNumber(i.total_price),
            };

          })
          .filter((i): i is OrderItem => i !== null);

        const safeOrder: Order = {
          id: safeString(raw.id),
          order_number: safeString(raw.order_number),
          created_at: safeString(raw.created_at),

          shipping_name: safeString(raw.shipping_name),
          shipping_phone: safeString(raw.shipping_phone),
          shipping_address: safeString(raw.shipping_address),

          shipping_provider:
            typeof raw.shipping_provider === "string"
              ? raw.shipping_provider
              : null,

          shipping_country:
            typeof raw.shipping_country === "string"
              ? raw.shipping_country
              : null,

          shipping_postal_code:
            typeof raw.shipping_postal_code === "string"
              ? raw.shipping_postal_code
              : null,

          total: safeNumber(raw.total),

          order_items: items,
        };

        setOrder(safeOrder);

      } catch (err) {

        console.error("ORDER LOAD ERROR:", err);
        setOrder(null);

      } finally {

        setLoading(false);

      }

    };

    loadOrder();

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

          <p><b>{t.receiver ?? "Receiver"}:</b> {order.shipping_name}</p>
          <p><b>{t.phone ?? "Phone"}:</b> {order.shipping_phone}</p>
          <p><b>{t.address ?? "Address"}:</b> {order.shipping_address}</p>
          <p><b>{t.country ?? "Country"}:</b> {order.shipping_country}</p>
          <p><b>{t.postal_code ?? "Postal code"}:</b> {order.shipping_postal_code}</p>
          <p><b>{t.shipping_provider ?? "Shipping"}:</b> {order.shipping_provider}</p>
          <p><b>{t.created_at ?? "Created"}:</b> {formatDate(order.created_at)}</p>

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
              <th className="border px-2 py-1 text-right">π</th>
            </tr>

          </thead>

          <tbody>

            {order.order_items.length === 0 && (

              <tr>
                <td colSpan={4} className="text-center py-4 text-gray-400">
                  No items
                </td>
              </tr>

            )}

            {order.order_items.map((item, index) => (

              <tr key={item.id}>

                <td className="border px-2 py-1">
                  {index + 1}
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
