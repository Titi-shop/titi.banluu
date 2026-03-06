import { NextRequest, NextResponse } from "next/server";

const PI_API_URL = process.env.PI_API_URL!;
const PI_API_KEY = process.env.PI_API_KEY!;

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {

  try {

    const { paymentId } = await req.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: "PAYMENT_ID_MISSING" },
        { status: 400 }
      );
    }

    /* GET PAYMENT */

    const paymentRes = await fetch(
      `${PI_API_URL}/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Key ${PI_API_KEY}`,
        },
        cache: "no-store",
      }
    );

    if (!paymentRes.ok) {

      const text = await paymentRes.text();

      console.error("PI PAYMENT ERROR:", text);

      return NextResponse.json(
        { error: "PAYMENT_NOT_FOUND" },
        { status: 400 }
      );
    }

    const payment = await paymentRes.json();

    /* ALREADY APPROVED */

    if (payment.status === "APPROVED") {
      return NextResponse.json({ success: true });
    }

    /* INVALID STATUS */

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
          Authorization: `Key ${PI_API_KEY}`,
        },
      }
    );

    if (!approveRes.ok) {

      const text = await approveRes.text();

      console.error("PI APPROVE FAIL:", text);

      return NextResponse.json(
        { error: "APPROVE_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (err) {

    console.error(err);

    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
