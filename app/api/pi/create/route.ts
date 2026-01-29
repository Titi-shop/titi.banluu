import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getPiApiBase() {
  return process.env.NEXT_PUBLIC_PI_ENV === "testnet"
    ? "https://api.minepi.com/v2/sandbox/payments"
    : "https://api.minepi.com/v2/payments";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { amount, memo, orderId, buyer, items, shipping } = body;

    if (!amount || !orderId) {
      return NextResponse.json(
        { error: "MISSING_REQUIRED_FIELDS" },
        { status: 400 }
      );
    }

    // ✅ PI CHỈ NHẬN paymentMetadata
    const payload = {
      amount: Number(amount),
      memo: memo || `Order ${orderId}`,
      paymentMetadata: {
        orderId,
        buyer,
        items,
        shipping,
      },
    };

    console.log("🟢 PI CREATE PAYLOAD:", payload);

    const res = await fetch(getPiApiBase(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${process.env.PI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const raw = await res.text();

    // ⚠️ log để debug
    if (!res.ok) {
      console.error("🔴 PI CREATE FAIL:", raw);
      return new NextResponse(raw, { status: res.status });
    }

    return new NextResponse(raw, { status: 200 });
  } catch (err) {
    console.error("💥 PI CREATE ERROR:", err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
