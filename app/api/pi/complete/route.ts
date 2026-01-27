import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { paymentId, txid } = (await req.json()) as {
      paymentId: string;
      txid: string;
    };

    if (!paymentId || !txid) {
      return NextResponse.json(
        { error: "missing params" },
        { status: 400 }
      );
    }

    const API_KEY = process.env.PI_API_KEY!;
    const API_URL =
      process.env.NEXT_PUBLIC_PI_ENV === "testnet"
        ? "https://api.minepi.com/v2/sandbox/payments"
        : "https://api.minepi.com/v2/payments";

    const res = await fetch(`${API_URL}/${paymentId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${API_KEY}`,
      },
      body: JSON.stringify({ txid }),
    });

    const data = await res.text();
    return new NextResponse(data, { status: res.status });
  } catch (err) {
    console.error("💥 [PI COMPLETE]", err);
    return NextResponse.json({ error: "complete failed" }, { status: 500 });
  }
}
