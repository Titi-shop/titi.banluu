import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {

    const body = await req.json();

    const { paymentId, txid } = body;

    if (!paymentId || !txid) {
      return NextResponse.json(
        { error: "INVALID_PAYMENT_DATA" },
        { status: 400 }
      );
    }

    /* =========================
       VERIFY PAYMENT FROM PI
    ========================= */

    const paymentRes = await fetch(
      `${process.env.PI_API_URL}/${paymentId}`,
      {
        headers: {
          Authorization: `Key ${process.env.PI_API_KEY}`,
        },
      }
    );

    const payment = await paymentRes.json();

    if (!paymentRes.ok) {
      return NextResponse.json(
        { error: "PI_PAYMENT_NOT_FOUND" },
        { status: 404 }
      );
    }

    if (!payment.approved) {
      return NextResponse.json(
        { error: "PAYMENT_NOT_APPROVED" },
        { status: 400 }
      );
    }

    /* =========================
       COMPLETE PAYMENT
    ========================= */

    const completeRes = await fetch(
      `${process.env.PI_API_URL}/${paymentId}/complete`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${process.env.PI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ txid }),
      }
    );

    if (!completeRes.ok) {
      return NextResponse.json(
        { error: "PI_COMPLETE_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentId,
      txid,
    });

  } catch (err) {

    console.error("PI COMPLETE ERROR:", err);

    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
