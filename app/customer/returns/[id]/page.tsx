"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";
import { getPiAccessToken } from "@/lib/piAuth";

type ReturnRecord = {
  id: string;
  order_id: string;
  status: string;
  reason: string;
  images: string[];
  seller_note: string | null;
  return_tracking_code: string | null;
  return_shipping_address: string | null;
  created_at: string;
  refunded_at: string | null;
};

const STATUS_STEPS = [
  "pending",
  "approved",
  "shipped",
  "received",
  "refunded",
];

export default function ReturnDetailPage() {

  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { user, loading: authLoading } = useAuth();

  const [data, setData] = useState<ReturnRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingCode, setTrackingCode] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {

    if (authLoading) return;
    if (!user) return;

    void loadReturn();

  }, [authLoading, user, id]);

  /* =========================
  LOAD RETURN
  ========================= */

  async function loadReturn(): Promise<void> {

    if (authLoading) return;
    if (!user) return;

    try {

      const token = await getPiAccessToken();
      if (!token) return;

      const res = await fetch(`/api/returns/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!res.ok) throw new Error("LOAD_FAILED");

      const result = await res.json();

      setData(result);
      setTrackingCode(result.return_tracking_code || "");

    } catch (err) {

      console.error("Load return detail error:", err);

    } finally {

      setLoading(false);

    }

  }

  /* =========================
  SUBMIT TRACKING
  ========================= */

  async function handleSubmitTracking() {

    if (!trackingCode) return;
    if (authLoading) return;
    if (!user) return;

    try {

      setSaving(true);

      const token = await getPiAccessToken();
      if (!token) return;

      const res = await fetch(`/api/returns/${id}/ship`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trackingCode }),
      });

      if (!res.ok) throw new Error("SUBMIT_FAILED");

      await loadReturn();

    } catch (err) {

      console.error("Submit tracking error:", err);

    } finally {

      setSaving(false);

    }

  }

  if (loading || authLoading)
    return <div className="p-6">{t.loading}</div>;

  if (!data)
    return <div className="p-6">{t.not_found}</div>;

  const currentStepIndex = STATUS_STEPS.indexOf(data.status);

  return (
    <main className="min-h-screen bg-gray-50 pb-16">

      {/* HEADER */}
      <div className="flex items-center bg-white p-4 shadow-sm">
        <button onClick={() => router.back()}>
          <ArrowLeft size={22} />
        </button>
        <h1 className="mx-auto font-semibold text-lg">
          {t.return} #{data.id}
        </h1>
      </div>

      <div className="max-w-xl mx-auto p-4 space-y-6">

        {/* TIMELINE */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex justify-between text-xs">
            {STATUS_STEPS.map((step, index) => (
              <div key={step} className="flex flex-col items-center flex-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px]
                    ${index <= currentStepIndex ? "bg-orange-500" : "bg-gray-300"}`}
                >
                  {index + 1}
                </div>
                <span className="mt-2 capitalize text-center">
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* BASIC INFO */}
        <div className="bg-white p-4 rounded-xl shadow-sm space-y-3">
          <p><b>{t.order}:</b> {data.order_id}</p>
          <p><b>{t.reason}:</b> {data.reason}</p>

          {data.images?.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {data.images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  className="w-full h-24 object-cover rounded border"
                />
              ))}
            </div>
          )}
        </div>

        {/* STATUS CONTENT */}

        {data.status === "pending" && (
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-orange-600 font-medium">
              {t.waiting_seller_approval}
            </p>
          </div>
        )}

        {data.status === "rejected" && (
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-red-600 font-medium">
              {t.request_rejected}
            </p>
            {data.seller_note && (
              <p className="text-sm text-gray-600 mt-2">
                {t.seller_note}: {data.seller_note}
              </p>
            )}
          </div>
        )}

        {data.status === "approved" && (
          <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
            <p className="font-semibold text-green-600">
              {t.return_approved}
            </p>

            <div className="bg-gray-100 p-3 rounded text-sm">
              <b>{t.return_address}:</b><br />
              {data.return_shipping_address}
            </div>

            <input
              type="text"
              placeholder={t.enter_tracking_code}
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              className="w-full border p-3 rounded-lg"
            />

            <button
              onClick={handleSubmitTracking}
              disabled={saving}
              className="w-full bg-orange-500 text-white py-2 rounded-lg"
            >
              {saving ? t.processing : t.confirm_shipment}
            </button>
          </div>
        )}

        {data.status === "shipped" && (
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="font-semibold text-blue-600">
              {t.item_shipped}
            </p>
            <p className="text-sm mt-2">
              {t.tracking_code}: {data.return_tracking_code}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {t.waiting_seller_receive}
            </p>
          </div>
        )}

        {data.status === "received" && (
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="font-semibold text-purple-600">
              {t.seller_received_item}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {t.refund_processing}
            </p>
          </div>
        )}

        {data.status === "refunded" && (
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="font-semibold text-green-700">
              {t.refund_completed}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {t.refunded_at}: {data.refunded_at}
            </p>
          </div>
        )}

      </div>
    </main>
  );
}
