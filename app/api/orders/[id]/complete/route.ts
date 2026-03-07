import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getPiUserFromToken } from "@/lib/piAuth";
import { resolveRole } from "@/lib/auth/resolveRole";

export const dynamic = "force-dynamic";

/* =========================
PATCH /api/orders/[id]/complete
Seller complete delivery
shipping → completed
========================= */

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    /* =========================
       AUTH
    ========================= */

    const user = await getPiUserFromToken(req);

    const role = await resolveRole(user);

    if (role !== "seller") {
      return NextResponse.json(
        { error: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const orderId = params.id;

    if (!orderId) {
      return NextResponse.json(
        { error: "INVALID_ORDER_ID" },
        { status: 400 }
      );
    }

    /* =========================
       CHECK SELLER OWNERSHIP
    ========================= */

    const { rows } = await query(
      `
      select
        o.id,
        o.status
      from orders o
      join order_items oi
        on oi.order_id = o.id
      where
        o.id=$1
        and oi.seller_id=$2
      limit 1
      `,
      [orderId, user.pi_uid]
    );

    const order = rows[0];

    if (!order) {
      return NextResponse.json(
        { error: "ORDER_NOT_FOUND" },
        { status: 404 }
      );
    }

    /* =========================
       STATUS GUARD
    ========================= */

    if (order.status !== "shipping") {
      return NextResponse.json(
        { error: "INVALID_STATUS_TRANSITION" },
        { status: 400 }
      );
    }

    /* =========================
       UPDATE ORDER
    ========================= */

    await query(
      `
      update orders
      set
        status='completed'
      where id=$1
      `,
      [orderId]
    );

    return NextResponse.json({
      success: true
    });

  } catch (err) {

    console.error("ORDER COMPLETE ERROR:", err);

    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
