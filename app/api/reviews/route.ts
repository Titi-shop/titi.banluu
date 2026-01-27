import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

/**
 * API: /api/reviews
 * - Lưu và lấy danh sách đánh giá
 * - NO any
 * - KV-safe
 * - Pi Browser friendly
 */

/* =======================
   Types
======================= */

type Review = {
  id: number;
  orderId: string;
  rating: number; // 1–5 (validate ở client hoặc server nếu cần)
  comment: string;
  username: string;
  createdAt: string;
};

type ReviewsKV = Review[];

/* =======================
   Utils
======================= */

function isReview(value: unknown): value is Review {
  if (typeof value !== "object" || value === null) return false;

  const v = value as Record<string, unknown>;

  return (
    typeof v.id === "number" &&
    typeof v.orderId === "string" &&
    typeof v.rating === "number" &&
    typeof v.comment === "string" &&
    typeof v.username === "string" &&
    typeof v.createdAt === "string"
  );
}

function normalizeReviews(data: unknown): ReviewsKV {
  if (!data) return [];

  // KV trả về array
  if (Array.isArray(data)) {
    return data.filter(isReview);
  }

  // KV trả về JSON string
  if (typeof data === "string") {
    try {
      const parsed: unknown = JSON.parse(data);
      return Array.isArray(parsed) ? parsed.filter(isReview) : [];
    } catch {
      return [];
    }
  }

  // KV lỡ lưu object { id: review }
  if (typeof data === "object") {
    return Object.values(data).filter(isReview);
  }

  return [];
}

/* =======================
   GET /api/reviews
======================= */

export async function GET() {
  try {
    const stored = await kv.get("reviews");
    const reviews = normalizeReviews(stored);

    return NextResponse.json({
      success: true,
      reviews,
    });
  } catch (err) {
    console.error("❌ Lỗi đọc reviews:", err);
    return NextResponse.json(
      { success: false, error: "Lỗi đọc dữ liệu reviews" },
      { status: 500 }
    );
  }
}

/* =======================
   POST /api/reviews
======================= */

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();

    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { success: false, error: "Body không hợp lệ" },
        { status: 400 }
      );
    }

    const b = body as Record<string, unknown>;

    const orderId = typeof b.orderId === "string" ? b.orderId : null;
    const rating = typeof b.rating === "number" ? b.rating : null;
    const username = typeof b.username === "string" ? b.username : null;
    const comment = typeof b.comment === "string" ? b.comment : "";

    if (!orderId || !rating || !username) {
      return NextResponse.json(
        { success: false, error: "Thiếu orderId, rating hoặc username" },
        { status: 400 }
      );
    }

    const stored = await kv.get("reviews");
    const reviews = normalizeReviews(stored);

    const newReview: Review = {
      id: Date.now(),
      orderId,
      rating,
      comment,
      username,
      createdAt: new Date().toISOString(),
    };

    reviews.unshift(newReview);

    await kv.set("reviews", reviews);

    /* -----------------------
       Update reviewed in orders
    ------------------------ */
    try {
      const ordersRaw = await kv.get("orders");

      if (Array.isArray(ordersRaw)) {
        const index = ordersRaw.findIndex(
          (o) =>
            typeof o === "object" &&
            o !== null &&
            "id" in o &&
            String((o as { id: unknown }).id) === orderId
        );

        if (index !== -1) {
          const order = ordersRaw[index] as Record<string, unknown>;
          order.reviewed = true;
          order.updatedAt = new Date().toISOString();
          await kv.set("orders", ordersRaw);
        }
      }
    } catch (err) {
      console.warn("⚠️ Không thể cập nhật reviewed trong orders:", err);
    }

    return NextResponse.json({
      success: true,
      review: newReview,
    });
  } catch (err) {
    console.error("❌ Lỗi lưu review:", err);
    return NextResponse.json(
      { success: false, error: "Không thể lưu đánh giá" },
      { status: 500 }
    );
  }
}
