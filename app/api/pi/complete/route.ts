import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PI_API_URL =
  process.env.PI_API_URL || "https://api.minepi.com/v2";

const PI_API_KEY = process.env.PI_API_KEY!;

export async function POST(req: Request) {
  try {

    const { paymentId, txid } = await req.json();

    if (!paymentId || !txid) {
      return NextResponse.json(
        { error: "MISSING_PAYMENT_DATA" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `${PI_API_URL}/payments/${paymentId}/complete`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${PI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ txid }),
        cache: "no-store",
      }
    );

    const text = await res.text();

    if (!res.ok) {
      console.error("PI COMPLETE FAIL:", text);
    }

    return new NextResponse(text || "{}", {
      status: res.status,
      headers: {
        "Content-Type": "application/json",
      },
    });

  } catch (err) {

    console.error("💥 PI COMPLETE ERROR:", err);

    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
