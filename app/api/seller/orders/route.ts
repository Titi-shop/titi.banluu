/* =========================================================
   app/api/seller/orders/route.ts
   HIGH PERFORMANCE VERSION
========================================================= */

import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { resolveRole } from "@/lib/auth/resolveRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipping"
  | "completed"
  | "cancelled"
  | "returned";

function parseOrderStatus(v: string | null): OrderStatus | undefined {
  if (!v) return;

  const allowed: OrderStatus[] = [
    "pending",
    "confirmed",
    "shipping",
    "completed",
    "cancelled",
    "returned",
  ];

  return allowed.includes(v as OrderStatus)
    ? (v as OrderStatus)
    : undefined;
}

export async function GET(req: Request) {
  try {
    /* ================= AUTH ================= */

    const user = await getUserFromBearer();

    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }

    const role = await resolveRole(user);

    if (role !== "seller" && role !== "admin") {
      return NextResponse.json([], { status: 200 });
    }

    /* ================= PARAM ================= */

    const { searchParams } = new URL(req.url);

    const status = parseOrderStatus(searchParams.get("status"));

    const page = Number(searchParams.get("page") ?? "1");
    const limit = 20;

    const offset = (page - 1) * limit;

    const params: unknown[] = [user.pi_uid];

    let statusFilter = "";

    if (status) {
      params.push(status);
      statusFilter = `and oi.status = $2`;
    }

    /* ================= QUERY ================= */

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

        (
          select sum(total_price)::int
          from order_items
          where order_id = o.id
        ) as total,

        (
          select json_agg(
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
          )
          from order_items oi
          where oi.order_id = o.id
          and oi.seller_id = $1
          ${statusFilter}
        ) as order_items

      from orders o

      where exists (
        select 1
        from order_items oi
        where oi.order_id = o.id
        and oi.seller_id = $1
        ${statusFilter}
      )

      order by o.created_at desc
      limit ${limit}
      offset ${offset}
      `,
      params
    );

    return NextResponse.json(rows);
  } catch (err) {
    console.error("SELLER ORDERS ERROR:", err);

    return NextResponse.json([], { status: 200 });
  }
}
