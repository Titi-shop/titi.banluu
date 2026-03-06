import { NextRequest, NextResponse } from "next/server";

const PI_API_URL = process.env.PI_API_URL!;
const PI_API_KEY = process.env.PI_API_KEY!;

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {

    const { paymentId } = await req.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: "MISSING_PAYMENT_ID" },
        { status: 400 }
      );
    }

    /* VERIFY PAYMENT */

    const paymentRes = await fetch(
      `${PI_API_URL}/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Key ${PI_API_KEY}`
        },
        cache: "no-store"
      }
    );

    if (!paymentRes.ok) {
      return NextResponse.json(
        { error: "PAYMENT_NOT_FOUND" },
        { status: 404 }
      );
    }

    const payment = await paymentRes.json();

    if (payment.status !== "CREATED") {
      return NextResponse.json(
        { error: "INVALID_PAYMENT_STATUS" },
        { status: 400 }
      );
    }

    /* APPROVE */

    const approveRes = await fetch(
      `${PI_API_URL}/payments/${paymentId}/approve`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${PI_API_KEY}`
        }
      }
    );

    if (!approveRes.ok) {
      const text = await approveRes.text();
      console.error("PI APPROVE FAIL:", text);

      return NextResponse.json(
        { error: "PI_APPROVE_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (err) {

    console.error("PI APPROVE ERROR:", err);

    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
