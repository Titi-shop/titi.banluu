import { NextRequest, NextResponse } from "next/server";
import { verifyPiToken } from "@/lib/piAuth";
import { createOrder, getOrderByPiPaymentId } from "@/lib/db/orders";

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

    if (!user?.pi_uid) {
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
      shipping
    } = body;

    if (!paymentId || !txid) {
      return NextResponse.json(
        { error: "Missing payment data" },
        { status: 400 }
      );
    }

    /* =========================
       3️⃣ DUPLICATE ORDER CHECK
    ========================= */
    const existing = await getOrderByPiPaymentId(paymentId);

    if (existing) {
      return NextResponse.json({
        success: true,
        orderId: existing.id
      });
    }

    /* =========================
       4️⃣ VALIDATE ITEMS
    ========================= */
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items invalid" },
        { status: 400 }
      );
    }

    /* =========================
       5️⃣ CREATE ORDER
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
