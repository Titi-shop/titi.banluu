import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const piApiKey = process.env.PI_API_KEY;
    if (!piApiKey) {
      return NextResponse.json(
        { error: "Missing PI_API_KEY" },
        { status: 500 }
      );
    }

    const res = await fetch("https://api.minepi.com/v2/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${piApiKey}`,
      },
      body: JSON.stringify({
        amount: body.amount,
        memo: body.memo,
        metadata: body.metadata,
      }),
    });

    const payment = await res.json();

    if (!res.ok) {
      console.error("❌ Pi create payment error:", payment);
      return NextResponse.json(payment, { status: res.status });
    }

    // ⚠️ CÁI NÀY QUAN TRỌNG: trả nguyên object cho Pi SDK
    return NextResponse.json(payment);
  } catch (err) {
    console.error("❌ /api/pi/create error:", err);
    return NextResponse.json(
      { error: "Create Pi payment failed" },
      { status: 500 }
    );
  }
}
