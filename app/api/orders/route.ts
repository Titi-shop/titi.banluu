import { NextRequest, NextResponse } from "next/server";
import { getPiUser } from "@/lib/piAuth";
import { createOrder, getOrderByPiPaymentId } from "@/lib/db/orders";

export async function POST(req: NextRequest) {
  try {
    /* =========================
       1. VERIFY PI USER
    ========================= */
    const user = await getPiUser(req);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    /* =========================
       2. READ BODY
    ========================= */
    const body = await req.json();

    const {
      paymentId,
      txid,
      items,
      total,
      shipping
    } = body;

    if (!paymentId || !txid) {
      return NextResponse.json(
        { error: "Missing Pi payment data" },
        { status: 400 }
      );
    }

    /* =========================
       3. CHECK DUPLICATE ORDER
    ========================= */
    const existing = await getOrderByPiPaymentId(paymentId);

    if (existing) {
      return NextResponse.json({
        success: true,
        orderId: existing.id
      });
    }

    /* =========================
       4. VALIDATE ITEMS
    ========================= */
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "No items" },
        { status: 400 }
      );
    }

    /* =========================
       5. CREATE ORDER
    ========================= */
    const order = await createOrder({
      buyerPiUid: user.pi_uid,
      piPaymentId: paymentId,
      piTxid: txid,
      items,
      total,
      shipping
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order creation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: order.id
    });

  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
