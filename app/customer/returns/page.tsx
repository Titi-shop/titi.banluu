"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ReturnRecord = {
  id: string;
  order_id: string;
  status: string;
  created_at: string;
  return_tracking_code: string | null;
  refunded_at: string | null;
};

export default function ReturnsPage() {
  const router = useRouter();
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;

      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch("/api/returns", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setReturns(data);
      }

      setLoading(false);
    };

    load();
  }, []);

  function getStatusColor(status: string) {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "approved":
        return "bg-green-100 text-green-700";
      case "shipped":
        return "bg-blue-100 text-blue-700";
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

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-xl mx-auto p-4 space-y-4">
        <h1 className="text-lg font-semibold">My Returns</h1>

        {returns.length === 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm text-center text-gray-500">
            No return requests yet
          </div>
        )}

        {returns.map((r) => (
          <div
            key={r.id}
            onClick={() => router.push(`/customer/returns/${r.id}`)}
            className="bg-white rounded-xl shadow-sm p-4 cursor-pointer hover:shadow-md transition space-y-3"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Return #{r.id}</p>
                <p className="text-xs text-gray-400">
                  Order: {r.order_id}
                </p>
              </div>

              <span
                className={`px-3 py-1 text-xs rounded-full ${getStatusColor(
                  r.status
                )}`}
              >
                {r.status}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-gray-400">
              <span>Pending</span>
              <span>→</span>
              <span>Approved</span>
              <span>→</span>
              <span>Shipped</span>
              <span>→</span>
              <span>Refunded</span>
            </div>

            {r.return_tracking_code && (
              <div className="text-xs text-blue-600">
                Tracking: {r.return_tracking_code}
              </div>
            )}

            {r.refunded_at && (
              <div className="text-xs text-green-600">
                Refunded at: {new Date(r.refunded_at).toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
