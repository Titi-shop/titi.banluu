"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPiAccessToken } from "@/lib/piAuth";
import { formatPi } from "@/lib/pi";
import { useAuth } from "@/context/AuthContext";

type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipping"
  | "completed"
  | "cancelled"
  | "return_requested";

interface Product {
  id: string;
  name: string;
  images: string[];
}

interface OrderItem {
  quantity: number;
  price: number;
  product_id: string;
  product?: Product;
}

interface Order {
  id: string;
  total: number;
  status: OrderStatus;
  created_at: string;
  order_items: OrderItem[];
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { loading: authLoading } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadOrder();
  }, []);

  async function loadOrder() {
    try {
      const token = await getPiAccessToken();

      const res = await fetch(`/api/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Load failed");

      const data = await res.json();
      setOrder(data);
    } catch (err) {
      console.error("Load order error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="p-6 text-center text-gray-400">
        Loading order...
      </main>
    );
  }

  if (!order) {
    return (
      <main className="p-6 text-center text-red-500">
        Order not found
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 pb-20">
      <div className="max-w-xl mx-auto p-4 space-y-6">

        {/* HEADER */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h1 className="text-lg font-bold mb-2">
            🧾 Order Detail
          </h1>

          <p className="text-sm text-gray-500">
            Order ID: {order.id}
          </p>

          <p className="text-sm mt-1">
            Status:{" "}
            <span className="font-semibold text-orange-500">
              {order.status}
            </span>
          </p>

          <p className="text-xs text-gray-400 mt-1">
            Created at:{" "}
            {new Date(order.created_at).toLocaleString()}
          </p>
        </div>

        {/* PRODUCTS */}
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          {order.order_items.map((item, idx) => (
            <div key={idx} className="flex gap-3">
              <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden">
                {item.product?.images?.[0] && (
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="flex-1">
                <p className="font-medium text-sm">
                  {item.product?.name}
                </p>
                <p className="text-xs text-gray-500">
                  x{item.quantity}
                </p>
                <p className="text-sm font-semibold mt-1">
                  π{formatPi(item.price)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* TOTAL */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-base font-bold">
            Total: π{formatPi(order.total)}
          </p>
        </div>

        {/* ACTIONS */}
        <div className="space-y-3">

          {/* RETURN BUTTON */}
          {order.status === "completed" && (
            <button
              onClick={() =>
                router.push(
                  `/customer/orders/${order.id}/return`
                )
              }
              className="w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Request Return
            </button>
          )}

          {/* IF ALREADY REQUESTED */}
          {order.status === "return_requested" && (
            <button
              onClick={() =>
                router.push(`/customer/returns`)
              }
              className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              View Return Status
            </button>
          )}
        </div>

      </div>
    </main>
  );
}
