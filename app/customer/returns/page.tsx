"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";

type ReturnRecord = {
  id: string;
  order_id: string;
  product_name: string;
  product_thumbnail: string | null;
  quantity: number;
  refund_amount: number;
  status: string;
  created_at: string;
};

export default function ReturnsPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const { accessToken, authLoading } = useAuth();

  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     LOAD RETURNS
  ========================= */

  useEffect(() => {
    if (authLoading) return;
    if (!accessToken) return;

    void loadReturns();
  }, [authLoading, accessToken]);

  async function loadReturns(): Promise<void> {
    if (!accessToken) return;

    try {
      const res = await fetch("/api/returns", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });

      if (!res.ok) throw new Error("LOAD_FAILED");

      const data: ReturnRecord[] = await res.json();

      setReturns(Array.isArray(data) ? data : []);
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

  function getStatusColor(status: string) {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";

      case "seller_reviewing":
        return "bg-blue-100 text-blue-700";

      case "approved":
        return "bg-green-100 text-green-700";

      case "shipping_back":
        return "bg-indigo-100 text-indigo-700";

      case "received":
        return "bg-purple-100 text-purple-700";

      case "refunded":
        return "bg-green-200 text-green-800";

      case "rejected":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-600";
    }
  }

  /* =========================
     LOADING
  ========================= */

  if (loading || authLoading) {
    return (
      <div className="p-6">
        {t("loading")}
      </div>
    );
  }

  /* =========================
     UI
  ========================= */

  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-xl mx-auto p-4 space-y-4">

        <h1 className="text-lg font-semibold">
          {t("my_returns")}
        </h1>

        {returns.length === 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm text-center text-gray-500">
            {t("no_return_requests")}
          </div>
        )}

        {returns.map((r) => (
          <div
            key={r.id}
            onClick={() =>
              router.push(`/customer/returns/${r.id}`)
            }
            className="bg-white rounded-xl shadow-sm p-4 cursor-pointer hover:shadow-md transition space-y-3"
          >

            <div className="flex justify-between items-center">

              <div className="flex items-center gap-3">

                {r.product_thumbnail && (
                  <img
                    src={r.product_thumbnail}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}

                <div>
                  <p className="font-medium">
                    {r.product_name}
                  </p>

                  <p className="text-xs text-gray-400">
                    {t("order")}: {r.order_id}
                  </p>
                </div>

              </div>

              <span
                className={`px-3 py-1 text-xs rounded-full ${getStatusColor(
                  r.status
                )}`}
              >
                {r.status}
              </span>

            </div>

            <div className="text-xs text-gray-500 flex justify-between">

              <span>
                {t("quantity")}: {r.quantity}
              </span>

              <span>
                {t("refund_amount")}: {r.refund_amount}
              </span>

            </div>

            <div className="text-[10px] text-gray-400">
              {new Date(r.created_at).toLocaleString()}
            </div>

          </div>
        ))}

      </div>
    </main>
  );
}
