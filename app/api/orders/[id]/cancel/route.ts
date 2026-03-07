import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getPiUserFromToken } from "@/lib/piAuth";

export const dynamic = "force-dynamic";

/* =========================
PATCH /api/orders/[id]/cancel
Buyer cancel order
pending → cancelled
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

    const orderId = params.id;

    if (!orderId) {
      return NextResponse.json(
        { error: "INVALID_ORDER_ID" },
        { status: 400 }
      );
    }

    /* =========================
       BODY
    ========================= */

    const body = await req.json().catch(() => ({}));

    const cancelReason =
      body.cancel_reason ?? "buyer_cancelled";

    /* =========================
       LOAD ORDER
    ========================= */

    const { rows } = await query(
      `
      select id, buyer_id, status
      from orders
      where id=$1
      `,
      [orderId]
    );

    const order = rows[0];

    if (!order) {
      return NextResponse.json(
        { error: "ORDER_NOT_FOUND" },
        { status: 404 }
      );
    }

    /* =========================
       OWNER CHECK
    ========================= */

    if (order.buyer_id !== user.pi_uid) {
      return NextResponse.json(
        { error: "FORBIDDEN" },
        { status: 403 }
      );
    }

    /* =========================
       STATUS GUARD
    ========================= */

    if (order.status !== "pending") {
      return NextResponse.json(
        { error: "ORDER_CANNOT_BE_CANCELLED" },
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
        status='cancelled',
        cancel_reason=$2,
        cancelled_at=now()
      where id=$1
      `,
      [orderId, cancelReason]
    );

    return NextResponse.json({
      success: true
    });

  } catch (err) {

    console.error("ORDER CANCEL ERROR:", err);

    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
