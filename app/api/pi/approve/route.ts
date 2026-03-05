import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { paymentId } = await req.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: "MISSING_PAYMENT_ID" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `https://api.minepi.com/v2/payments/${paymentId}/approve`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${process.env.PI_API_KEY}`,
        },
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

    console.error("PI APPROVE ERROR:", err);

    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
