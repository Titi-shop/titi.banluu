import { NextResponse } from "next/server";

function getPiApiBase() {
  return process.env.NEXT_PUBLIC_PI_ENV === "testnet"
    ? "https://api.minepi.com/v2/sandbox/payments"
    : "https://api.minepi.com/v2/payments";
}

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
      `${getPiApiBase()}/${paymentId}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${process.env.PI_API_KEY}`,
        },
      }
    );

    const text = await res.text();
    return new NextResponse(text, { status: res.status });
  } catch (err) {
    console.error("💥 PI CANCEL ERROR:", err);
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
