import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getPiApiBase() {
  return process.env.NEXT_PUBLIC_PI_NETWORK === "testnet"
    ? "https://api.minepi.com/v2/payments"
    : "https://api.minepi.com/v2/sandbox/payments";
}

export async function POST(req: Request) {
  try {
    const { amount, memo, metadata } = await req.json();

    if (typeof amount !== "number" || !memo) {
      return NextResponse.json(
        { error: "INVALID_PAYMENT_DATA" },
        { status: 400 }
      );
    }

    const apiKey = process.env.PI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "PI_API_KEY_MISSING" },
        { status: 500 }
      );
    }

    const res = await fetch(getPiApiBase(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        amount,
        memo,
        metadata,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("❌ PI CREATE FAILED:", data);
      return NextResponse.json(data, { status: 400 });
    }

    // ⚠️ BẮT BUỘC trả JSON
    return NextResponse.json(data);
  } catch (err) {
    console.error("💥 PI CREATE ERROR:", err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
