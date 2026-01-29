import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getPiApiBase() {
  return process.env.NEXT_PUBLIC_PI_ENV === "testnet"
    ? "https://api.minepi.com/v2/sandbox/payments"
    : "https://api.minepi.com/v2/payments";
}

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
      `${getPiApiBase()}/${paymentId}/complete`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // 🔴 BẮT BUỘC
          Authorization: `Key ${process.env.PI_API_KEY}`,
        },
        body: JSON.stringify({ txid }),
      }
    );

    const text = await res.text();
    return new NextResponse(text, { status: res.status });
  } catch (err) {
    console.error("💥 PI COMPLETE ERROR:", err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
