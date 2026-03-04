import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { createOrder, getOrderByPaymentId } from "@/lib/db/orders";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getUserFromBearer();

    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { paymentId, txid } = await req.json();

    if (!paymentId || !txid) {
      return NextResponse.json(
        { error: "MISSING_PAYMENT_DATA" },
        { status: 400 }
      );
    }

    /* =========================
       1️⃣ VERIFY PAYMENT
    ========================= */
    const verifyRes = await fetch(
      `https://api.minepi.com/v2/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Key ${process.env.PI_API_KEY}`,
        },
      }
    );

    if (!verifyRes.ok) {
      return NextResponse.json(
        { error: "VERIFY_FAILED" },
        { status: 400 }
      );
    }

    const payment = await verifyRes.json();

    if (
      payment.status !== "approved" &&
      payment.status !== "completed"
    ) {
      return NextResponse.json(
        { error: "INVALID_PAYMENT_STATUS" },
        { status: 400 }
      );
    }

    /* =========================
       2️⃣ COMPLETE IF NEEDED
    ========================= */
    if (payment.status === "approved") {
      const completeRes = await fetch(
        `https://api.minepi.com/v2/payments/${paymentId}/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Key ${process.env.PI_API_KEY}`,
          },
          body: JSON.stringify({ txid }),
        }
      );

      if (!completeRes.ok) {
        return NextResponse.json(
          { error: "COMPLETE_FAILED" },
          { status: 500 }
        );
      }
    }

    /* =========================
       3️⃣ ENSURE ORDER EXISTS
       (IDEMPOTENT)
    ========================= */

    const existing = await getOrderByPaymentId(paymentId);

    if (existing) {
      return NextResponse.json(existing);
    }

    const metadata = payment.metadata;

    if (!metadata?.shipping || !metadata?.item) {
      return NextResponse.json(
        { error: "INVALID_METADATA" },
        { status: 400 }
      );
    }

    const order = await createOrder({
      buyerPiUid: user.pi_uid,
      items: [metadata.item],
      total: payment.amount,
      shipping: metadata.shipping,
      pi_payment_id: paymentId,
      pi_txid: txid,
    });

    if (!order) {
      return NextResponse.json(
        { error: "ORDER_CREATION_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json(order);

  } catch (err) {
    console.error("💥 PI COMPLETE ERROR:", err);
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
