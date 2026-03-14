"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { getPiAccessToken } from "@/lib/piAuth";
import { useAuth } from "@/context/AuthContext";

/* =========================
RETURN STATUS
========================= */

type ReturnStatus =
  | "pending"
  | "seller_reviewing"
  | "approved"
  | "shipping_back"
  | "received"
  | "refunded"
  | "rejected";

/* =========================
TYPES (MATCH API)
========================= */

interface ReturnRecord {

  id: string;

  order_id: string;

  product_name: string;

  product_thumbnail: string | null;

  quantity: number;

  refund_amount: number;

  status: ReturnStatus;

  created_at: string;

}

/* =========================
PAGE
========================= */

export default function ReturnsPage() {

  const { t } = useTranslation();

  const router = useRouter();

  const { user, loading: authLoading } = useAuth();

  const [returns, setReturns] = useState<ReturnRecord[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    if (authLoading) return;

    if (!user) return;

    void loadReturns();

  }, [authLoading, user]);

  /* =========================
  LOAD RETURNS
  ========================= */

  async function loadReturns(): Promise<void> {

    if (authLoading) return;

    if (!user) return;

    try {

      const token = await getPiAccessToken();

      if (!token) return;

      const res = await fetch("/api/returns", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!res.ok) throw new Error("UNAUTHORIZED");

      const data = await res.json();

      const rawReturns: ReturnRecord[] = data ?? [];

      setReturns(rawReturns);

    } catch (err) {

      console.error("Load returns error:", err);

      setReturns([]);

    } finally {

      setLoading(false);

    }

  }

  /* =========================
  STATUS COLOR
  ========================= */

  function getStatusColor(status: ReturnStatus) {

    switch (status) {

      case "pending":
        return "text-yellow-600";

      case "seller_reviewing":
        return "text-blue-600";

      case "approved":
        return "text-green-600";

      case "shipping_back":
        return "text-indigo-600";

      case "received":
        return "text-purple-600";

      case "refunded":
        return "text-green-700";

      case "rejected":
        return "text-red-600";

      default:
        return "text-gray-500";
    }

  }

  /* =========================
  UI
  ========================= */

  return (

    <main className="min-h-screen bg-gray-100 pb-24">

      {/* HEADER */}

      <header className="bg-orange-500 text-white px-4 py-4">

        <div className="bg-orange-400 rounded-lg p-4">

          <p className="text-sm opacity-90">
            {t.return_requests}
          </p>

          <p className="text-xs opacity-80 mt-1">
            {t.total}: {returns.length}
          </p>

        </div>

      </header>

      {/* CONTENT */}

      <section className="mt-6 px-4">

        {loading || authLoading ? (

          <p className="text-center text-gray-400">
            {t.loading}
          </p>

        ) : returns.length === 0 ? (

          <div className="flex flex-col items-center justify-center mt-16 text-gray-400">

            <div className="w-24 h-24 bg-gray-200 rounded-full mb-4 opacity-40" />

            <p>
              {t.no_return_requests}
            </p>

          </div>

        ) : (

          <div className="space-y-4">

            {returns.map((r) => (

              <div
                key={r.id}
                onClick={() =>
                  router.push(`/customer/returns/${r.id}`)
                }
                className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer"
              >

                {/* HEADER */}

                <div className="flex justify-between items-start px-4 py-3 border-b">

                  <span className="font-semibold text-xs break-all max-w-[60%]">
                    #{t.order_id}
                  </span>

                  <span
                    className={`text-xs text-right max-w-[120px] leading-tight ${getStatusColor(
                      t.status
                    )}`}
                  >
                    {t[r.status]}
                  </span>

                </div>

                {/* PRODUCT */}

                <div className="flex gap-3 items-center px-4 py-3">

                  <div className="w-14 h-14 bg-gray-100 rounded overflow-hidden flex-shrink-0">

                    <img
                      src={r.product_thumbnail || "/placeholder.png"}
                      alt={r.product_name}
                      className="w-full h-full object-cover"
                    />

                  </div>

                  <div className="flex-1 min-w-0">

                    <p className="text-sm font-medium line-clamp-2 min-h-[40px]">
                      {r.product_name}
                    </p>

                    <p className="text-xs text-gray-500">
                      {t.quantity}: {r.quantity}
                    </p>

                  </div>

                </div>

                {/* FOOTER */}

                <div className="flex justify-between items-center px-4 py-3 border-t">

                  <p className="text-sm font-semibold">
                    {t.refund_amount}: π{r.refund_amount}
                  </p>

                  <span className="text-xs text-gray-400">
                    {new Date(t.created_at).toLocaleDateString()}
                  </span>

                </div>

              </div>

            ))}

          </div>

        )}

      </section>

    </main>

  );

}
