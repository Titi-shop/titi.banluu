"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  buyer: string;
  total: number;
  status: string;
  createdAt: string;
  items?: OrderItem[];
}

export default function CustomerPickupPage() {
  const router = useRouter();
  const { t, lang } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [lang]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders", {
        cache: "no-store",
        credentials: "include", // 🔥 QUAN TRỌNG
      });

      if (res.status === 401) {
        setOrders([]);
        return;
      }

      const data: Order[] = await res.json();

      const filterByLang: Record<string, string[]> = {
        vi: ["Chờ lấy hàng"],
        en: ["Ready for pickup"],
        zh: ["待取货"],
      };

      const filtered = data.filter((o) =>
        (filterByLang[lang] || filterByLang.vi).includes(o.status)
      );

      setOrders(filtered);
    } catch (err) {
      console.error("❌ Load orders error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <p className="text-center mt-6">⏳ {t.loading_orders}</p>;

  const totalOrders = orders.length;
  const totalPi = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  return (
    <main className="p-4 max-w-4xl mx-auto bg-gray-50 min-h-screen pb-24">
      {/* UI GIỮ NGUYÊN */}
    </main>
  );
}
