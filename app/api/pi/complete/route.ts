import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { createOrder, getOrderByPaymentId } from "@/lib/db/orders";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    if (!process.env.PI_API_KEY) {
      return NextResponse.json(
        { error: "SERVER_MISCONFIGURED" },
        { status: 500 }
      );
    }

    /* =========================
       1️⃣ AUTH USER
    ========================= */
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
       2️⃣ VERIFY PAYMENT
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

    if (payment.user_uid !== user.pi_uid) {
      return NextResponse.json(
        { error: "PAYMENT_OWNER_MISMATCH" },
        { status: 403 }
      );
    }

    /* =========================
       3️⃣ COMPLETE IF APPROVED
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
        // 🔥 Auto cancel nếu complete fail
        await fetch(
          `https://api.minepi.com/v2/payments/${paymentId}/cancel`,
          {
            method: "POST",
            headers: {
              Authorization: `Key ${process.env.PI_API_KEY}`,
            },
          }
        );

        return NextResponse.json(
          { error: "COMPLETE_FAILED_AUTO_CANCELLED" },
          { status: 500 }
        );
      }
    }

    /* =========================
       4️⃣ VERIFY FINAL STATE
    ========================= */
    const finalRes = await fetch(
      `https://api.minepi.com/v2/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Key ${process.env.PI_API_KEY}`,
        },
      }
    );

    if (!finalRes.ok) {
      return NextResponse.json(
        { error: "FINAL_VERIFY_FAILED" },
        { status: 400 }
      );
    }

    const finalPayment = await finalRes.json();

    if (finalPayment.status !== "completed") {
      return NextResponse.json(
        { error: "PAYMENT_NOT_COMPLETED" },
        { status: 400 }
      );
    }

    if (finalPayment.user_uid !== user.pi_uid) {
      return NextResponse.json(
        { error: "PAYMENT_OWNER_MISMATCH" },
        { status: 403 }
      );
    }

    if (
      !finalPayment.transaction ||
      finalPayment.transaction.txid !== txid
    ) {
      return NextResponse.json(
        { error: "TXID_MISMATCH" },
        { status: 400 }
      );
    }

    /* =========================
       5️⃣ IDEMPOTENT CHECK
    ========================= */
    const existing = await getOrderByPaymentId(paymentId);
    if (existing) {
      return NextResponse.json(existing);
    }

    /* =========================
       6️⃣ VALIDATE METADATA
    ========================= */
    const metadata = finalPayment.metadata;

    if (!metadata?.shipping || !metadata?.item) {
      return NextResponse.json(
        { error: "INVALID_METADATA" },
        { status: 400 }
      );
    }

    if (
      typeof finalPayment.amount !== "number" ||
      finalPayment.amount <= 0
    ) {
      return NextResponse.json(
        { error: "INVALID_AMOUNT" },
        { status: 400 }
      );
    }

    /* =========================
       7️⃣ CREATE ORDER
    ========================= */
    const order = await createOrder({
      buyerPiUid: user.pi_uid,
      items: [metadata.item],
      total: finalPayment.amount,
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
