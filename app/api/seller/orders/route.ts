/* =========================================================
   app/api/seller/orders/route.ts
   - NETWORK–FIRST Pi Auth
   - AUTH-CENTRIC + RBAC
   - DIRECT SQL (NO db/orders)
   - Bearer ONLY
========================================================= */

import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { resolveRole } from "@/lib/auth/resolveRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
   TYPES
========================= */

type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipping"
  | "completed"
  | "cancelled"
  | "returned";

/* =========================
   HELPERS
========================= */

function parseOrderStatus(
  value: string | null
): OrderStatus | undefined {
  if (!value) return undefined;

  const allowed: OrderStatus[] = [
    "pending",
    "confirmed",
    "shipping",
    "completed",
    "cancelled",
    "returned",
  ];

  return allowed.includes(value as OrderStatus)
    ? (value as OrderStatus)
    : undefined;
}

/* =========================================================
   GET /api/seller/orders
========================================================= */

export async function GET(req: Request) {
  try {
    /* =========================
       1️⃣ AUTH
    ========================= */

    const user = await getUserFromBearer();

    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }

    /* =========================
       2️⃣ RBAC
    ========================= */

    const role = await resolveRole(user);

    if (role !== "seller" && role !== "admin") {
      return NextResponse.json([], { status: 200 });
    }

    /* =========================
       3️⃣ QUERY PARAM
    ========================= */

    const { searchParams } = new URL(req.url);

    const status = parseOrderStatus(
      searchParams.get("status")
    );

    let statusFilter = "";
    const params: unknown[] = [user.pi_uid];

    if (status) {
      statusFilter = "and oi.status = $2";
      params.push(status);
    }

    /* =========================
       4️⃣ DATABASE
    ========================= */

    const { rows } = await query(
      `
      select
        o.id,
        o.created_at,

        sum(oi.total_price)::int as total,

        json_build_object(
          'name', o.buyer_name,
          'phone', o.buyer_phone,
          'address', o.buyer_address
        ) as buyer,

        json_agg(
          json_build_object(
            'product_id', oi.product_id,
            'quantity', oi.quantity,
            'price', oi.unit_price,
            'product', json_build_object(
              'id', oi.product_id,
              'name', oi.product_name,
              'images', oi.images
            )
          )
        ) as order_items

      from order_items oi
      join orders o
        on o.id = oi.order_id

      where oi.seller_id = $1
      ${statusFilter}

      group by o.id
      order by o.created_at desc
      `,
      params
    );

    return NextResponse.json(rows);
  } catch (err) {
    console.error("SELLER ORDERS ERROR:", err);

    return NextResponse.json([], { status: 200 });
  }
}
