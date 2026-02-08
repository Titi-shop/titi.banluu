"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { getPiAccessToken } from "@/lib/piAuth";

/* =========================
   TYPES
========================= */
interface OrderItem {
  id: string | number;
  name: string;
  image?: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  total: number;
  createdAt: string;
  status: string;
  items?: OrderItem[]; // 👈 THÊM DÒNG NÀY
}

type OrderTab =
  | "all"
  | "pending"
  | "pickup"
  | "shipping"
  | "received"
  | "completed"
  | "returned"
  | "cancelled";

/* =========================
   PAGE
========================= */
export default function CustomerOrdersPage() {
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderTab>("all");

  /* =========================
     LOAD ORDERS (1 LẦN)
  ========================= */
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const token = await getPiAccessToken();
      const res = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!res.ok) throw new Error("UNAUTHORIZED");

      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("❌ Load orders error:", e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     FILTER THEO TAB
  ========================= */
  const filteredOrders = useMemo(() => {
    if (activeTab === "all") return orders;

    return orders.filter((o) => o.status === activeTab);
  }, [orders, activeTab]);

  /* =========================
     UI
  ========================= */
  {filteredOrders.map((o) => (
  <div key={o.id} className="bg-white rounded-lg shadow">
    {/* ===== HEADER ===== */}
    <div className="flex justify-between px-4 py-2 border-b text-sm">
      <span className="font-semibold">#{o.id}</span>
      <span className="text-orange-500">
        {t[`status_${o.status}`] ?? o.status}
      </span>
    </div>

    {/* ===== PRODUCTS (GIỐNG SHOPEE) ===== */}
    <div className="divide-y">
      {o.items?.map((item) => (
        <div key={item.id} className="flex gap-3 p-4">
          <img
            src={item.image || "/placeholder.png"}
            className="w-16 h-16 rounded object-cover"
          />

          <div className="flex-1">
            <p className="text-sm line-clamp-2">
              {item.name}
            </p>

            <div className="flex justify-between mt-1 text-sm">
              <span className="text-orange-500">
                π{item.price}
              </span>
              <span className="text-gray-500">
                x{item.quantity}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* ===== FOOTER ===== */}
    <div className="flex justify-between items-center px-4 py-3 border-t text-sm">
      <span>
        {t.total}: <b>π{o.total}</b>
      </span>

      <button className="px-4 py-1 border border-orange-500 text-orange-500 rounded">
        {t.buy_now}
      </button>
    </div>
  </div>
))}
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
