"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { getPiAccessToken } from "@/lib/piAuth";
import { formatPi } from "@/lib/pi";
import { useAuth } from "@/context/AuthContext";
/* =========================
TYPES
========================= */

type OrderStatus =
  | "pending"
  | "pickup"
  | "shipping"
  | "completed"
  | "cancelled";

interface OrderItem {

  product_id: string;

  product_name: string;
  thumbnail: string;
  images?: string[];

  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {

  id: string;
  order_number: string;

  total: number;
  status: OrderStatus;

  order_items: OrderItem[];
}

interface ReviewMap {
  [orderId: string]: boolean;
}

/* =========================
PAGE
========================= */

export default function CompletedOrdersPage() {

  const { t } = useTranslation();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [reviewedMap, setReviewedMap] = useState<ReviewMap>({});
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");

  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    void loadOrders();
  }, []);

  /* =========================
  LOAD COMPLETED ORDERS
  ========================= */

  async function loadOrders(): Promise<void> {

    try {

      const token = await getPiAccessToken();

      const res = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!res.ok) throw new Error("UNAUTHORIZED");

      const data = await res.json();

      const rawOrders: Order[] = data.orders ?? [];

      const completed = rawOrders.filter(
        (o) => o.status === "completed"
      );

      setOrders(completed);

      /* LOAD EXISTING REVIEWS */

      try {

        const reviewRes = await fetch("/api/reviews", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (reviewRes.ok) {

          const data: {
            reviews: { order_id: string }[];
          } = await reviewRes.json();

          const map: ReviewMap = {};

          data.reviews.forEach((r) => {
            map[r.order_id] = true;
          });

          setReviewedMap(map);

        }

      } catch (err) {

        console.error("Load reviews error:", err);

      }

    } catch (err) {

      console.error("Load completed error:", err);
      setOrders([]);

    } finally {

      setLoading(false);

    }

  }

  /* =========================
  SUBMIT REVIEW
  ========================= */

  async function submitReview(
    orderId: string,
    productId: string
  ) {

    try {

      setReviewError(null);

      const token = await getPiAccessToken();

      const res = await fetch("/api/reviews", {

        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({

          order_id: orderId,
          product_id: productId,

          rating,

          comment: comment.trim() || t.default_review_comment,

        }),

      });

      const data = await res.json();

      if (!res.ok) {

        if (data?.error === "ALREADY_REVIEWED") {

          setReviewError(
            t.already_reviewed ?? "Already reviewed"
          );

        } else {

          setReviewError(
            t.review_failed ?? "Review failed"
          );

        }

        return;

      }

      setReviewedMap((prev) => ({
        ...prev,
        [orderId]: true,
      }));

      setActiveReviewId(null);
      setComment("");
      setRating(5);

    } catch {

      setReviewError(
        t.review_failed ?? "Review failed"
      );

    }

  }

  const totalPi = orders.reduce(
    (sum, o) => sum + Number(o.total),
    0
  );

  return (
    <main className="min-h-screen bg-gray-100 pb-24">

      {/* HEADER */}

      <header className="bg-orange-500 text-white px-4 py-4">

        <div className="bg-orange-400 rounded-lg p-4">

          <p className="text-sm opacity-90">
            {t.order_info}
          </p>

          <p className="text-xs opacity-80 mt-1">
            {t.orders}: {orders.length} · π{formatPi(totalPi)}
          </p>

        </div>

      </header>

      {/* CONTENT */}

      <section className="mt-6 px-4">

        {loading ? (

          <p className="text-center text-gray-400">
            {t.loading_orders}
          </p>

        ) : orders.length === 0 ? (

          <div className="flex flex-col items-center justify-center mt-16 text-gray-400">

            <div className="w-24 h-24 bg-gray-200 rounded-full mb-4 opacity-40" />

            <p>{t.no_completed_orders}</p>

          </div>

        ) : (

          <div className="space-y-4">

            {orders.map((o) => (

              <div
                key={o.id}
                onClick={() => router.push(`/customer/orders/${o.id}`)}
                className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition"
              >

                {/* HEADER */}

                <div className="flex justify-between items-start px-4 py-3 border-b">

                  <span className="font-semibold text-xs break-all max-w-[60%]">
                    #{o.order_number}
                  </span>

                  <span className="text-orange-500 text-xs text-right max-w-[120px] leading-tight">
                    {t.status_completed}
                  </span>

                </div>

                {/* PRODUCTS */}

                <div className="px-4 py-3 space-y-3">

                  {o.order_items.map((item, idx) => (

                    <div
                      key={idx}
                      className="flex gap-3 items-center min-h-[70px]"
                    >

                      <div className="w-14 h-14 bg-gray-100 rounded overflow-hidden flex-shrink-0">

                        <img
                          src={item.thumbnail || "/placeholder.png"}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />

                      </div>

                      <div className="flex-1 min-w-0">

                        <p className="text-sm font-medium line-clamp-2 min-h-[40px]">
                          {item.product_name}
                        </p>

                        <p className="text-xs text-gray-500">
                          x{item.quantity} · π
                          {formatPi(item.unit_price)}
                        </p>

                      </div>

                    </div>

                  ))}

                </div>

                {/* FOOTER */}

                <div className="px-4 py-3 border-t relative">

                  <p className="text-sm font-semibold mb-3">
                    {t.total}: π{formatPi(o.total)}
                  </p>

                  {reviewedMap[o.id] ? (

                    <div className="relative inline-block">

                      <button
                        disabled
                        className="px-4 py-1.5 text-sm bg-green-100 text-green-600 rounded-md"
                      >
                        {t.order_review}
                      </button>

                      <span className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                        ✓
                      </span>

                    </div>

                  ) : activeReviewId === o.id ? (

                    <div className="space-y-3">

                      <div className="flex gap-1">

                        {[1,2,3,4,5].map((star) => (

                          <button
                            key={star}
                            onClick={(e) => {
                              e.stopPropagation();
                              setRating(star);
                            }}
                            className={`text-lg ${
                              star <= rating
                                ? "text-yellow-500"
                                : "text-gray-300"
                            }`}
                          >
                            ★
                          </button>

                        ))}

                      </div>

                      <textarea
                        value={comment}
                        onClick={(e)=>e.stopPropagation()}
                        onChange={(e)=>setComment(e.target.value)}
                        placeholder={t.default_review_comment}
                        className="w-full border rounded-md p-2 text-sm"
                      />

                      {reviewError && (
                        <p className="text-sm text-red-500">
                          {reviewError}
                        </p>
                      )}

                      <button
                        onClick={(e)=>{
                          e.stopPropagation();
                          submitReview(
                            o.id,
                            o.order_items?.[0]?.product_id
                          );
                        }}
                        className="px-4 py-1.5 text-sm bg-orange-500 text-white rounded-md hover:bg-orange-600 transition"
                      >
                        {t.submit_review}
                      </button>

                    </div>

                  ) : (

                    <button
                      onClick={(e)=>{
                        e.stopPropagation();
                        setActiveReviewId(o.id);
                        setComment(t.default_review_comment);
                      }}
                      className="px-4 py-1.5 text-sm border border-orange-500 text-orange-500 rounded-md hover:bg-orange-500 hover:text-white transition"
                    >
                      {t.review_orders}
                    </button>

                  )}

                </div>

              </div>

            ))}

          </div>

        )}

      </section>

    </main>
  );
}
