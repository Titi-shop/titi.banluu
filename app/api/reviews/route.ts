import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { resolveRole } from "@/lib/auth/resolveRole";

/* =======================
   Types
======================= */

type Review = {
  id: number;
  orderId: string;
  rating: number;
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

  if (Array.isArray(data)) {
    return data.filter(isReview);
  }

  if (typeof data === "string") {
    try {
      const parsed: unknown = JSON.parse(data);
      return Array.isArray(parsed)
        ? parsed.filter(isReview)
        : [];
    } catch {
      return [];
    }
  }

  if (typeof data === "object") {
    return Object.values(data).filter(isReview);
  }

  return [];
}

/* =======================
   POST /api/reviews
======================= */

export async function POST(req: Request) {
  try {
    /* 🔐 AUTH */
    const user = await getUserFromBearer();
    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const role = await resolveRole(user);
    if (role !== "customer") {
      return NextResponse.json(
        { error: "FORBIDDEN" },
        { status: 403 }
      );
    }

    /* 📦 BODY */
    const body: unknown = await req.json().catch(() => null);
    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { error: "INVALID_BODY" },
        { status: 400 }
      );
    }

    const b = body as Record<string, unknown>;

    const orderId =
      typeof b.orderId === "string" ? b.orderId : null;
    const rating =
      typeof b.rating === "number" ? b.rating : null;
    const comment =
      typeof b.comment === "string" ? b.comment : "";

    if (!orderId || !rating) {
      return NextResponse.json(
        { error: "INVALID_REVIEW_DATA" },
        { status: 400 }
      );
    }

    /* 📦 LOAD EXISTING */
    const stored = await kv.get("reviews");
    const reviews = normalizeReviews(stored);

    const newReview: Review = {
      id: Date.now(),
      orderId,
      rating,
      comment,
      username: user.username, // ✅ từ Pi token
      createdAt: new Date().toISOString(),
    };

    reviews.unshift(newReview);
    await kv.set("reviews", reviews);

    return NextResponse.json({
      success: true,
      review: newReview,
    });
  } catch (err) {
    console.error("REVIEW ERROR:", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
