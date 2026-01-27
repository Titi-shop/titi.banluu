import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { paymentId } = (await req.json()) as { paymentId: string };

    if (!paymentId) {
      return NextResponse.json({ error: "missing paymentId" }, { status: 400 });
    }

    const API_KEY = process.env.PI_API_KEY!;
    const API_URL =
      process.env.NEXT_PUBLIC_PI_ENV === "testnet"
        ? "https://api.minepi.com/v2/sandbox/payments"
        : "https://api.minepi.com/v2/payments";

    const res = await fetch(`${API_URL}/${paymentId}/approve`, {
      method: "POST",
      headers: {
        Authorization: `Key ${API_KEY}`,
      },
    });

    const data = await res.text();
    return new NextResponse(data, { status: res.status });
  } catch (err) {
    console.error("💥 [PI APPROVE]", err);
    return NextResponse.json({ error: "approve failed" }, { status: 500 });
  }
}
