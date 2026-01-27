import { NextResponse } from "next/server";

interface CreatePaymentBody {
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreatePaymentBody;

    if (!body.amount || !body.memo) {
      return NextResponse.json(
        { error: "invalid payload" },
        { status: 400 }
      );
    }

    const API_KEY = process.env.PI_API_KEY;
    const API_URL =
      process.env.NEXT_PUBLIC_PI_ENV === "testnet"
        ? "https://api.minepi.com/v2/sandbox/payments"
        : "https://api.minepi.com/v2/payments";

    if (!API_KEY) {
      return NextResponse.json(
        { error: "missing PI_API_KEY" },
        { status: 500 }
      );
    }

    // ✅ FIX Ở ĐÂY (chỉ 1 dấu =)
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    return new NextResponse(text, { status: res.status });
  } catch (err) {
    console.error("💥 [PI CREATE ERROR]", err);
    return NextResponse.json(
      { error: "create payment failed" },
      { status: 500 }
    );
  }
}
