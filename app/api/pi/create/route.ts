import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, memo, metadata, uid } = body;

    if (!uid || !amount) {
      return NextResponse.json(
        { error: "missing uid or amount" },
        { status: 400 }
      );
    }

    const API_KEY = process.env.PI_API_KEY!;
    const API_URL =
      process.env.NEXT_PUBLIC_PI_ENV === "testnet"
        ? "https://api.minepi.com/v2/sandbox/payments"
        : "https://api.minepi.com/v2/payments";

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${API_KEY}`,
      },
      body: JSON.stringify({
        amount,
        memo,
        metadata,
        uid, // ✅ UID PI THẬT
      }),
    });

    const text = await res.text();

    if (!res.ok) {
      console.error("❌ Pi create payment error:", text);
    }

    return new NextResponse(text, {
      status: res.status,
    });
  } catch (err) {
    console.error("💥 create payment exception", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
