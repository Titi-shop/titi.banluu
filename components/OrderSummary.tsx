"use client";

import { useRouter } from "next/navigation";
import {
  Clock,
  Package,
  Truck,
  Star,
  RotateCcw,
} from "lucide-react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

/* =========================
   COMPONENT
========================= */
export default function OrderSummary() {
  const { t } = useTranslation();

  return (
    <section className="bg-white mx-4 mt-4 rounded-xl shadow border border-gray-100">
      {/* HEADER */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">
          {t.orders}
        </h2>
      </div>

      {/* ITEMS */}
      <div className="grid grid-cols-5 py-4">
        <Item
          icon={<Clock size={22} />}
          label={t.pending_orders}
          path="/customer/pending"
        />
        <Item
          icon={<Package size={22} />}
          label={t.pickup_orders}
          path="/customer/pickup"
        />
        <Item
          icon={<Truck size={22} />}
          label={t.shipping_orders}
          path="/customer/shipping"
        />
        <Item
          icon={<Star size={22} />}
          label={t.review_orders}
          path="/customer/review"
        />
        <Item
          icon={<RotateCcw size={22} />}
          label={t.return_orders}
          path="/customer/returns"
        />
      </div>
    </section>
  );
}

/* =========================
   ITEM
========================= */
function Item({
  icon,
  label,
  path,
}: {
  icon: React.ReactNode;
  label: string;
  path: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(path)}
      className="flex flex-col items-center justify-start h-[88px] text-gray-700 hover:text-orange-500 transition"
    >
      {/* ICON */}
      <div className="flex items-center justify-center w-11 h-11 rounded-full bg-gray-100 shadow-sm mb-1">
        {icon}
      </div>

      {/* LABEL */}
      <span className="text-[11px] leading-snug text-center line-clamp-2 max-w-[64px]">
        {label}
      </span>
    </button>
  );
}
