import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";

/* =========================
   Types
========================= */

type ReviewRow = {
  id: string;
  order_id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

type OrderCheckRow = {
  buyer_id: string;
  status: string;
};

/* =========================================================
   POST /api/reviews
   - Tạo review
========================================================= */
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
      typeof b.order_id === "string" ? b.order_id : null;

    const productId =
      typeof b.product_id === "string" ? b.product_id : null;

    const rawComment =
      typeof b.comment === "string" ? b.comment.trim() : "";

    const comment =
      rawComment.length > 0 ? rawComment : "Default review";

    const ratingRaw = b.rating;

    const rating =
      typeof ratingRaw === "number"
        ? ratingRaw
        : typeof ratingRaw === "string"
        ? Number(ratingRaw)
        : null;

    if (
      !orderId ||
      !productId ||
      rating === null ||
      Number.isNaN(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json(
        { error: "INVALID_REVIEW_DATA" },
        { status: 400 }
      );
    }

    /* =========================
       CHECK ORDER + PRODUCT
    ========================== */

    const orderCheck = await query<OrderCheckRow>(
      `
      select o.buyer_id, o.status
      from orders o
      join order_items oi on oi.order_id = o.id
      where o.id = $1
      and oi.product_id = $2
      limit 1
      `,
      [orderId, productId]
    );

    if (orderCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "PRODUCT_NOT_IN_ORDER" },
        { status: 404 }
      );
    }

    const order = orderCheck.rows[0];

    if (order.buyer_id !== user.pi_uid) {
      return NextResponse.json(
        { error: "FORBIDDEN_ORDER" },
        { status: 403 }
      );
    }

    const status = order.status.toLowerCase();

    if (status !== "completed" && status !== "received") {
      return NextResponse.json(
        { error: "ORDER_NOT_REVIEWABLE" },
        { status: 400 }
      );
    }


     const itemResult = await query<{
  id: string
  seller_id: string
  product_name: string
  thumbnail: string | null
}>(
  `
  select
    id,
    seller_id,
    product_name,
    thumbnail
  from order_items
  where order_id = $1
  and product_id = $2
  limit 1
  `,
  [orderId, productId]
);

if (itemResult.rows.length === 0) {
  return NextResponse.json(
    { error: "ORDER_ITEM_NOT_FOUND" },
    { status: 404 }
  );
}

const item = itemResult.rows[0];
    /* =========================
       CHECK REVIEW EXISTS
    ========================== */

    const existing = await query(
      `
      select 1
      from reviews
      where order_id = $1
      and product_id = $2
      and user_id = $3
      limit 1
      `,
      [orderId, productId, user.pi_uid]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "ALREADY_REVIEWED" },
        { status: 400 }
      );
    }

    /* =========================
       INSERT REVIEW
    ========================== */

    const insertResult = await query<ReviewRow>(
      `
      insert into reviews (
  order_id,
  order_item_id,
  product_id,
  seller_id,
  user_id,
  product_name,
  product_thumbnail,
  rating,
  comment
)
values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      returning *
      `,
     [
  orderId,
  item.id,
  productId,
  item.seller_id,
  user.pi_uid,
  item.product_name,
  item.thumbnail,
  rating,
  comment,
]
    );

    const review = insertResult.rows[0];

    /* =========================
       UPDATE PRODUCT AVG RATING
    ========================== */

    await query(
      `
      update products
      set rating_avg = (
        select avg(rating)
        from reviews
        where product_id = $1
      )
      where id = $1
      `,
      [productId]
    );

    return NextResponse.json({
      success: true,
      review,
    });

  } catch (error) {
    console.error("REVIEW ERROR:", error);

    return NextResponse.json(
      { error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/* =========================================================
   GET /api/reviews
   - Lấy danh sách review của user hiện tại
========================================================= */
export async function GET() {
  try {
    const user = await getUserFromBearer();
    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const result = await query<{
      order_id: string;
      product_id: string;
      rating: number;
      comment: string | null;
      created_at: string;
    }>(
      `
      select order_id, product_id, rating, comment, created_at
      from reviews
      where user_id = $1
      order by created_at desc
      `,
      [user.pi_uid]
    );

    return NextResponse.json({
      reviews: result.rows,
    });

  } catch (error) {
    console.error("GET REVIEWS ERROR:", error);

    return NextResponse.json(
      { error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
