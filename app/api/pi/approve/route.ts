import { NextRequest, NextResponse } from "next/server";

const PI_API_URL = process.env.PI_API_URL;
const PI_API_KEY = process.env.PI_API_KEY;

export const dynamic = "force-dynamic";

type PiPayment = {
  identifier: string;
  status: "CREATED" | "APPROVED" | "COMPLETED" | "CANCELLED";
};

export async function POST(req: NextRequest) {
  try {

    if (!PI_API_URL || !PI_API_KEY) {
      return NextResponse.json(
        { error: "PI_ENV_MISSING" },
        { status: 500 }
      );
    }

    const body = (await req.json()) as { paymentId?: string };

    const paymentId = body.paymentId;

    if (!paymentId) {
      return NextResponse.json(
        { error: "MISSING_PAYMENT_ID" },
        { status: 400 }
      );
    }

    /* =====================================================
       VERIFY PAYMENT
    ===================================================== */

    const paymentRes = await fetch(
      `${PI_API_URL}/payments/${paymentId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Key ${PI_API_KEY}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!paymentRes.ok) {
      const err = await paymentRes.text();

      console.error("PI PAYMENT VERIFY FAIL:", err);

      return NextResponse.json(
        { error: "PAYMENT_NOT_FOUND" },
        { status: 404 }
      );
    }

    const payment = (await paymentRes.json()) as PiPayment;

    if (payment.status !== "CREATED") {
      return NextResponse.json(
        { error: "INVALID_PAYMENT_STATUS", status: payment.status },
        { status: 400 }
      );
    }

    /* =====================================================
       APPROVE PAYMENT
    ===================================================== */

    const approveRes = await fetch(
      `${PI_API_URL}/payments/${paymentId}/approve`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${PI_API_KEY}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!approveRes.ok) {
      const err = await approveRes.text();

      console.error("PI APPROVE FAIL:", err);

      return NextResponse.json(
        { error: "PI_APPROVE_FAILED" },
        { status: 500 }
      );
    }

    const approved = (await approveRes.json()) as PiPayment;

    return NextResponse.json({
      success: true,
      payment: approved,
    });

  } catch (err) {

    console.error("PI APPROVE ERROR:", err);

    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
