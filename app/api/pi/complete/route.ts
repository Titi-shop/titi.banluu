import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { paymentId, txid } = body;

    if (!paymentId || !txid) {
      return NextResponse.json(
        { error: "INVALID_PAYMENT_DATA" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `https://api.minepi.com/v2/payments/${paymentId}/complete`,
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

    if (!res.ok) {
      return NextResponse.json(
        { error: "PI_COMPLETE_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch {
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
