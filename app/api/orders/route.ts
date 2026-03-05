import { NextRequest, NextResponse } from "next/server";
import { getOrderByPiPaymentId, createOrder } from "@/lib/db/orders";
import { verifyPiToken } from "@/lib/piAuth";

export async function POST(req: NextRequest) {
  try {

    /* =========================
       1️⃣ VERIFY TOKEN
    ========================= */
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Missing Authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    const user = await verifyPiToken(token);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid Pi token" },
        { status: 401 }
      );
    }

    /* =========================
       2️⃣ READ BODY
    ========================= */
    const body = await req.json();

    const {
      paymentId,
      txid,
      items,
      total,
      shipping,
    } = body;

    if (!paymentId || !txid) {
      return NextResponse.json(
        { error: "Missing payment data" },
        { status: 400 }
      );
    }

    /* =========================
       3️⃣ CHECK DUPLICATE
    ========================= */
    const existing = await getOrderByPiPaymentId(paymentId);

    if (existing) {
      return NextResponse.json({
        success: true,
        orderId: existing.id,
      });
    }

    /* =========================
       4️⃣ CREATE ORDER
    ========================= */
    const order = await createOrder({
      buyerPiUid: user.pi_uid,
      piPaymentId: paymentId,
      piTxid: txid,
      items,
      total,
      shipping,
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order creation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
    });

  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
