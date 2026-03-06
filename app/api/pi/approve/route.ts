import { NextRequest, NextResponse } from "next/server";

const PI_API_URL = process.env.PI_API_URL!;
const PI_API_KEY = process.env.PI_API_KEY!;

export async function POST(req: NextRequest) {

  try {

    const { paymentId } = await req.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: "MISSING_PAYMENT_ID" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `${PI_API_URL}/payments/${paymentId}/approve`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${PI_API_KEY}`
        }
      }
    );

    if (!res.ok) {

      const text = await res.text();

      console.error("PI APPROVE FAIL:", text);

      return NextResponse.json(
        { error: "PI_APPROVE_FAILED" },
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
