"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";
import { Clock, Package, Truck, Star, RotateCcw } from "lucide-react";

/* ===============================
   CUSTOMER ACCOUNT PAGE
=============================== */
export default function CustomerPage({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  const [avatar, setAvatar] = useState<string | null>(null);

  /* ===============================
     🔐 REQUIRE LOGIN
  =============================== */
  useEffect(() => {
    if (!loading && !user) {
      router.push("/pilogin");
    }
  }, [loading, user, router]);

  /* ===============================
     LOAD AVATAR (OPTIONAL)
  =============================== */
  useEffect(() => {
  if (!user?.accessToken) return;

  fetch("/api/getAvatar", {
    headers: {
      Authorization: `Bearer ${user.accessToken}`,
    },
  })
    .then((res) => res.json())
    .then((data) => setAvatar(data?.avatar ?? null))
    .catch(() => {});
}, [user?.accessToken]);

  if (loading || !user) {
    return (
      <main className="flex items-center justify-center min-h-screen text-gray-500">
        ⏳ {t.loading}
      </main>
    );
  }

  return (
    <div className="pb-6 bg-gray-100">
      {/* ================= HEADER ================= */}
      <div className="bg-orange-500 text-white p-6 text-center shadow">
        <div className="w-24 h-24 bg-white rounded-full mx-auto text-orange-600 text-4xl overflow-hidden shadow flex items-center justify-center">
          {avatar ? (
            <img src={avatar} className="w-full h-full object-cover" />
          ) : (
            user.username.charAt(0).toUpperCase()
          )}
        </div>

        <p className="mt-3 text-lg font-semibold">
          @{user.username} ✔
        </p>
      </div>

      {/* ================= MY ORDERS ================= */}
      <section className="bg-white mx-4 mt-4 rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">{t.my_orders}</h2>
        </div>

        <div className="grid grid-cols-5 text-center py-4">
          <OrderItem icon={<Clock size={26} />} label={t.pending_orders} path="/customer/pending" />
          <OrderItem icon={<Package size={26} />} label={t.pickup_orders} path="/customer/pickup" />
          <OrderItem icon={<Truck size={26} />} label={t.shipping_orders} path="/customer/shipping" />
          <OrderItem icon={<Star size={26} />} label={t.review_orders} path="/customer/review" />
          <OrderItem icon={<RotateCcw size={26} />} label={t.return_orders} path="/customer/returns" />
        </div>
      </section>

      {/* ================= WALLET ================= */}
      <section className="mx-4 mt-4 p-4 rounded-lg bg-orange-100 border border-orange-300 text-center">
        <p className="text-orange-700 font-medium">
          {t.wallet}:{" "}
          <span className="font-bold">
            {user.wallet_address || t.link_wallet}
          </span>
        </p>
      </section>
    </div>
  );
}

/* ===============================
   ORDER ITEM
=============================== */
function OrderItem({
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
