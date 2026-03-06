/* =========================================================
   app/api/seller/orders/route.ts
   - NETWORK–FIRST Pi Auth
   - AUTH-CENTRIC + RBAC
   - DIRECT SQL
   - MULTI VENDOR SAFE
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
  if (!value) return;

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

    const params: unknown[] = [user.pi_uid];

    let statusFilter = "";

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
        o.order_number,
        o.created_at,
        o.status,

        o.shipping_name,
        o.shipping_phone,
        o.shipping_address,
        o.shipping_provider,
        o.shipping_country,
        o.shipping_postal_code,

        sum(oi.total_price)::int as total,

        json_agg(
          json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', oi.product_name,
            'thumbnail', oi.thumbnail,
            'images', oi.images,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price,
            'status', oi.status
          )
        ) as order_items

      from order_items oi
      join orders o
        on o.id = oi.order_id

      where oi.seller_id = $1
      ${statusFilter}

      group by
        o.id,
        o.order_number,
        o.created_at,
        o.status,
        o.shipping_name,
        o.shipping_phone,
        o.shipping_address,
        o.shipping_provider,
        o.shipping_country,
        o.shipping_postal_code

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
