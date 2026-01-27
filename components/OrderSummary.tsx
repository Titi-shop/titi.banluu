"use client";

import { useRouter } from "next/navigation";
import { Clock, Package, Truck, Star, RotateCcw } from "lucide-react";
import { useTranslationClient as useTranslation } 
  from "@/app/lib/i18n/client";

export default function OrderSummary() {
  const router = useRouter();
  const t = useTranslation();

  return (
    <section className="bg-white mx-4 mt-4 rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">
          {t("orders")}
        </h2>
      </div>

      <div className="grid grid-cols-5 text-center py-4">
        <Item
          icon={<Clock size={26} />}
          label={t("status_pending")}
          path="/customer/pending"
        />
        <Item
          icon={<Package size={26} />}
          label={t("pickup_orders")}
          path="/customer/pickup"
        />
        <Item
          icon={<Truck size={26} />}
          label={t("shipping")}
          path="/customer/shipping"
        />
        <Item
          icon={<Star size={26} />}
          label={t("review_orders")}
          path="/customer/review"
        />
        <Item
          icon={<RotateCcw size={26} />}
          label={t("return_orders")}
          path="/customer/returns"
        />
      </div>
    </section>
  );
}

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
      onClick={() => router.push(path)}
      className="flex flex-col items-center text-gray-700 hover:text-orange-500"
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
}
