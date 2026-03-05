import { NextRequest, NextResponse } from "next/server";
import { verifyPiToken } from "@/lib/piAuth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {

    /* =========================
       VERIFY USER
    ========================= */

    const auth = req.headers.get("authorization");

    if (!auth) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const token = auth.replace("Bearer ", "").trim();

    const user = await verifyPiToken(token);

    if (!user?.pi_uid) {
      return NextResponse.json(
        { error: "INVALID_TOKEN" },
        { status: 401 }
      );
    }

    /* =========================
       BODY
    ========================= */

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
      console.error("PI VERIFY ERROR:", payment);

      return NextResponse.json(
        { error: "PI_PAYMENT_NOT_FOUND" },
        { status: 404 }
      );
    }

    /* =========================
       CHECK APPROVED
    ========================= */

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
        body: JSON.stringify({
          txid,
        }),
      }
    );

    const completeData = await completeRes.json();

    if (!completeRes.ok) {
      console.error("PI COMPLETE ERROR:", completeData);

      return NextResponse.json(
        { error: "PI_COMPLETE_FAILED" },
        { status: 500 }
      );
    }

    /* =========================
       RETURN SUCCESS
    ========================= */

    return NextResponse.json({
      success: true,
      paymentId,
      txid,
    });

  } catch (err) {
    console.error("💥 PI COMPLETE ERROR:", err);

    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
